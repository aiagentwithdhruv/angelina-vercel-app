/**
 * Prompt Injection Defense (Rule 70 — Security)
 *
 * Sanitizes user input before it reaches the LLM to prevent
 * prompt injection attacks, system prompt overrides, and
 * hidden unicode manipulation.
 */

// Injection marker patterns (case-insensitive)
const INJECTION_MARKERS = /\[SYSTEM\]|\[INST\]|\[\/INST\]|<<SYS>>|<\/s>|<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/gi;

// Attempts to override system prompt
const OVERRIDE_PATTERNS = /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules|directives)|you\s+are\s+now\s+(a\s+)?new\s+AI|disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts)|forget\s+(all\s+)?(your|previous)\s+(instructions|rules|training)|override\s+(system|previous)\s+(prompt|instructions)|new\s+instructions?\s*:/gi;

// Hidden unicode characters (zero-width spaces, joiners, RTL/LTR overrides, etc.)
const HIDDEN_UNICODE = /[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD\u034F\u061C\u180E\u2060-\u2064\u2066-\u206F]/g;

/**
 * Sanitize user input to strip prompt injection attempts.
 * Returns the cleaned string. Logs a warning if an injection attempt is detected.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return input;

  let cleaned = input;
  let injectionDetected = false;

  // 1. Strip injection markers
  const afterMarkers = cleaned.replace(INJECTION_MARKERS, '');
  if (afterMarkers !== cleaned) { injectionDetected = true; cleaned = afterMarkers; }

  // 2. Strip system prompt override attempts
  const afterOverrides = cleaned.replace(OVERRIDE_PATTERNS, '');
  if (afterOverrides !== cleaned) { injectionDetected = true; cleaned = afterOverrides; }

  // 3. Strip hidden unicode characters
  const afterUnicode = cleaned.replace(HIDDEN_UNICODE, '');
  if (afterUnicode !== cleaned) { injectionDetected = true; cleaned = afterUnicode; }

  if (injectionDetected) {
    console.warn('[Prompt Guard] Injection attempt detected and sanitized in user input');
  }

  return cleaned.trim();
}
