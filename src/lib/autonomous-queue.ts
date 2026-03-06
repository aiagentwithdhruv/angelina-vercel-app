/**
 * Autonomous Queue — The heart of Angelina's autonomy.
 *
 * This replaces the file-based goals-store with a Postgres-backed
 * goal + task queue that enables true autonomous execution.
 *
 * Flow: Goal → Decompose → Task Queue → Execute → Outcome Log → Learn
 */

import { getPgPool } from './db';

// ── Types ──

export interface AutonomousGoal {
  id: string;
  title: string;
  description?: string;
  target?: string;
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface QueuedTask {
  id: string;
  goal_id?: string;
  title: string;
  description?: string;
  tool_name?: string;
  tool_args: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  priority: number;
  retry_count: number;
  max_retries: number;
  depends_on?: string;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  result?: any;
  error?: string;
  created_at: string;
}

export interface OutcomeEntry {
  task_id?: string;
  goal_id?: string;
  action: string;
  tool_name?: string;
  tool_args?: Record<string, any>;
  result?: any;
  success: boolean;
  duration_ms?: number;
  tokens_used?: number;
  cost_usd?: number;
  notes?: string;
}

// ── Goal Operations ──

export async function createAutonomousGoal(
  title: string,
  opts?: {
    description?: string;
    target?: string;
    priority?: AutonomousGoal['priority'];
    deadline?: string;
    source?: string;
  },
): Promise<AutonomousGoal> {
  const pool = getPgPool();
  const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const { description, target, priority = 'medium', deadline, source = 'user' } = opts || {};

  const res = await pool.query(
    `INSERT INTO autonomous_goals (id, title, description, target, priority, deadline, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, title, description || null, target || null, priority, deadline || null, source],
  );
  return res.rows[0];
}

export async function getActiveGoals(): Promise<AutonomousGoal[]> {
  const pool = getPgPool();
  const res = await pool.query(
    `SELECT * FROM autonomous_goals WHERE status = 'active' ORDER BY
     CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
     created_at DESC`,
  );
  return res.rows;
}

export async function getAllGoals(): Promise<AutonomousGoal[]> {
  const pool = getPgPool();
  const res = await pool.query(`SELECT * FROM autonomous_goals ORDER BY created_at DESC LIMIT 50`);
  return res.rows;
}

export async function updateGoalProgress(goalId: string, progress: number): Promise<AutonomousGoal | null> {
  const pool = getPgPool();
  const clamped = Math.max(0, Math.min(100, progress));
  const newStatus = clamped >= 100 ? 'completed' : 'active';
  const res = await pool.query(
    `UPDATE autonomous_goals SET progress = $1, status = $2, updated_at = NOW()
     WHERE id = $3 OR LOWER(title) LIKE '%' || LOWER($3) || '%'
     RETURNING *`,
    [clamped, newStatus, goalId],
  );
  return res.rows[0] || null;
}

export async function updateGoalStatus(
  goalId: string,
  status: AutonomousGoal['status'],
): Promise<AutonomousGoal | null> {
  const pool = getPgPool();
  const res = await pool.query(
    `UPDATE autonomous_goals SET status = $1, updated_at = NOW()
     WHERE id = $2 OR LOWER(title) LIKE '%' || LOWER($2) || '%'
     RETURNING *`,
    [status, goalId],
  );
  return res.rows[0] || null;
}

// ── Task Queue Operations ──

export async function enqueueTask(
  title: string,
  opts?: {
    goal_id?: string;
    description?: string;
    tool_name?: string;
    tool_args?: Record<string, any>;
    priority?: number;
    depends_on?: string;
    scheduled_for?: string;
    max_retries?: number;
  },
): Promise<QueuedTask> {
  const pool = getPgPool();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const {
    goal_id,
    description,
    tool_name,
    tool_args = {},
    priority = 5,
    depends_on,
    scheduled_for,
    max_retries = 2,
  } = opts || {};

  const res = await pool.query(
    `INSERT INTO task_queue (id, goal_id, title, description, tool_name, tool_args, priority, depends_on, scheduled_for, max_retries)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()), $10)
     RETURNING *`,
    [id, goal_id || null, title, description || null, tool_name || null, JSON.stringify(tool_args), priority, depends_on || null, scheduled_for || null, max_retries],
  );
  return res.rows[0];
}

export async function getNextPendingTasks(limit: number = 3): Promise<QueuedTask[]> {
  const pool = getPgPool();
  const res = await pool.query(
    `SELECT tq.* FROM task_queue tq
     WHERE tq.status = 'pending'
       AND tq.scheduled_for <= NOW()
       AND (tq.depends_on IS NULL OR EXISTS (
         SELECT 1 FROM task_queue dep WHERE dep.id = tq.depends_on AND dep.status = 'completed'
       ))
     ORDER BY tq.priority ASC, tq.created_at ASC
     LIMIT $1`,
    [limit],
  );
  return res.rows;
}

export async function markTaskRunning(taskId: string): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE task_queue SET status = 'running', started_at = NOW() WHERE id = $1`,
    [taskId],
  );
}

export async function markTaskCompleted(taskId: string, result: any): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE task_queue SET status = 'completed', completed_at = NOW(), result = $1 WHERE id = $2`,
    [JSON.stringify(result), taskId],
  );
}

export async function markTaskFailed(taskId: string, error: string): Promise<void> {
  const pool = getPgPool();
  // Check if retries remain
  const task = await pool.query(`SELECT retry_count, max_retries FROM task_queue WHERE id = $1`, [taskId]);
  if (task.rows[0] && task.rows[0].retry_count < task.rows[0].max_retries) {
    await pool.query(
      `UPDATE task_queue SET status = 'pending', retry_count = retry_count + 1, error = $1 WHERE id = $2`,
      [error, taskId],
    );
  } else {
    await pool.query(
      `UPDATE task_queue SET status = 'failed', completed_at = NOW(), error = $1 WHERE id = $2`,
      [error, taskId],
    );
  }
}

export async function getTaskQueueStats(): Promise<{
  pending: number;
  running: number;
  completed_today: number;
  failed_today: number;
}> {
  const pool = getPgPool();
  const res = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'running') as running,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE) as completed_today,
      COUNT(*) FILTER (WHERE status = 'failed' AND completed_at >= CURRENT_DATE) as failed_today
    FROM task_queue
  `);
  const row = res.rows[0];
  return {
    pending: parseInt(row.pending) || 0,
    running: parseInt(row.running) || 0,
    completed_today: parseInt(row.completed_today) || 0,
    failed_today: parseInt(row.failed_today) || 0,
  };
}

// ── Outcome Logging ──

export async function logOutcome(entry: OutcomeEntry): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO outcome_log (task_id, goal_id, action, tool_name, tool_args, result, success, duration_ms, tokens_used, cost_usd, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      entry.task_id || null,
      entry.goal_id || null,
      entry.action,
      entry.tool_name || null,
      entry.tool_args ? JSON.stringify(entry.tool_args) : null,
      entry.result ? JSON.stringify(entry.result) : null,
      entry.success,
      entry.duration_ms || null,
      entry.tokens_used || 0,
      entry.cost_usd || 0,
      entry.notes || null,
    ],
  );
}

export async function getRecentOutcomes(limit: number = 20): Promise<any[]> {
  const pool = getPgPool();
  const res = await pool.query(
    `SELECT * FROM outcome_log ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return res.rows;
}

// ── Reflection ──

export async function saveReflection(reflection: {
  period_start: string;
  period_end: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  total_cost_usd: number;
  insights: string;
  strategy_adjustments: string;
  top_successes: any[];
  top_failures: any[];
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO reflections (period_start, period_end, total_tasks, completed_tasks, failed_tasks, total_cost_usd, insights, strategy_adjustments, top_successes, top_failures)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      reflection.period_start,
      reflection.period_end,
      reflection.total_tasks,
      reflection.completed_tasks,
      reflection.failed_tasks,
      reflection.total_cost_usd,
      reflection.insights,
      reflection.strategy_adjustments,
      JSON.stringify(reflection.top_successes),
      JSON.stringify(reflection.top_failures),
    ],
  );
}

export async function getLatestReflection(): Promise<any | null> {
  const pool = getPgPool();
  const res = await pool.query(`SELECT * FROM reflections ORDER BY created_at DESC LIMIT 1`);
  return res.rows[0] || null;
}

// ── Goal Progress Auto-Update ──

export async function recalculateGoalProgress(goalId: string): Promise<number> {
  const pool = getPgPool();
  const res = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'completed') as done
     FROM task_queue WHERE goal_id = $1`,
    [goalId],
  );
  const { total, done } = res.rows[0];
  const progress = total > 0 ? Math.round((parseInt(done) / parseInt(total)) * 100) : 0;

  await pool.query(
    `UPDATE autonomous_goals SET progress = $1, status = CASE WHEN $1 >= 100 THEN 'completed' ELSE status END, updated_at = NOW()
     WHERE id = $2`,
    [progress, goalId],
  );
  return progress;
}
