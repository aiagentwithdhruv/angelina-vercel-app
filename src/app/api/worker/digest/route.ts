import { NextRequest, NextResponse } from 'next/server';
import { buildDailyDigest, buildPendingReminderMessage } from '@/worker/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  const provided = request.headers.get('x-worker-key');
  if (provided === configured) return true;
  // Vercel cron sends a special header
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) return true;
  return false;
}

async function pushToTelegram(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const digest = await buildDailyDigest();
  const reminder = await buildPendingReminderMessage();

  // Build human-friendly message
  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
  const parts: string[] = [`🤖 *Angelina Pulse* (${now} IST)`, '', digest.summary];
  if (digest.pendingTasks.length > 0) {
    parts.push('', '📋 *Pending Tasks:*');
    digest.pendingTasks.forEach((t) => parts.push(`  • ${t}`));
  }
  if (digest.costTodayUsd > 0) {
    parts.push('', `💰 Spend today: $${digest.costTodayUsd.toFixed(4)}`);
  }
  const message = parts.join('\n');

  // Push to Telegram if requested
  const pushMode = new URL(request.url).searchParams.get('push');
  let pushed = false;
  if (pushMode === 'telegram') {
    pushed = await pushToTelegram(message);
    console.log(`[Digest] Telegram push: ${pushed ? 'sent' : 'failed/not configured'}`);
  }

  return NextResponse.json({ digest, reminder, pushed, message });
}

