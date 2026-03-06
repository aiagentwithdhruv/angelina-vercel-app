/**
 * Self-Reflection Worker — Weekly autonomous self-analysis.
 *
 * Angelina reviews her own performance:
 * - What tasks succeeded/failed
 * - What tools work best
 * - What patterns emerge
 * - What to do differently next week
 *
 * This is what separates a real agent from a chatbot.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPgPool } from '@/lib/db';
import { saveReflection } from '@/lib/autonomous-queue';
import { pushToTelegram } from '@/lib/proactive-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  if (request.headers.get('x-worker-key') === configured) return true;
  if (request.headers.get('x-vercel-cron')) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = getPgPool();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Gather stats for the period
    const statsRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE success = true) as succeeded,
        COUNT(*) FILTER (WHERE success = false) as failed,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(AVG(duration_ms), 0) as avg_duration
      FROM outcome_log
      WHERE created_at >= $1 AND created_at <= $2
    `, [periodStart.toISOString(), periodEnd.toISOString()]);

    const stats = statsRes.rows[0];

    // 2. Top successes
    const successesRes = await pool.query(`
      SELECT action, tool_name, result, duration_ms
      FROM outcome_log
      WHERE success = true AND created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC LIMIT 10
    `, [periodStart.toISOString(), periodEnd.toISOString()]);

    // 3. Top failures
    const failuresRes = await pool.query(`
      SELECT action, tool_name, result, duration_ms
      FROM outcome_log
      WHERE success = false AND created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC LIMIT 10
    `, [periodStart.toISOString(), periodEnd.toISOString()]);

    // 4. Tool usage breakdown
    const toolsRes = await pool.query(`
      SELECT tool_name, COUNT(*) as uses,
        COUNT(*) FILTER (WHERE success = true) as successes,
        COALESCE(AVG(duration_ms), 0) as avg_ms
      FROM outcome_log
      WHERE created_at >= $1 AND created_at <= $2 AND tool_name IS NOT NULL
      GROUP BY tool_name ORDER BY uses DESC
    `, [periodStart.toISOString(), periodEnd.toISOString()]);

    // 5. Goal completion
    const goalsRes = await pool.query(`
      SELECT title, progress, status
      FROM autonomous_goals
      WHERE updated_at >= $1
      ORDER BY updated_at DESC LIMIT 10
    `, [periodStart.toISOString()]);

    // 6. Generate AI insights
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    let insights = '';
    let strategyAdjustments = '';

    try {
      const aiRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are Angelina doing a weekly self-reflection. Analyze your performance and suggest improvements. Be concise and actionable.',
            },
            {
              role: 'user',
              content: `Weekly Performance Review (${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}):

STATS:
- Total actions: ${stats.total}
- Succeeded: ${stats.succeeded} (${stats.total > 0 ? Math.round((stats.succeeded / stats.total) * 100) : 0}%)
- Failed: ${stats.failed}
- Total cost: $${parseFloat(stats.total_cost).toFixed(4)}
- Avg duration: ${Math.round(stats.avg_duration)}ms

TOOL USAGE:
${toolsRes.rows.map((t: any) => `- ${t.tool_name}: ${t.uses} uses (${t.successes} ok, ${Math.round(t.avg_ms)}ms avg)`).join('\n') || 'No tool data'}

TOP FAILURES:
${failuresRes.rows.map((f: any) => `- ${f.action}: ${JSON.stringify(f.result)?.slice(0, 100)}`).join('\n') || 'No failures'}

GOALS:
${goalsRes.rows.map((g: any) => `- ${g.title}: ${g.progress}% (${g.status})`).join('\n') || 'No goals tracked'}

Give me:
1. KEY INSIGHTS (3-5 bullet points about patterns you see)
2. STRATEGY ADJUSTMENTS (3-5 specific changes for next week)

Be direct and actionable. No fluff.`,
            },
          ],
          model: 'gpt-4.1-mini',
          source: 'self-reflection',
        }),
      });

      const aiData = await aiRes.json();
      const response = aiData.response || '';

      // Split insights and strategy
      const insightsMatch = response.match(/KEY INSIGHTS[\s\S]*?(?=STRATEGY|$)/i);
      const strategyMatch = response.match(/STRATEGY ADJUSTMENTS[\s\S]*/i);
      insights = insightsMatch ? insightsMatch[0].trim() : response;
      strategyAdjustments = strategyMatch ? strategyMatch[0].trim() : '';
    } catch {
      insights = `${stats.total} actions, ${stats.succeeded} succeeded, ${stats.failed} failed. Cost: $${parseFloat(stats.total_cost).toFixed(4)}`;
      strategyAdjustments = 'AI reflection unavailable — raw stats recorded.';
    }

    // 7. Save reflection
    await saveReflection({
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      total_tasks: parseInt(stats.total),
      completed_tasks: parseInt(stats.succeeded),
      failed_tasks: parseInt(stats.failed),
      total_cost_usd: parseFloat(stats.total_cost),
      insights,
      strategy_adjustments: strategyAdjustments,
      top_successes: successesRes.rows.slice(0, 5),
      top_failures: failuresRes.rows.slice(0, 5),
    });

    // 8. Push to Telegram
    const reflectionMsg = [
      `*Angelina Weekly Reflection*`,
      `Period: ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}`,
      '',
      `Actions: ${stats.total} (${stats.succeeded} OK, ${stats.failed} failed)`,
      `Cost: $${parseFloat(stats.total_cost).toFixed(4)}`,
      `Success rate: ${stats.total > 0 ? Math.round((stats.succeeded / stats.total) * 100) : 0}%`,
      '',
      insights.slice(0, 500),
      '',
      strategyAdjustments.slice(0, 500),
    ].join('\n');

    pushToTelegram(reflectionMsg).catch(() => {});

    return NextResponse.json({
      period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
      stats: {
        total: parseInt(stats.total),
        succeeded: parseInt(stats.succeeded),
        failed: parseInt(stats.failed),
        cost: parseFloat(stats.total_cost),
        successRate: stats.total > 0 ? Math.round((stats.succeeded / stats.total) * 100) : 0,
      },
      toolBreakdown: toolsRes.rows,
      goals: goalsRes.rows,
      insights,
      strategyAdjustments,
    });
  } catch (error) {
    console.error('[Reflect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reflection failed' },
      { status: 500 },
    );
  }
}
