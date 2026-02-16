import fs from 'fs';
import path from 'path';
import { getPgPool } from '@/lib/db';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

interface UsageRow {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  success: boolean;
  toolUsed?: string;
  endpoint: string;
  routingReason?: string;
  estimatedCost?: number;
}

function readJson<T>(fileName: string): T[] {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T[];
}

async function migrateTasks(pool: ReturnType<typeof getPgPool>, tasks: TaskRow[]) {
  let migrated = 0;
  let skipped = 0;
  for (const task of tasks) {
    const exists = await pool.query('SELECT 1 FROM tasks WHERE id = $1 LIMIT 1', [task.id]);
    if (exists.rows.length > 0) {
      skipped += 1;
      continue;
    }
    await pool.query(
      `
        INSERT INTO tasks (
          id, title, description, status, priority, created_at, updated_at, completed_at, archived_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `,
      [
        task.id,
        task.title,
        task.description || null,
        task.status || 'pending',
        task.priority || 'medium',
        task.createdAt || new Date().toISOString(),
        task.updatedAt || task.createdAt || new Date().toISOString(),
        task.completedAt || null,
        task.archivedAt || null,
      ],
    );
    migrated += 1;
  }
  return { migrated, skipped };
}

async function migrateUsage(pool: ReturnType<typeof getPgPool>, usageRows: UsageRow[]) {
  let migrated = 0;
  let skipped = 0;
  for (const row of usageRows) {
    const exists = await pool.query('SELECT 1 FROM usage_logs WHERE id = $1 LIMIT 1', [row.id]);
    if (exists.rows.length > 0) {
      skipped += 1;
      continue;
    }
    await pool.query(
      `
        INSERT INTO usage_logs (
          id, ts, model, provider, input_tokens, output_tokens, total_tokens, cost,
          success, tool_used, endpoint, routing_reason, estimated_cost
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13
        )
      `,
      [
        row.id,
        row.timestamp || new Date().toISOString(),
        row.model || 'unknown',
        row.provider || 'unknown',
        row.inputTokens || 0,
        row.outputTokens || 0,
        row.totalTokens || 0,
        row.cost || 0,
        row.success ?? true,
        row.toolUsed || null,
        row.endpoint || '/unknown',
        row.routingReason || null,
        row.estimatedCost ?? null,
      ],
    );
    migrated += 1;
  }
  return { migrated, skipped };
}

async function run() {
  const pool = getPgPool();
  const tasks = readJson<TaskRow>('tasks-data.json');
  const usageRows = readJson<UsageRow>('usage-data.json');

  const taskResult = await migrateTasks(pool, tasks);
  const usageResult = await migrateUsage(pool, usageRows);

  console.log(
    `Tasks migrated=${taskResult.migrated} skipped=${taskResult.skipped} total=${tasks.length}`,
  );
  console.log(
    `Usage migrated=${usageResult.migrated} skipped=${usageResult.skipped} total=${usageRows.length}`,
  );

  await pool.end();
}

run().catch((error) => {
  console.error('Tasks/usage migration failed:', error);
  process.exit(1);
});

