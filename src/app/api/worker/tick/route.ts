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
 * 5-tier cost ladder (Angelina always picks cheapest that works):
 *
 * TIER 1 — FREE ($0):
 *   Groq llama-4-scout (free tier, fast inference)
 *
 * TIER 2 — ULTRA CHEAP (~$0.00005/task):
 *   Gemini 3 Flash Preview (via OpenRouter), GPT-4.1-nano, Gemma2
 *
 * TIER 3 — CHEAP (~$0.0002/task):
 *   Gemini 2.5 Flash, Haiku 4.5, Kimi K2.5, GPT-4.1-mini
 *
 * TIER 4 — STANDARD (~$0.001/task):
 *   GPT-4.1-mini (tool calling), Gemini 2.5 Pro
 *
 * TIER 5 — PREMIUM (~$0.01/task):
 *   GPT-4.1, Claude Sonnet 4.5 (only for critical tasks)
 */

// Helper: pick first available model from a list
function firstAvailable(models: Array<{ model: string; needsKey: string }>): string | null {
  for (const m of models) {
    if (process.env[m.needsKey]) return m.model;
  }
  return null;
}

function selectModelForTask(task: { title: string; description?: string; priority: number }): string {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();

  // ── TIER 5: Critical/high priority (1-2) → premium reliable model ──
  if (task.priority <= 2) {
    return firstAvailable([
      { model: 'gpt-4.1', needsKey: 'OPENAI_API_KEY' },
      { model: 'claude-sonnet-4-5-20250929', needsKey: 'ANTHROPIC_API_KEY' },
    ]) || 'gpt-4.1-mini';
  }

  // ── TIER 4: Tasks needing tool calls → must use reliable function callers ──
  const NEEDS_TOOLS = /\b(search|email|calendar|send|post|publish|create task|update task|check inbox|trigger|webhook)\b/i;
  if (NEEDS_TOOLS.test(text)) {
    return 'gpt-4.1-mini'; // Best at function calling, reliable
  }

  // ── TIER 4: Complex reasoning ──
  const COMPLEX = /\b(strategy|analyze|plan|architect|decide|evaluate|compare|review|debug|refactor|optimize)\b/i;
  if (COMPLEX.test(text)) {
    return firstAvailable([
      { model: 'gemini-2.5-pro', needsKey: 'GEMINI_API_KEY' },        // Cheap + powerful
      { model: 'kimi-k2.5', needsKey: 'MOONSHOT_API_KEY' },           // Strong reasoning
      { model: 'gpt-4.1-mini', needsKey: 'OPENAI_API_KEY' },
    ]) || 'gpt-4.1-mini';
  }

  // ── TIER 3: Medium tasks (content writing, analysis) ──
  const MEDIUM = /\b(write|create|compose|generate|research|report|content|article|blog)\b/i;
  if (MEDIUM.test(text)) {
    return firstAvailable([
      { model: 'gemini-2.5-flash', needsKey: 'GEMINI_API_KEY' },      // Very cheap + good
      { model: 'claude-haiku-4-5-20251001', needsKey: 'ANTHROPIC_API_KEY' }, // Fast Claude
      { model: 'kimi-k2.5', needsKey: 'MOONSHOT_API_KEY' },
      { model: 'groq:llama-4-scout-17b-16e-instruct', needsKey: 'GROQ_API_KEY' },
    ]) || 'gpt-4.1-mini';
  }

  // ── TIER 2: Simple tasks (drafts, summaries, formatting) ──
  const SIMPLE = /\b(draft|summarize|rewrite|translate|format|list|describe|explain|notify|remind|log)\b/i;
  if (SIMPLE.test(text)) {
    return firstAvailable([
      { model: 'groq:llama-4-scout-17b-16e-instruct', needsKey: 'GROQ_API_KEY' },  // FREE
      { model: 'gpt-4.1-nano', needsKey: 'OPENAI_API_KEY' },          // Ultra cheap
      { model: 'groq:gemma2-9b-it', needsKey: 'GROQ_API_KEY' },       // FREE
      { model: 'gemini-2.5-flash', needsKey: 'GEMINI_API_KEY' },
      { model: 'claude-haiku-4-5-20251001', needsKey: 'ANTHROPIC_API_KEY' },
    ]) || 'gpt-4.1-mini';
  }

  // ── TIER 1: Default — cheapest available for everything else ──
  return firstAvailable([
    { model: 'groq:llama-4-scout-17b-16e-instruct', needsKey: 'GROQ_API_KEY' },
    { model: 'gpt-4.1-nano', needsKey: 'OPENAI_API_KEY' },
    { model: 'gemini-2.5-flash', needsKey: 'GEMINI_API_KEY' },
    { model: 'claude-haiku-4-5-20251001', needsKey: 'ANTHROPIC_API_KEY' },
    { model: 'kimi-k2.5', needsKey: 'MOONSHOT_API_KEY' },
  ]) || 'gpt-4.1-mini';
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
