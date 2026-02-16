import { getTaskStats, getAllTasks } from '@/lib/tasks-store';
import { getUsageStats } from '@/lib/usage-store';

export interface DigestPayload {
  generatedAt: string;
  summary: string;
  pendingTasks: string[];
  costTodayUsd: number;
  successRate: number;
}

export async function buildDailyDigest(): Promise<DigestPayload> {
  const stats = await getTaskStats();
  const usage = await getUsageStats();
  const pendingTasks = (await getAllTasks())
    .filter((task) => task.status === 'pending' || task.status === 'in_progress')
    .slice(0, 5)
    .map((task) => task.title);

  const summary = [
    `You have ${stats.pending} pending and ${stats.in_progress} in-progress tasks.`,
    `Today's AI spend is $${usage.costToday.toFixed(4)} with ${usage.successRate}% success rate.`,
  ].join(' ');

  return {
    generatedAt: new Date().toISOString(),
    summary,
    pendingTasks,
    costTodayUsd: usage.costToday,
    successRate: usage.successRate,
  };
}

export async function buildPendingReminderMessage(): Promise<string | null> {
  const pending = (await getAllTasks()).filter((task) => task.status === 'pending');
  if (pending.length === 0) return null;
  const titles = pending.slice(0, 3).map((task) => `- ${task.title}`).join('\n');
  return `Reminder: You still have ${pending.length} pending tasks.\n${titles}`;
}

