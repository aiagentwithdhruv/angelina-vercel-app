import { getUsageRepository, UsageEntry } from '@/lib/usage-repository';

export interface UsageStats {
  totalRequests: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  successRate: number;
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
  dailyCosts: Array<{ date: string; cost: number; requests: number }>;
  modelBreakdown: Array<{ model: string; requests: number; cost: number; tokens: number }>;
  providerBreakdown: Array<{ provider: string; requests: number; cost: number }>;
  toolUsage: Array<{ tool: string; count: number; percentage: number }>;
  recentEntries: UsageEntry[];
  avgCostPerSuccess: number;
}

const repo = getUsageRepository();

// ── Public API ──

export async function logUsage(entry: Omit<UsageEntry, 'id'>): Promise<UsageEntry> {
  return repo.append(entry);
}

export async function getUsageStats(): Promise<UsageStats> {
  const entries = await repo.listAll();
  const now = new Date();

  // Time boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Basic aggregates
  const totalRequests = entries.length;
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const totalInputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0);
  const totalOutputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0);
  const successCount = entries.filter(e => e.success).length;
  const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;
  const successCost = entries.filter((e) => e.success).reduce((sum, e) => sum + e.cost, 0);
  const avgCostPerSuccess = successCount > 0 ? successCost / successCount : 0;

  // Time-filtered costs
  const costToday = entries
    .filter(e => e.timestamp >= todayStart)
    .reduce((sum, e) => sum + e.cost, 0);
  const costThisWeek = entries
    .filter(e => e.timestamp >= weekStart)
    .reduce((sum, e) => sum + e.cost, 0);
  const costThisMonth = entries
    .filter(e => e.timestamp >= monthStart)
    .reduce((sum, e) => sum + e.cost, 0);

  // Daily costs for chart (last 7 days)
  const dailyCosts = getDailyCosts(entries, 7);

  // Model breakdown
  const modelMap = new Map<string, { requests: number; cost: number; tokens: number }>();
  for (const e of entries) {
    const existing = modelMap.get(e.model) || { requests: 0, cost: 0, tokens: 0 };
    existing.requests++;
    existing.cost += e.cost;
    existing.tokens += e.totalTokens;
    modelMap.set(e.model, existing);
  }
  const modelBreakdown = Array.from(modelMap.entries())
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.cost - a.cost);

  // Provider breakdown
  const providerMap = new Map<string, { requests: number; cost: number }>();
  for (const e of entries) {
    const existing = providerMap.get(e.provider) || { requests: 0, cost: 0 };
    existing.requests++;
    existing.cost += e.cost;
    providerMap.set(e.provider, existing);
  }
  const providerBreakdown = Array.from(providerMap.entries())
    .map(([provider, data]) => ({ provider, ...data }))
    .sort((a, b) => b.cost - a.cost);

  // Tool usage breakdown
  const toolMap = new Map<string, number>();
  for (const e of entries) {
    if (e.toolUsed) {
      const tools = e.toolUsed.split(', ');
      for (const tool of tools) {
        toolMap.set(tool, (toolMap.get(tool) || 0) + 1);
      }
    }
  }
  const totalToolCalls = Array.from(toolMap.values()).reduce((sum, c) => sum + c, 0);
  const toolUsage = Array.from(toolMap.entries())
    .map(([tool, count]) => ({
      tool,
      count,
      percentage: totalToolCalls > 0 ? Math.round((count / totalToolCalls) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent entries (last 20)
  const recentEntries = entries.slice(-20).reverse();

  return {
    totalRequests,
    totalCost: round6(totalCost),
    totalInputTokens,
    totalOutputTokens,
    successRate,
    costToday: round6(costToday),
    costThisWeek: round6(costThisWeek),
    costThisMonth: round6(costThisMonth),
    dailyCosts,
    modelBreakdown,
    providerBreakdown,
    toolUsage,
    recentEntries,
    avgCostPerSuccess: round6(avgCostPerSuccess),
  };
}

export async function getCostToday(): Promise<number> {
  const entries = await repo.listAll();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  return round6(entries.filter((e) => e.timestamp >= todayStart).reduce((sum, e) => sum + e.cost, 0));
}

export async function getSessionCost(sessionId: string): Promise<number> {
  if (!sessionId) return 0;
  const entries = await repo.listAll();
  return round6(
    entries
      .filter((entry) => entry.endpoint.includes(`session:${sessionId}`))
      .reduce((sum, entry) => sum + entry.cost, 0),
  );
}

function getDailyCosts(entries: UsageEntry[], days: number) {
  const result: Array<{ date: string; cost: number; requests: number }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayEntries = entries.filter(e => e.timestamp.startsWith(dateStr));
    result.push({
      date: dateStr,
      cost: round6(dayEntries.reduce((sum, e) => sum + e.cost, 0)),
      requests: dayEntries.length,
    });
  }

  return result;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
