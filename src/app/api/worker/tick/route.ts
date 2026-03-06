/**
 * Autonomous Tick — The heartbeat of Angelina's autonomy.
 *
 * Called every 15 minutes by Vercel cron (or external cron service).
 * Picks pending tasks from the queue and executes them.
 *
 * This is what makes Angelina an autonomous agent, not just a chatbot.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNextPendingTasks,
  markTaskRunning,
  markTaskCompleted,
  markTaskFailed,
  logOutcome,
  recalculateGoalProgress,
  getTaskQueueStats,
} from '@/lib/autonomous-queue';
import { pushToTelegram } from '@/lib/proactive-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  const provided = request.headers.get('x-worker-key');
  if (provided === configured) return true;
  if (request.headers.get('x-vercel-cron')) return true;
  return false;
}

// Execute a single tool by calling our own API routes
async function executeTool(
  toolName: string,
  toolArgs: Record<string, any>,
): Promise<{ success: boolean; result: any; duration_ms: number }> {
  const start = Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WORKER_API_KEY ? { 'x-worker-key': process.env.WORKER_API_KEY } : {}),
      },
      body: JSON.stringify(toolArgs),
    });

    const data = await res.json();
    return {
      success: res.ok && data.success !== false,
      result: data,
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      result: { error: error instanceof Error ? error.message : 'Tool execution failed' },
      duration_ms: Date.now() - start,
    };
  }
}

/**
 * Smart Model Selection — pick cheapest adequate model per task.
 *
 * Priority order (cheapest first):
 * 1. Groq (free tier) — simple drafts, summaries, basic reasoning
 * 2. Haiku 4.5 / Kimi K2.5 — medium content, analysis
 * 3. GPT-4.1-mini — tool calling, decomposition, structured output
 * 4. GPT-4.1 / Claude — complex strategy, critical decisions
 */
function selectModelForTask(task: { title: string; description?: string; priority: number }): string {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();

  // Priority 1-2 (critical/high) → use reliable model
  if (task.priority <= 2) return 'gpt-4.1-mini';

  // Tasks needing tool calls → GPT-4.1-mini (best at function calling)
  const NEEDS_TOOLS = /\b(search|email|calendar|send|post|publish|create task|update|check)\b/i;
  if (NEEDS_TOOLS.test(text)) return 'gpt-4.1-mini';

  // Complex reasoning → GPT-4.1-mini
  const COMPLEX = /\b(strategy|analyze|plan|architect|decide|evaluate|compare|review code)\b/i;
  if (COMPLEX.test(text)) return 'gpt-4.1-mini';

  // Simple tasks → Groq (free) or Haiku (cheap)
  const SIMPLE = /\b(draft|summarize|rewrite|translate|format|list|describe|explain|write)\b/i;
  if (SIMPLE.test(text)) {
    // Try Groq first (free), fall back to Haiku
    if (process.env.GROQ_API_KEY) return 'groq:llama-4-scout-17b-16e-instruct';
    if (process.env.ANTHROPIC_API_KEY) return 'claude-haiku-4-5-20251001';
    if (process.env.MOONSHOT_API_KEY) return 'kimi-k2.5';
    return 'gpt-4.1-mini';
  }

  // Default: cheapest available
  if (process.env.GROQ_API_KEY) return 'groq:llama-4-scout-17b-16e-instruct';
  return 'gpt-4.1-mini';
}

// Execute an AI-reasoning task (no specific tool — Angelina thinks and acts)
async function executeAITask(
  title: string,
  description: string,
  priority: number,
): Promise<{ success: boolean; result: any; duration_ms: number; model_used: string }> {
  const start = Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const model = selectModelForTask({ title, description, priority });

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are Angelina executing an autonomous task. Complete this task and return a concise result. Use tools if needed.',
          },
          {
            role: 'user',
            content: `AUTONOMOUS TASK: ${title}\n\nDetails: ${description || 'No additional details.'}\n\nComplete this task now. Be concise in your response.`,
          },
        ],
        model,
        source: 'autonomous-tick',
      }),
    });

    const data = await res.json();
    return {
      success: res.ok,
      result: { response: data.response, toolCalls: data.toolCalls },
      duration_ms: Date.now() - start,
      model_used: model,
    };
  } catch (error) {
    return {
      success: false,
      result: { error: error instanceof Error ? error.message : 'AI task failed' },
      duration_ms: Date.now() - start,
      model_used: model,
    };
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const maxTasks = parseInt(new URL(request.url).searchParams.get('max') || '3');
  const results: Array<{ task_id: string; title: string; success: boolean; duration_ms: number; model?: string }> = [];

  try {
    // 1. Get pending tasks ready to execute
    const tasks = await getNextPendingTasks(maxTasks);

    if (tasks.length === 0) {
      const stats = await getTaskQueueStats();
      return NextResponse.json({
        message: 'No pending tasks',
        stats,
        executed: 0,
      });
    }

    console.log(`[Tick] Executing ${tasks.length} autonomous tasks`);

    // 2. Execute each task
    for (const task of tasks) {
      await markTaskRunning(task.id);

      let outcome: { success: boolean; result: any; duration_ms: number; model_used?: string };

      if (task.tool_name) {
        // Direct tool execution — no AI cost
        outcome = await executeTool(task.tool_name, task.tool_args);
      } else {
        // AI-reasoning task — smart model selection
        outcome = await executeAITask(task.title, task.description || '', task.priority);
      }

      // 3. Update task status
      if (outcome.success) {
        await markTaskCompleted(task.id, outcome.result);
      } else {
        await markTaskFailed(task.id, JSON.stringify(outcome.result));
      }

      // 4. Log outcome
      await logOutcome({
        task_id: task.id,
        goal_id: task.goal_id || undefined,
        action: task.title,
        tool_name: task.tool_name || undefined,
        tool_args: task.tool_args,
        result: outcome.result,
        success: outcome.success,
        duration_ms: outcome.duration_ms,
      });

      // 5. Recalculate goal progress if linked
      if (task.goal_id) {
        await recalculateGoalProgress(task.goal_id);
      }

      results.push({
        task_id: task.id,
        title: task.title,
        success: outcome.success,
        duration_ms: outcome.duration_ms,
        model: outcome.model_used,
      });

      console.log(`[Tick] ${outcome.success ? 'OK' : 'FAIL'} ${task.title} [${outcome.model_used || task.tool_name || 'tool'}] (${outcome.duration_ms}ms)`);
    }

    // 6. Push summary to Telegram if any tasks executed
    if (results.length > 0) {
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;
      const stats = await getTaskQueueStats();

      const msg = [
        `*Angelina Autonomous Tick*`,
        `Executed: ${results.length} tasks (${succeeded} OK, ${failed} failed)`,
        ...results.map((r) => `  ${r.success ? 'OK' : 'FAIL'} ${r.title} [${r.model || 'tool'}] (${r.duration_ms}ms)`),
        `Queue: ${stats.pending} pending, ${stats.completed_today} done today`,
      ].join('\n');

      pushToTelegram(msg).catch(() => {});
    }

    const stats = await getTaskQueueStats();
    return NextResponse.json({
      message: `Executed ${results.length} tasks`,
      results,
      stats,
    });
  } catch (error) {
    console.error('[Tick] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tick failed' },
      { status: 500 },
    );
  }
}
