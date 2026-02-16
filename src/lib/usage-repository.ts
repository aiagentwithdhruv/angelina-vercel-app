import fs from 'fs';
import path from 'path';
import { getPgPool } from '@/lib/db';

export interface UsageEntry {
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

interface UsageRepository {
  append(entry: Omit<UsageEntry, 'id'>): Promise<UsageEntry>;
  listAll(): Promise<UsageEntry[]>;
}

const DATA_FILE = path.join(process.cwd(), 'usage-data.json');

function readUsageFile(): UsageEntry[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as UsageEntry[];
  } catch {
    return [];
  }
}

function writeUsageFile(entries: UsageEntry[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

class FileUsageRepository implements UsageRepository {
  async append(entry: Omit<UsageEntry, 'id'>): Promise<UsageEntry> {
    const entries = readUsageFile();
    const row: UsageEntry = {
      ...entry,
      id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    entries.push(row);
    if (entries.length > 10000) {
      entries.splice(0, entries.length - 10000);
    }
    writeUsageFile(entries);
    return row;
  }

  async listAll(): Promise<UsageEntry[]> {
    return readUsageFile();
  }
}

class PostgresUsageRepository implements UsageRepository {
  private rowToEntry(row: any): UsageEntry {
    return {
      id: row.id,
      timestamp: new Date(row.ts).toISOString(),
      model: row.model,
      provider: row.provider,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      totalTokens: row.total_tokens,
      cost: Number(row.cost),
      success: row.success,
      toolUsed: row.tool_used || undefined,
      endpoint: row.endpoint,
      routingReason: row.routing_reason || undefined,
      estimatedCost: row.estimated_cost !== null ? Number(row.estimated_cost) : undefined,
    };
  }

  async append(entry: Omit<UsageEntry, 'id'>): Promise<UsageEntry> {
    const pool = getPgPool();
    const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query(
      `
        INSERT INTO usage_logs (
          id, ts, model, provider, input_tokens, output_tokens, total_tokens, cost,
          success, tool_used, endpoint, routing_reason, estimated_cost
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13
        )
        RETURNING *
      `,
      [
        id,
        entry.timestamp,
        entry.model,
        entry.provider,
        entry.inputTokens,
        entry.outputTokens,
        entry.totalTokens,
        entry.cost,
        entry.success,
        entry.toolUsed || null,
        entry.endpoint,
        entry.routingReason || null,
        entry.estimatedCost ?? null,
      ],
    );
    return this.rowToEntry(result.rows[0]);
  }

  async listAll(): Promise<UsageEntry[]> {
    const pool = getPgPool();
    const result = await pool.query('SELECT * FROM usage_logs ORDER BY ts ASC');
    return result.rows.map((row) => this.rowToEntry(row));
  }
}

let repository: UsageRepository | null = null;

export function getUsageRepository(): UsageRepository {
  if (repository) return repository;
  const backend = (process.env.USAGE_BACKEND || process.env.DATA_BACKEND || '').toLowerCase();
  const hasDb = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);
  repository = backend === 'postgres' || (backend !== 'file' && hasDb)
    ? new PostgresUsageRepository()
    : new FileUsageRepository();
  return repository;
}

