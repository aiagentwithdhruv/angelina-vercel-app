/**
 * Health endpoint — GET /api/health
 * No auth required (added to PUBLIC_PATHS in middleware).
 */

import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env-check';

function hasEnv(key: string): boolean {
  return Boolean(process.env[key]);
}

async function checkDb(): Promise<{ connected: boolean; latency_ms?: number; error?: string }> {
  try {
    const { getPgPool } = await import('@/lib/db');
    const pool = getPgPool();
    const start = Date.now();
    await pool.query('SELECT 1');
    return { connected: true, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

export async function GET() {
  // Env validation
  let envStatus: 'ok' | 'degraded' | 'missing_required' = 'ok';
  let missingRecommended: string[] = [];
  let missingRequired: string[] = [];

  try {
    const result = validateEnv();
    missingRecommended = result.missing_recommended;
    if (missingRecommended.length > 0) {
      envStatus = 'degraded';
    }
  } catch (err: unknown) {
    envStatus = 'missing_required';
    if (err instanceof Error) {
      const match = err.message.match(/missing: (.+)/);
      missingRequired = match ? match[1].split(', ') : [];
    }
  }

  // DB check
  const db = await checkDb();

  // Overall status
  const isHealthy = envStatus !== 'missing_required' && db.connected;

  const body = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    tools: 25,
    agents: 5,
    providers: {
      openai: hasEnv('OPENAI_API_KEY'),
      groq: hasEnv('GROQ_API_KEY'),
      gemini: hasEnv('GEMINI_API_KEY'),
      euri: hasEnv('EURI_API_KEY'),
      moonshot: hasEnv('MOONSHOT_API_KEY'),
      openrouter: hasEnv('OPENROUTER_API_KEY'),
    },
    database: db,
    env: {
      status: envStatus,
      ...(missingRequired.length > 0 && { missing_required: missingRequired }),
      ...(missingRecommended.length > 0 && { missing_recommended: missingRecommended }),
    },
  };

  return NextResponse.json(body, { status: isHealthy ? 200 : 503 });
}
