/**
 * Future Angelina — Activation Code Guard
 *
 * Second layer of security beyond login. Even after authentication,
 * users must provide the activation code before Angelina processes requests.
 *
 * - Activation code set via ANGELINA_ACTIVATION_CODE env var
 * - Sessions expire after 30 minutes of inactivity
 * - Each interaction refreshes the timer
 *
 * Env:
 *   ANGELINA_ACTIVATION_CODE — Secret code (e.g., "3478", "future angelina")
 *   ACTIVATION_TIMEOUT_MIN   — Minutes before re-auth (default: 30)
 */

interface ActivationState {
  activatedAt: number;
  lastActivity: number;
}

// In-memory activation store (keyed by sessionId or chatId)
const activations = new Map<string, ActivationState>();

// Cleanup expired entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function getTimeoutMs(): number {
  const minutes = Number(process.env.ACTIVATION_TIMEOUT_MIN) || 30;
  return minutes * 60 * 1000;
}

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const timeout = getTimeoutMs();
  const keys = Array.from(activations.keys());
  for (const key of keys) {
    const state = activations.get(key)!;
    if (now - state.lastActivity > timeout) {
      activations.delete(key);
    }
  }
}

/**
 * Check if a session is currently activated.
 * Returns true if activated and not expired.
 */
export function isActivated(sessionId: string): boolean {
  cleanup();

  const code = process.env.ANGELINA_ACTIVATION_CODE;
  // If no activation code is configured, skip this guard entirely
  if (!code) return true;

  const state = activations.get(sessionId);
  if (!state) return false;

  const timeout = getTimeoutMs();
  if (Date.now() - state.lastActivity > timeout) {
    activations.delete(sessionId);
    return false;
  }

  return true;
}

/**
 * Attempt to activate a session with the given code.
 * Returns true if the code matches and session is now activated.
 */
export function tryActivate(sessionId: string, userInput: string): boolean {
  const code = process.env.ANGELINA_ACTIVATION_CODE;
  if (!code) return true; // No code configured = always active

  // Case-insensitive, trimmed comparison
  const inputClean = userInput.trim().toLowerCase();
  const codeClean = code.trim().toLowerCase();

  if (inputClean === codeClean) {
    const now = Date.now();
    activations.set(sessionId, { activatedAt: now, lastActivity: now });
    console.log(`[Future Angelina] Session ${sessionId.slice(0, 8)}... activated`);
    return true;
  }

  return false;
}

/**
 * Refresh the activity timer for an activated session.
 * Call this on every interaction to extend the 30-min window.
 */
export function refreshActivation(sessionId: string): void {
  const state = activations.get(sessionId);
  if (state) {
    state.lastActivity = Date.now();
  }
}

/**
 * Deactivate a session (manual logout / security reset).
 */
export function deactivate(sessionId: string): void {
  activations.delete(sessionId);
  console.log(`[Future Angelina] Session ${sessionId.slice(0, 8)}... deactivated`);
}

/**
 * Get remaining time before expiry in minutes.
 * Returns -1 if not activated.
 */
export function getTimeRemaining(sessionId: string): number {
  const state = activations.get(sessionId);
  if (!state) return -1;

  const timeout = getTimeoutMs();
  const elapsed = Date.now() - state.lastActivity;
  const remaining = timeout - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 60000) : -1;
}

/**
 * Check if activation code feature is enabled.
 */
export function isActivationEnabled(): boolean {
  return Boolean(process.env.ANGELINA_ACTIVATION_CODE);
}
