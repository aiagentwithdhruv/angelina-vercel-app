/**
 * Environment variable validation.
 * - Required vars: throws if missing.
 * - Recommended vars: logs warnings, does not throw.
 */

const REQUIRED_VARS = ['AUTH_PASSWORD', 'NEXT_PUBLIC_APP_URL'] as const;

const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'EURI_API_KEY',
] as const;

export interface EnvCheckResult {
  valid: boolean;
  missing_required: string[];
  missing_recommended: string[];
}

export function validateEnv(): EnvCheckResult {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missingRequired.push(key);
    }
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      missingRecommended.push(key);
      console.warn(`[env-check] Recommended env var missing: ${key}`);
    }
  }

  if (missingRequired.length > 0) {
    const msg = `Required env vars missing: ${missingRequired.join(', ')}`;
    throw new Error(msg);
  }

  return {
    valid: true,
    missing_required: [],
    missing_recommended: missingRecommended,
  };
}
