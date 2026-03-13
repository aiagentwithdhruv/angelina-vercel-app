/**
 * Free Tier Usage Gates
 *
 * Tracks daily message count per user via in-memory counter.
 * The actual usage_logs table (via logUsage) handles persistent tracking.
 * This module provides fast gate checks + upgrade prompts.
 *
 * Free tier = 30 messages/day.
 */

const FREE_TIER_DAILY_LIMIT = 30;

// In-memory counter — resets on server restart (conservative: allows more, not less)
const memoryCounter: Record<string, { count: number; date: string }> = {};

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export interface UsageGate {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  upgradeMessage?: string;
}

export async function checkFreeGate(userId: string = 'default'): Promise<UsageGate> {
  const today = todayKey();
  const key = `${userId}:${today}`;
  const used = memoryCounter[key]?.date === today ? memoryCounter[key].count : 0;

  const remaining = Math.max(0, FREE_TIER_DAILY_LIMIT - used);
  const percentage = Math.min(100, Math.round((used / FREE_TIER_DAILY_LIMIT) * 100));

  if (used >= FREE_TIER_DAILY_LIMIT) {
    return {
      allowed: false,
      used,
      limit: FREE_TIER_DAILY_LIMIT,
      remaining: 0,
      percentage: 100,
      upgradeMessage: `You've used all ${FREE_TIER_DAILY_LIMIT} free messages today. Upgrade to Angelina Pro for unlimited conversations, priority voice, and autonomous actions.`,
    };
  }

  return { allowed: true, used, limit: FREE_TIER_DAILY_LIMIT, remaining, percentage };
}

export async function incrementUsage(userId: string = 'default'): Promise<void> {
  const today = todayKey();
  const key = `${userId}:${today}`;
  if (!memoryCounter[key] || memoryCounter[key].date !== today) {
    memoryCounter[key] = { count: 1, date: today };
  } else {
    memoryCounter[key].count++;
  }
}

export async function getUsageSummary(userId: string = 'default'): Promise<{
  messagesUsed: number;
  messagesLimit: number;
  messagesRemaining: number;
  percentage: number;
  tier: 'free' | 'pro';
}> {
  const gate = await checkFreeGate(userId);
  return {
    messagesUsed: gate.used,
    messagesLimit: gate.limit,
    messagesRemaining: gate.remaining,
    percentage: gate.percentage,
    tier: 'free',
  };
}
