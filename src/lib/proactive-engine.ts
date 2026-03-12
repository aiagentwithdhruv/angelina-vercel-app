/**
 * Proactive Engine — generates real insights from DB data.
 * Runs on /api/worker/tick (every 15 min) for each active user.
 * Cost: $0 — DB queries only, no LLM calls.
 */

import { getPgPool } from '@/lib/db';
import { getTaskRepository } from '@/lib/tasks-repository';
import { getActiveGoals } from '@/lib/goals-store';
import { getCostToday } from '@/lib/usage-store';
import { getNodesByType } from '@/lib/knowledge-repository';
import { getGoogleAccessToken } from '@/lib/google-auth';
import { calendar } from '@/lib/google-services';

export interface ProactiveInsight {
  type: string;
  title: string;
  body: string;
  action_suggestion?: string;
  priority: 'low' | 'medium' | 'high';
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function runProactiveChecks(userId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  await Promise.all([
    checkOverdueTasks(insights),
    checkStaleFollowups(userId, insights),
    checkGoalDrift(insights),
    checkDailySpend(insights),
    checkCalendarPrep(userId, insights),
  ]);

  insights.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
  return insights;
}

// ── 1. Overdue Tasks ──
async function checkOverdueTasks(insights: ProactiveInsight[]): Promise<void> {
  try {
    const repo = getTaskRepository();
    const tasks = await repo.getAll();
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const overdue = tasks.filter(
      (t) => t.status === 'pending' && new Date(t.createdAt).getTime() < threeDaysAgo,
    );
    if (overdue.length === 0) return;
    const priority = overdue.length > 3 ? 'high' : 'medium';
    insights.push({
      type: 'overdue_tasks',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      body: `${overdue.slice(0, 3).map((t) => t.title).join(', ')}${overdue.length > 3 ? ` and ${overdue.length - 3} more` : ''}.`,
      action_suggestion: 'Reschedule or knock them out?',
      priority,
    });
  } catch { /* non-critical */ }
}

// ── 2. Stale Follow-ups (knowledge graph people) ──
async function checkStaleFollowups(userId: string, insights: ProactiveInsight[]): Promise<void> {
  try {
    const people = await getNodesByType(userId, 'person');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stale = people.filter(
      (p) => p.mention_count >= 3 && new Date(p.last_seen).getTime() < sevenDaysAgo,
    );
    for (const person of stale.slice(0, 3)) {
      const daysAgo = Math.round((Date.now() - new Date(person.last_seen).getTime()) / (24 * 60 * 60 * 1000));
      insights.push({
        type: 'stale_followup',
        title: `Follow up with ${person.title}`,
        body: `You haven't mentioned ${person.title} in ${daysAgo} days. Time to follow up?`,
        action_suggestion: 'Draft an email or message?',
        priority: 'medium',
      });
    }
  } catch { /* knowledge graph may not be set up yet */ }
}

// ── 3. Goal Progress / Drift ──
async function checkGoalDrift(insights: ProactiveInsight[]): Promise<void> {
  try {
    const goals = getActiveGoals();
    for (const goal of goals) {
      if (!goal.deadline) continue;
      const deadlineMs = new Date(goal.deadline).getTime();
      const createdMs = new Date(goal.createdAt).getTime();
      const totalDuration = deadlineMs - createdMs;
      const elapsed = Date.now() - createdMs;
      if (totalDuration <= 0) continue;
      const expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      const gap = expectedProgress - goal.progress;
      if (gap > 30) {
        insights.push({
          type: 'goal_drift',
          title: `"${goal.title}" is behind pace`,
          body: `Expected ${expectedProgress}% but at ${goal.progress}%. ${gap}% behind.`,
          action_suggestion: 'Reprioritize or adjust the deadline?',
          priority: 'high',
        });
      } else if (gap > 15) {
        insights.push({
          type: 'goal_drift',
          title: `"${goal.title}" needs attention`,
          body: `Expected ${expectedProgress}% but at ${goal.progress}%. Falling behind.`,
          priority: 'medium',
        });
      }
    }
  } catch { /* non-critical */ }
}

// ── 4. Daily Spend Alert ──
async function checkDailySpend(insights: ProactiveInsight[]): Promise<void> {
  try {
    const costToday = await getCostToday();
    const dailyCap = parseFloat(process.env.DAILY_COST_CAP_USD || '2');
    if (dailyCap <= 0) return;
    const pct = Math.round((costToday / dailyCap) * 100);
    if (pct >= 90) {
      insights.push({
        type: 'spend_alert',
        title: 'Daily AI spend at 90%+',
        body: `$${costToday.toFixed(2)} of $${dailyCap.toFixed(2)} cap used (${pct}%).`,
        action_suggestion: 'Switch to cheaper models or pause non-essential queries.',
        priority: 'high',
      });
    } else if (pct >= 75) {
      insights.push({
        type: 'spend_alert',
        title: 'Daily AI spend at 75%',
        body: `$${costToday.toFixed(2)} of $${dailyCap.toFixed(2)} cap (${pct}%).`,
        priority: 'medium',
      });
    } else if (pct >= 50) {
      insights.push({
        type: 'spend_alert',
        title: 'Half of daily AI budget used',
        body: `$${costToday.toFixed(2)} of $${dailyCap.toFixed(2)} cap (${pct}%).`,
        priority: 'low',
      });
    }
  } catch { /* non-critical */ }
}

// ── 5. Calendar Prep (if Google connected) ──
async function checkCalendarPrep(userId: string, insights: ProactiveInsight[]): Promise<void> {
  try {
    const token = await getGoogleAccessToken();
    if (!token) return;
    const events = await calendar.getEvents(token, 3);
    if (!events || events.length === 0) return;
    const now = Date.now();
    const thirtyMin = 30 * 60 * 1000;
    for (const ev of events) {
      if (!ev.start) continue;
      const startMs = new Date(ev.start).getTime();
      const diff = startMs - now;
      if (diff > 0 && diff <= thirtyMin) {
        const mins = Math.round(diff / 60000);
        let context = '';
        try {
          const people = await getNodesByType(userId, 'person');
          const matchTitle = ev.title?.toLowerCase() || '';
          const match = people.find((p) => matchTitle.includes(p.title.toLowerCase()));
          if (match) {
            context = ` Last mentioned ${match.title} ${Math.round((now - new Date(match.last_seen).getTime()) / 86400000)} days ago.`;
          }
        } catch { /* ignore */ }
        insights.push({
          type: 'calendar_prep',
          title: `"${ev.title}" in ${mins} min`,
          body: `Starts at ${new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.${context}`,
          action_suggestion: 'Need prep notes or context from past conversations?',
          priority: 'high',
        });
      }
    }
  } catch { /* Google not connected or token expired */ }
}
