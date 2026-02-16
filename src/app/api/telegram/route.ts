/**
 * Telegram Webhook Endpoint
 *
 * Receives updates from Telegram and delegates to the grammY bot.
 * Set webhook URL to: https://your-domain.com/api/telegram
 *
 * Local dev: Use polling instead (see telegram/bot.ts)
 * Production: Set webhook via Telegram Bot API:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Lazy import to avoid startup crash when TELEGRAM_BOT_TOKEN is not set
    const { getWebhookHandler } = await import('@/lib/telegram/bot');
    const handler = getWebhookHandler();
    return handler(request);
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error?.message);

    // Don't expose internal errors to Telegram
    return NextResponse.json({ ok: true });
  }
}

// Health check for GET requests
export async function GET() {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  return NextResponse.json({
    status: hasToken ? 'ready' : 'not_configured',
    message: hasToken
      ? 'Telegram webhook is active'
      : 'Set TELEGRAM_BOT_TOKEN in .env.local to activate',
  });
}
