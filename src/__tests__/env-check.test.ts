import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnv } from '@/lib/env-check';
import type { EnvCheckResult } from '@/lib/env-check';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Set specific env vars for a test, clearing all others we care about.
 * Restores original env after each test via beforeEach.
 */
function setEnv(overrides: Record<string, string | undefined>) {
  const allKeys = [
    'AUTH_PASSWORD',
    'NEXT_PUBLIC_APP_URL',
    'OPENAI_API_KEY',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'EURI_API_KEY',
  ];
  for (const key of allKeys) {
    if (overrides[key] !== undefined) {
      process.env[key] = overrides[key];
    } else {
      delete process.env[key];
    }
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

const originalEnv = { ...process.env };

beforeEach(() => {
  // Restore original env before each test
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

// ─── All Required Vars Set ───────────────────────────────────────────────────

describe('validateEnv — all required vars present', () => {
  it('returns valid when all required and recommended vars are set', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
      OPENAI_API_KEY: 'sk-xxx',
      GROQ_API_KEY: 'gsk-xxx',
      GEMINI_API_KEY: 'gem-xxx',
      EURI_API_KEY: 'euri-xxx',
    });

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing_required).toEqual([]);
    expect(result.missing_recommended).toEqual([]);
  });

  it('returns valid when only required vars are set (recommended missing)', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing_required).toEqual([]);
    expect(result.missing_recommended.length).toBeGreaterThan(0);
  });
});

// ─── Missing Required Vars ───────────────────────────────────────────────────

describe('validateEnv — missing required vars', () => {
  it('throws when AUTH_PASSWORD is missing', () => {
    setEnv({
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
    });

    expect(() => validateEnv()).toThrowError(/AUTH_PASSWORD/);
  });

  it('throws when NEXT_PUBLIC_APP_URL is missing', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
    });

    expect(() => validateEnv()).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it('throws when all required vars are missing', () => {
    setEnv({});

    expect(() => validateEnv()).toThrowError(/Required env vars missing/);
  });

  it('error message includes all missing required var names', () => {
    setEnv({});

    try {
      validateEnv();
      // Should not reach here
      expect.fail('validateEnv should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('AUTH_PASSWORD');
      expect(err.message).toContain('NEXT_PUBLIC_APP_URL');
    }
  });
});

// ─── Missing Recommended Vars ────────────────────────────────────────────────

describe('validateEnv — missing recommended vars', () => {
  it('warns for each missing recommended var but does not throw', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = validateEnv();
    expect(result.valid).toBe(true);

    // Should warn for each missing recommended var
    expect(warnSpy).toHaveBeenCalledTimes(4);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('OPENAI_API_KEY'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GROQ_API_KEY'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GEMINI_API_KEY'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('EURI_API_KEY'));
  });

  it('reports missing recommended vars in the result', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
      OPENAI_API_KEY: 'sk-xxx',
      // GROQ, GEMINI, EURI missing
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing_recommended).toContain('GROQ_API_KEY');
    expect(result.missing_recommended).toContain('GEMINI_API_KEY');
    expect(result.missing_recommended).toContain('EURI_API_KEY');
    expect(result.missing_recommended).not.toContain('OPENAI_API_KEY');
  });

  it('returns empty missing_recommended when all recommended vars are set', () => {
    setEnv({
      AUTH_PASSWORD: 'secret123',
      NEXT_PUBLIC_APP_URL: 'https://angelina.ai',
      OPENAI_API_KEY: 'sk-xxx',
      GROQ_API_KEY: 'gsk-xxx',
      GEMINI_API_KEY: 'gem-xxx',
      EURI_API_KEY: 'euri-xxx',
    });

    const result = validateEnv();
    expect(result.missing_recommended).toEqual([]);
  });
});
