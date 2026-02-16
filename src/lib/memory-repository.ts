import fs from 'fs';
import path from 'path';
import { getPgPool } from '@/lib/db';
import { generateEmbedding, toVectorLiteral } from '@/lib/embeddings';

export type MemoryType = 'conversation' | 'fact' | 'preference' | 'task' | 'decision' | 'client';
export type MemoryImportance = 'low' | 'medium' | 'high';

export interface MemoryEntry {
  id: string;
  topic: string;
  content: string;
  timestamp: string;
  type: MemoryType;
  tags: string[];
  importance: MemoryImportance;
}

interface NewMemoryEntry {
  topic: string;
  content: string;
  type: MemoryType;
  tags: string[];
  importance: MemoryImportance;
}

export interface MemoryRepository {
  add(entry: NewMemoryEntry): Promise<MemoryEntry>;
  getAll(): Promise<MemoryEntry[]>;
  getRecent(count: number): Promise<MemoryEntry[]>;
  getByType(type: MemoryType): Promise<MemoryEntry[]>;
  getHighImportance(limit?: number): Promise<MemoryEntry[]>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
}

const MEMORY_FILE = path.join(process.cwd(), 'memory-data.json');

function readFileEntries(): MemoryEntry[] {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return [];
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw) as MemoryEntry[];
  } catch {
    return [];
  }
}

function writeFileEntries(entries: MemoryEntry[]) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

class FileMemoryRepository implements MemoryRepository {
  async add(entry: NewMemoryEntry): Promise<MemoryEntry> {
    const entries = readFileEntries();
    const row: MemoryEntry = {
      ...entry,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
    };
    entries.unshift(row);
    writeFileEntries(entries.slice(0, 500));
    return row;
  }

  async getAll(): Promise<MemoryEntry[]> {
    return readFileEntries();
  }

  async getRecent(count: number): Promise<MemoryEntry[]> {
    return readFileEntries().slice(0, count);
  }

  async getByType(type: MemoryType): Promise<MemoryEntry[]> {
    return readFileEntries().filter((entry) => entry.type === type);
  }

  async getHighImportance(limit = 10): Promise<MemoryEntry[]> {
    return readFileEntries().filter((entry) => entry.importance === 'high').slice(0, limit);
  }

  async search(query: string, limit = 20): Promise<MemoryEntry[]> {
    const lowered = query.toLowerCase();
    return readFileEntries()
      .filter(
        (entry) =>
          entry.topic.toLowerCase().includes(lowered) ||
          entry.content.toLowerCase().includes(lowered) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(lowered)),
      )
      .slice(0, limit);
  }

  async clear(): Promise<void> {
    writeFileEntries([]);
  }
}

class PostgresMemoryRepository implements MemoryRepository {
  private table = 'memory_entries';

  private rowToEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      topic: row.topic,
      content: row.content,
      type: row.type,
      tags: Array.isArray(row.tags) ? row.tags : [],
      importance: row.importance,
      timestamp: new Date(row.created_at).toISOString(),
    };
  }

  async add(entry: NewMemoryEntry): Promise<MemoryEntry> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const createdAt = new Date().toISOString();
    const textToEmbed = `${entry.topic}\n${entry.content}\n${entry.tags.join(' ')}`;
    const embedding = await generateEmbedding(textToEmbed).catch(() => null);
    const pool = getPgPool();

    await pool.query(
      `
        INSERT INTO ${this.table} (
          id, topic, content, type, tags, importance, created_at, embedding
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CASE WHEN $8::text IS NULL THEN NULL ELSE $8::vector END
        )
      `,
      [
        id,
        entry.topic,
        entry.content,
        entry.type,
        entry.tags,
        entry.importance,
        createdAt,
        embedding ? toVectorLiteral(embedding) : null,
      ],
    );

    return {
      ...entry,
      id,
      timestamp: createdAt,
    };
  }

  async getAll(): Promise<MemoryEntry[]> {
    const pool = getPgPool();
    const result = await pool.query(`SELECT * FROM ${this.table} ORDER BY created_at DESC`);
    return result.rows.map((row) => this.rowToEntry(row));
  }

  async getRecent(count: number): Promise<MemoryEntry[]> {
    const pool = getPgPool();
    const result = await pool.query(`SELECT * FROM ${this.table} ORDER BY created_at DESC LIMIT $1`, [count]);
    return result.rows.map((row) => this.rowToEntry(row));
  }

  async getByType(type: MemoryType): Promise<MemoryEntry[]> {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT * FROM ${this.table} WHERE type = $1 ORDER BY created_at DESC`,
      [type],
    );
    return result.rows.map((row) => this.rowToEntry(row));
  }

  async getHighImportance(limit = 10): Promise<MemoryEntry[]> {
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT * FROM ${this.table} WHERE importance = 'high' ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return result.rows.map((row) => this.rowToEntry(row));
  }

  async search(query: string, limit = 20): Promise<MemoryEntry[]> {
    const textToEmbed = query.trim();
    const pool = getPgPool();
    const embedded = await generateEmbedding(textToEmbed).catch(() => null);

    if (embedded) {
      const result = await pool.query(
        `
          SELECT *
          FROM ${this.table}
          ORDER BY embedding <=> $1::vector ASC, created_at DESC
          LIMIT $2
        `,
        [toVectorLiteral(embedded), limit],
      );
      return result.rows.map((row) => this.rowToEntry(row));
    }

    const lowered = `%${query.toLowerCase()}%`;
    const result = await pool.query(
      `
        SELECT *
        FROM ${this.table}
        WHERE LOWER(topic) LIKE $1
           OR LOWER(content) LIKE $1
           OR EXISTS (
              SELECT 1 FROM unnest(tags) AS tag WHERE LOWER(tag) LIKE $1
           )
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [lowered, limit],
    );
    return result.rows.map((row) => this.rowToEntry(row));
  }

  async clear(): Promise<void> {
    const pool = getPgPool();
    await pool.query(`DELETE FROM ${this.table}`);
  }
}

let repository: MemoryRepository | null = null;

export function getMemoryRepository(): MemoryRepository {
  if (repository) return repository;

  const backend = (process.env.MEMORY_BACKEND || '').toLowerCase();
  const hasDbUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);
  const usePostgres = backend === 'postgres' || (backend !== 'file' && hasDbUrl);

  repository = usePostgres ? new PostgresMemoryRepository() : new FileMemoryRepository();
  return repository;
}

