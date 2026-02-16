/**
 * Resilient Provider — Auto-fallback and retry logic for AI provider calls
 *
 * Strategy:
 * - 429 Rate Limit → exponential backoff + retry same provider
 * - 500+ Server Error → try next provider in fallback chain
 * - 400 Bad Request → don't retry, return error immediately
 * - Timeout → retry with same provider once, then fallback
 *
 * Fallback chain: Claude Opus 4.6 → OpenAI → Google → OpenRouter
 */

export interface ProviderCallOptions {
  provider: string;
  model: string;
  apiKey: string;
  callFn: (apiKey: string, model: string) => Promise<any>;
}

export interface FallbackProvider {
  provider: string;
  model: string;
  envKey: string;
  cookieId: string;
}

// Default fallback chain — order matters (most reliable first)
const FALLBACK_CHAIN: FallbackProvider[] = [
  { provider: 'anthropic', model: 'claude-opus-4-6', envKey: 'ANTHROPIC_API_KEY', cookieId: 'anthropic' },
  { provider: 'openai', model: 'gpt-4.1', envKey: 'OPENAI_API_KEY', cookieId: 'openai' },
  { provider: 'google', model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY', cookieId: 'gemini' },
  { provider: 'openrouter', model: 'or:google/gemini-3-flash-preview', envKey: 'OPENROUTER_API_KEY', cookieId: 'openrouter' },
];

interface ResilientError {
  status?: number;
  message: string;
  retryable: boolean;
}

function classifyError(error: any): ResilientError {
  const message = error?.message || String(error);
  const status = error?.status || error?.statusCode;

  // Rate limited
  if (status === 429 || message.includes('rate limit') || message.includes('Rate limit')) {
    return { status: 429, message, retryable: true };
  }

  // Server error
  if (status >= 500 || message.includes('Internal Server Error') || message.includes('503')) {
    return { status: status || 500, message, retryable: true };
  }

  // Bad request (don't retry)
  if (status === 400 || message.includes('Bad Request') || message.includes('Invalid')) {
    return { status: 400, message, retryable: false };
  }

  // Auth error (don't retry same provider, but can try fallback)
  if (status === 401 || status === 403 || message.includes('Unauthorized') || message.includes('Invalid API Key')) {
    return { status: status || 401, message, retryable: false };
  }

  // Context length exceeded
  if (message.includes('context length') || message.includes('maximum') || message.includes('too long')) {
    return { status: 400, message: 'Context length exceeded', retryable: false };
  }

  // TLS / certificate errors
  if (message.includes('self-signed certificate') || message.includes('certificate') || message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
    return { status: 495, message: `TLS error: ${message}`, retryable: true };
  }

  // Timeout
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('AbortError')) {
    return { status: 408, message: 'Request timeout', retryable: true };
  }

  // Unknown — assume retryable
  return { status: status || 0, message, retryable: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resolve API key from env vars (cookies need to be handled by caller)
 */
function getEnvApiKey(envKey: string): string | undefined {
  return process.env[envKey];
}

/**
 * Execute a provider call with retry + fallback logic.
 *
 * @param primaryCall - The primary provider call to try first
 * @param buildCallFn - A function that builds a provider call for a given provider/model/apiKey
 *                      Used for fallback providers
 * @param maxRetries - Max retries per provider (default: 1)
 */
export async function resilientCall(
  primaryCall: ProviderCallOptions,
  buildCallFn: (provider: string, model: string, apiKey: string) => Promise<any>,
  maxRetries = 1,
): Promise<{ result: any; provider: string; model: string; fallback: boolean }> {
  // Try primary provider first
  try {
    const result = await primaryCall.callFn(primaryCall.apiKey, primaryCall.model);
    return { result, provider: primaryCall.provider, model: primaryCall.model, fallback: false };
  } catch (error: any) {
    const classified = classifyError(error);
    console.warn(`[Resilient] Primary ${primaryCall.provider}/${primaryCall.model} failed: ${classified.message}`);

    // Non-retryable AND non-fallbackable (bad request = user's problem)
    if (!classified.retryable && classified.status === 400) {
      throw error;
    }

    // Retry same provider for rate limits
    if (classified.retryable && classified.status === 429) {
      for (let i = 0; i < maxRetries; i++) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`[Resilient] Retrying ${primaryCall.provider} in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        try {
          const result = await primaryCall.callFn(primaryCall.apiKey, primaryCall.model);
          return { result, provider: primaryCall.provider, model: primaryCall.model, fallback: false };
        } catch (retryError: any) {
          console.warn(`[Resilient] Retry ${i + 1} failed:`, retryError?.message);
        }
      }
    }

    // Try fallback chain
    for (const fallback of FALLBACK_CHAIN) {
      // Skip the provider we already tried
      if (fallback.provider === primaryCall.provider) continue;

      const apiKey = getEnvApiKey(fallback.envKey);
      if (!apiKey) continue;

      try {
        console.log(`[Resilient] Falling back to ${fallback.provider}/${fallback.model}`);
        const result = await buildCallFn(fallback.provider, fallback.model, apiKey);
        return { result, provider: fallback.provider, model: fallback.model, fallback: true };
      } catch (fallbackError: any) {
        console.warn(`[Resilient] Fallback ${fallback.provider} failed:`, fallbackError?.message);
        continue;
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${classified.message}`);
  }
}
