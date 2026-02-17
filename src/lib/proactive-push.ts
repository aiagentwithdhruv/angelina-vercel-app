/**
 * Proactive Push — Shared Telegram push + budget alerts + event triggers.
 *
 * Used by:
 * - Chat route (budget threshold alerts)
 * - Digest cron (overdue tasks, goal progress, token expiry)
 * - Any future proactive notification
 *
 * Zero API cost — pure computation + Telegram sendMessage.
 */

import { getAllTasks } from '@/lib/tasks-store';
import { getCostToday } from '@/lib/usage-store';

// ── Telegram Push (shared) ──

export async function getTelegramCreds(): Promise<{ botToken: string; chatId: string } | null> {
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) return { botToken, chatId };
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    botToken = botToken || cookieStore.get('api_key_telegram_bot_token')?.value;
    chatId = chatId || cookieStore.get('api_key_telegram_chat_id')?.value;
  } catch { /* server context — no cookies */ }
  if (botToken && chatId) return { botToken, chatId };
  return null;
}

export async function pushToTelegram(text: string): Promise<boolean> {
  const creds = await getTelegramCreds();
  if (!creds) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: creds.chatId, text, parse_mode: 'Markdown' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Budget Alerts ──

// Track which thresholds have been alerted this server lifecycle
const alertedThresholds = new Set<string>();

export async function checkBudgetAlert(costAfterRequest: number): Promise<void> {
  const dailyCap = Number(process.env.DAILY_COST_CAP_USD) || 2;
  const thresholds = [
    { pct: 0.50, label: '50%' },
    { pct: 0.75, label: '75%' },
    { pct: 1.00, label: '100%' },
  ];

  for (const { pct, label } of thresholds) {
    const key = `${new Date().toISOString().slice(0, 10)}_${label}`;
    if (alertedThresholds.has(key)) continue;

    if (costAfterRequest >= dailyCap * pct) {
      alertedThresholds.add(key);
      const msg = pct >= 1.0
        ? `🚨 *Budget Alert*: Daily cap reached!\nSpent: $${costAfterRequest.toFixed(4)} / $${dailyCap}\nNew requests will be blocked until tomorrow.`
        : `💰 *Budget Alert*: ${label} of daily cap used.\nSpent: $${costAfterRequest.toFixed(4)} / $${dailyCap}`;
      pushToTelegram(msg).catch(() => {});
    }
  }
}

// ── Proactive Triggers (called from digest cron) ──

export interface ProactiveAlert {
  type: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
}

export async function checkProactiveTriggers(): Promise<ProactiveAlert[]> {
  const alerts: ProactiveAlert[] = [];
  const now = Date.now();

  // 1. Overdue tasks (pending > 3 days)
  try {
    const tasks = await getAllTasks();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const overdue = tasks.filter(
      (t) => t.status === 'pending' && now - new Date(t.createdAt).getTime() > threeDaysMs,
    );
    if (overdue.length > 0) {
      alerts.push({
        type: 'overdue_tasks',
        message: `⏰ *${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}* (pending > 3 days):\n${overdue.slice(0, 5).map((t) => `  • ${t.title}`).join('\n')}`,
        priority: 'warning',
      });
    }

    // 2. High-priority tasks not started after 24h
    const oneDayMs = 24 * 60 * 60 * 1000;
    const staleHigh = tasks.filter(
      (t) =>
        t.status === 'pending' &&
        t.priority === 'high' &&
        now - new Date(t.createdAt).getTime() > oneDayMs,
    );
    if (staleHigh.length > 0) {
      alerts.push({
        type: 'stale_high_priority',
        message: `🔴 *${staleHigh.length} high-priority task${staleHigh.length > 1 ? 's' : ''} not started*:\n${staleHigh.slice(0, 3).map((t) => `  • ${t.title}`).join('\n')}`,
        priority: 'urgent',
      });
    }
  } catch {
    // Tasks unavailable
  }

  // 3. Cost threshold
  try {
    const costToday = await getCostToday();
    const dailyCap = Number(process.env.DAILY_COST_CAP_USD) || 2;
    if (costToday >= dailyCap * 0.75) {
      alerts.push({
        type: 'cost_warning',
        message: `💰 Daily spend at $${costToday.toFixed(4)} / $${dailyCap} (${Math.round((costToday / dailyCap) * 100)}%)`,
        priority: costToday >= dailyCap ? 'urgent' : 'warning',
      });
    }
  } catch {
    // Cost data unavailable
  }

  return alerts;
}
