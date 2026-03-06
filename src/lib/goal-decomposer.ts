/**
 * Goal Decomposer — AI breaks goals into executable autonomous tasks.
 *
 * When Dhruv says "Post 3 LinkedIn posts this week about AI automation",
 * this decomposes it into:
 *   1. Research trending AI automation topics (web_search)
 *   2. Draft LinkedIn post #1 (AI reasoning)
 *   3. Draft LinkedIn post #2 (AI reasoning)
 *   4. Draft LinkedIn post #3 (AI reasoning)
 *   5. Send drafts to Dhruv for approval (send via Telegram)
 *
 * Each task gets enqueued with the right tool, args, dependencies, and schedule.
 */

import { enqueueTask } from './autonomous-queue';

// Available tools that autonomous tasks can call
const AVAILABLE_TOOLS: Record<string, string> = {
  web_search: 'Search the web for information',
  check_email: 'Check and summarize emails',
  send_email: 'Send an email',
  check_calendar: 'Check calendar events',
  manage_task: 'Create/update ClickUp tasks',
  save_memory: 'Save information to memory',
  recall_memory: 'Recall information from memory',
  obsidian_vault: 'Read/write/search the Obsidian vault',
  github: 'GitHub operations',
  n8n_workflow: 'Trigger n8n workflows',
  hacker_news: 'Check Hacker News',
  wikipedia: 'Search Wikipedia',
  youtube_analytics: 'Check YouTube analytics',
  goals: 'Manage goals',
  call_dhruv: 'Call Dhruv via Twilio',
};

interface DecomposedTask {
  title: string;
  description?: string;
  tool_name?: string;
  tool_args?: Record<string, any>;
  priority?: number;
  depends_on_index?: number; // index of task this depends on (for chaining)
  scheduled_offset_hours?: number; // hours from now to schedule
}

/**
 * Use AI to decompose a goal into tasks.
 * Falls back to a simple single-task if AI decomposition fails.
 */
export async function decomposeGoal(
  goalId: string,
  goalTitle: string,
  goalDescription?: string,
): Promise<string[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  let tasks: DecomposedTask[] = [];

  try {
    // Ask AI to decompose the goal
    const prompt = `You are Angelina's goal decomposer. Break this goal into 2-7 concrete, executable tasks.

GOAL: ${goalTitle}
${goalDescription ? `DETAILS: ${goalDescription}` : ''}

AVAILABLE TOOLS (use tool_name from this list, or leave empty for AI-reasoning tasks):
${Object.entries(AVAILABLE_TOOLS).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

Return ONLY a JSON array of tasks. Each task:
{
  "title": "concise action description",
  "description": "details if needed",
  "tool_name": "tool_name_from_list or null if AI reasoning",
  "tool_args": {} or null,
  "priority": 1-10 (1=highest),
  "depends_on_index": null or index of task this depends on (0-based),
  "scheduled_offset_hours": 0 for now, or hours to delay
}

Rules:
- Each task must be independently executable by an AI agent
- Use specific tools when possible (web_search for research, obsidian_vault for notes, etc.)
- Chain dependencies logically (research before writing, draft before sending)
- Schedule multi-day goals across time (e.g., "post Monday, Wednesday, Friday")
- Keep tasks small and focused — one action each
- For content tasks: research first, then create, then notify Dhruv via Telegram

Return ONLY the JSON array, no markdown, no explanation.`;

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a task decomposition engine. Return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4.1-mini',
        source: 'goal-decomposer',
      }),
    });

    const data = await res.json();
    const responseText = data.response || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      tasks = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[Decomposer] AI decomposition failed:', error);
  }

  // Fallback: create a single AI-reasoning task
  if (tasks.length === 0) {
    tasks = [{
      title: goalTitle,
      description: goalDescription,
      priority: 5,
    }];
  }

  // Enqueue all tasks
  const taskIds: string[] = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const dependsOnId = t.depends_on_index !== undefined && t.depends_on_index !== null && taskIds[t.depends_on_index]
      ? taskIds[t.depends_on_index]
      : undefined;

    const scheduledFor = t.scheduled_offset_hours
      ? new Date(Date.now() + t.scheduled_offset_hours * 3600_000).toISOString()
      : undefined;

    const queued = await enqueueTask(t.title, {
      goal_id: goalId,
      description: t.description,
      tool_name: t.tool_name || undefined,
      tool_args: t.tool_args || {},
      priority: t.priority || 5,
      depends_on: dependsOnId,
      scheduled_for: scheduledFor,
    });

    taskIds.push(queued.id);
  }

  console.log(`[Decomposer] Goal "${goalTitle}" → ${taskIds.length} tasks`);
  return taskIds;
}

/**
 * Quick-enqueue a single autonomous task (no goal, no decomposition).
 * For simple one-off autonomous actions.
 */
export async function quickTask(
  title: string,
  toolName?: string,
  toolArgs?: Record<string, any>,
  priority?: number,
): Promise<string> {
  const task = await enqueueTask(title, {
    tool_name: toolName,
    tool_args: toolArgs || {},
    priority: priority || 5,
  });
  return task.id;
}
