/**
 * Tool Retry — Self-healing wrapper for tool API calls.
 *
 * Retries transient failures (network, 5xx) up to 2 times with short delay.
 * Never retries 4xx (user error) or auth failures.
 * Zero extra cost — only retries the same cheap fetch call.
 */

export async function withToolRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      // Don't retry client errors (auth, bad request)
      if (
        msg.includes('unauthorized') ||
        msg.includes('forbidden') ||
        msg.includes('bad request') ||
        msg.includes('not configured') ||
        msg.includes('invalid')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = 500 * (attempt + 1);
        console.warn(`[Tool Retry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, msg);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
}
