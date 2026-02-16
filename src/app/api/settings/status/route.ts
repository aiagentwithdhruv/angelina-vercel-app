/**
 * Settings Status API
 * Returns connection status for all configured services
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const status: Record<string, 'connected' | 'error' | null> = {};

  try {
    const cookieStore = await cookies();

    // Check environment variables
    if (process.env.OPENAI_API_KEY) status.openai = 'connected';
    if (process.env.ANTHROPIC_API_KEY) status.anthropic = 'connected';
    if (process.env.OPENROUTER_API_KEY) status.openrouter = 'connected';
    if (process.env.GOOGLE_GEMINI_API_KEY) status.gemini = 'connected';
    if (process.env.PERPLEXITY_API_KEY) status.perplexity = 'connected';
    if (process.env.GROQ_API_KEY) status.groq = 'connected';
    if (process.env.MOONSHOT_API_KEY) status.moonshot = 'connected';
    if (process.env.GITHUB_TOKEN) status.github = 'connected';
    if (process.env.CLICKUP_API_KEY) status.clickup = 'connected';
    if (process.env.N8N_URL) status.n8n = 'connected';
    if (process.env.MCP_SERVER_URL) status.mcp = 'connected';
    if (process.env.TWILIO_ACCOUNT_SID) status.twilio_sid = 'connected';
    if (process.env.TWILIO_AUTH_TOKEN) status.twilio_token = 'connected';
    if (process.env.TWILIO_PHONE_NUMBER) status.twilio_phone = 'connected';
    if (process.env.DHRUV_PHONE_NUMBER) status.dhruv_phone = 'connected';

    // Check saved API keys in cookies
    const savedKeys = [
      'openai', 'anthropic', 'openrouter', 'gemini', 'groq', 'moonshot',
      'perplexity', 'github', 'clickup', 'n8n', 'mcp',
      'twilio_sid', 'twilio_token', 'twilio_phone', 'dhruv_phone',
    ];

    for (const keyId of savedKeys) {
      const savedKey = cookieStore.get(`api_key_${keyId}`);
      if (savedKey?.value) {
        status[keyId] = 'connected';
      }
    }

    // Check Google OAuth
    const googleToken = cookieStore.get('google_access_token');
    if (googleToken) {
      status.google = 'connected';
    }

  } catch (error) {
    const digest = (error as { digest?: string } | undefined)?.digest;
    // Ignore expected build-time dynamic usage warning noise on Vercel.
    if (digest !== 'DYNAMIC_SERVER_USAGE') {
      console.error('[Settings Status] Error:', error);
    }
  }

  return NextResponse.json({ status });
}
