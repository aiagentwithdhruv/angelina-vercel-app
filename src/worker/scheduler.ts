import { getTaskStats, getAllTasks } from '@/lib/tasks-store';
import { getUsageStats } from '@/lib/usage-store';
import { getActiveGoals } from '@/lib/goals-store';
import { checkProactiveTriggers, ProactiveAlert } from '@/lib/proactive-push';

export interface DigestPayload {
  generatedAt: string;
  summary: string;
  pendingTasks: string[];
  overdueTasks: string[];
  activeGoals: Array<{ title: string; progress: number }>;
  costTodayUsd: number;
  successRate: number;
  modelBreakdown: Array<{ model: string; requests: number }>;
  alerts: ProactiveAlert[];
}

export async function buildDailyDigest(): Promise<DigestPayload> {
  const stats = await getTaskStats();
  const usage = await getUsageStats();
  const allTasks = await getAllTasks();
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const pendingTasks = allTasks
    .filter((task) => task.status === 'pending' || task.status === 'in_progress')
    .slice(0, 5)
    .map((task) => task.title);

  const overdueTasks = allTasks
    .filter(
      (task) =>
        task.status === 'pending' && now - new Date(task.createdAt).getTime() > threeDaysMs,
    )
    .slice(0, 5)
    .map((task) => task.title);

  // Goals
  let activeGoals: Array<{ title: string; progress: number }> = [];
  try {
    activeGoals = getActiveGoals().map((g) => ({ title: g.title, progress: g.progress }));
  } catch { /* goals unavailable */ }

  // Model breakdown (top 5)
  const modelBreakdown = usage.modelBreakdown
    ? usage.modelBreakdown.slice(0, 5).map((m) => ({ model: m.model, requests: m.requests }))
    : [];

  // Proactive alerts
  let alerts: ProactiveAlert[] = [];
  try {
    alerts = await checkProactiveTriggers();
  } catch { /* alerts unavailable */ }

  const summaryParts = [
    `You have ${stats.pending} pending and ${stats.in_progress} in-progress tasks.`,
  ];
  if (overdueTasks.length > 0) {
    summaryParts.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue (>3 days).`);
  }
  if (activeGoals.length > 0) {
    summaryParts.push(`${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}.`);
  }
  summaryParts.push(
    `Today's AI spend is $${usage.costToday.toFixed(4)} with ${usage.successRate}% success rate.`,
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: summaryParts.join(' '),
    pendingTasks,
    overdueTasks,
    activeGoals,
    costTodayUsd: usage.costToday,
    successRate: usage.successRate,
    modelBreakdown,
    alerts,
  };
}

export async function buildPendingReminderMessage(): Promise<string | null> {
  const pending = (await getAllTasks()).filter((task) => task.status === 'pending');
  if (pending.length === 0) return null;
  const titles = pending.slice(0, 3).map((task) => `- ${task.title}`).join('\n');
  return `Reminder: You still have ${pending.length} pending tasks.\n${titles}`;
}
