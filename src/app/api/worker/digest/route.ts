import { NextRequest, NextResponse } from 'next/server';
import { buildDailyDigest, buildPendingReminderMessage } from '@/worker/scheduler';
import { pushToTelegram } from '@/lib/proactive-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  const provided = request.headers.get('x-worker-key');
  if (provided === configured) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const digest = await buildDailyDigest();
  const reminder = await buildPendingReminderMessage();

  // Build rich human-friendly message
  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
  const parts: string[] = [`🤖 *Angelina Pulse* (${now} IST)`, '', digest.summary];

  // Proactive alerts (urgent first)
  if (digest.alerts && digest.alerts.length > 0) {
    parts.push('');
    for (const alert of digest.alerts) {
      parts.push(alert.message);
    }
  }

  // Overdue tasks
  if (digest.overdueTasks && digest.overdueTasks.length > 0) {
    parts.push('', `⏰ *Overdue (>3 days):*`);
    digest.overdueTasks.forEach((t) => parts.push(`  • ${t}`));
  }

  // Pending tasks
  if (digest.pendingTasks.length > 0) {
    parts.push('', '📋 *Pending Tasks:*');
    digest.pendingTasks.forEach((t) => parts.push(`  • ${t}`));
  }

  // Goals
  if (digest.activeGoals && digest.activeGoals.length > 0) {
    parts.push('', '🎯 *Goals:*');
    digest.activeGoals.forEach((g) => {
      const bar = `${'█'.repeat(Math.floor(g.progress / 10))}${'░'.repeat(10 - Math.floor(g.progress / 10))}`;
      parts.push(`  [${bar}] ${g.progress}% — ${g.title}`);
    });
  }

  // Cost + models
  if (digest.costTodayUsd > 0) {
    parts.push('', `💰 Spend today: $${digest.costTodayUsd.toFixed(4)}`);
  }
  if (digest.modelBreakdown && digest.modelBreakdown.length > 0) {
    parts.push(`📊 Models: ${digest.modelBreakdown.map((m) => `${m.model}(${m.requests})`).join(', ')}`);
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

