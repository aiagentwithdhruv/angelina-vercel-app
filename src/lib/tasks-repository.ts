import fs from 'fs';
import path from 'path';
import { getPgPool } from '@/lib/db';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

export interface Task {
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

interface TaskRepository {
  getAll(): Promise<Task[]>;
  create(title: string, description?: string, priority?: string): Promise<Task>;
  updateStatusById(taskId: string, status: TaskStatus): Promise<Task | null>;
  updateStatusByTitle(title: string, status: TaskStatus): Promise<Task | null>;
  updateByStatus(fromStatus: TaskStatus, toStatus: TaskStatus): Promise<Task[]>;
  delete(taskId: string): Promise<boolean>;
}

const DATA_FILE = path.join(process.cwd(), 'tasks-data.json');

function readTasksFile(): Task[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function writeTasksFile(tasks: Task[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

class FileTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return readTasksFile();
  }

  async create(title: string, description?: string, priority?: string): Promise<Task> {
    const tasks = readTasksFile();
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      description,
      status: 'pending',
      priority: (priority as Task['priority']) || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    writeTasksFile(tasks);
    return task;
  }

  async updateStatusById(taskId: string, status: TaskStatus): Promise<Task | null> {
    const tasks = readTasksFile();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'completed') task.completedAt = new Date().toISOString();
    if (status === 'archived') task.archivedAt = new Date().toISOString();
    writeTasksFile(tasks);
    return task;
  }

  async updateStatusByTitle(title: string, status: TaskStatus): Promise<Task | null> {
    const tasks = readTasksFile();
    const titleLower = title.toLowerCase().trim();
    const task =
      tasks.find((t) => t.title.toLowerCase() === titleLower) ||
      tasks.find((t) => t.title.toLowerCase().includes(titleLower)) ||
      tasks.find((t) => titleLower.includes(t.title.toLowerCase())) ||
      tasks.find((t) => {
        const titleWords = titleLower.split(/\s+/).filter((word) => word.length > 2);
        const taskWords = t.title.toLowerCase();
        const matchCount = titleWords.filter((word) => taskWords.includes(word)).length;
        return titleWords.length > 0 && matchCount >= Math.ceil(titleWords.length * 0.5);
      });
    if (!task) return null;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'completed') task.completedAt = new Date().toISOString();
    if (status === 'archived') task.archivedAt = new Date().toISOString();
    writeTasksFile(tasks);
    return task;
  }

  async updateByStatus(fromStatus: TaskStatus, toStatus: TaskStatus): Promise<Task[]> {
    const tasks = readTasksFile();
    const updated: Task[] = [];
    for (const task of tasks) {
      if (task.status === fromStatus) {
        task.status = toStatus;
        task.updatedAt = new Date().toISOString();
        if (toStatus === 'completed') task.completedAt = new Date().toISOString();
        if (toStatus === 'archived') task.archivedAt = new Date().toISOString();
        updated.push(task);
      }
    }
    if (updated.length > 0) writeTasksFile(tasks);
    return updated;
  }

  async delete(taskId: string): Promise<boolean> {
    const tasks = readTasksFile();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    writeTasksFile(tasks);
    return true;
  }
}

class PostgresTaskRepository implements TaskRepository {
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : undefined,
    };
  }

  async getAll(): Promise<Task[]> {
    const pool = getPgPool();
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows.map((row) => this.rowToTask(row));
  }

  async create(title: string, description?: string, priority?: string): Promise<Task> {
    const pool = getPgPool();
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const result = await pool.query(
      `
        INSERT INTO tasks (id, title, description, status, priority)
        VALUES ($1, $2, $3, 'pending', $4)
        RETURNING *
      `,
      [id, title, description || null, priority || 'medium'],
    );
    return this.rowToTask(result.rows[0]);
  }

  async updateStatusById(taskId: string, status: TaskStatus): Promise<Task | null> {
    const pool = getPgPool();
    const result = await pool.query(
      `
        UPDATE tasks
        SET status = $2,
            updated_at = NOW(),
            completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
            archived_at = CASE WHEN $2 = 'archived' THEN NOW() ELSE archived_at END
        WHERE id = $1
        RETURNING *
      `,
      [taskId, status],
    );
    return result.rows[0] ? this.rowToTask(result.rows[0]) : null;
  }

  async updateStatusByTitle(title: string, status: TaskStatus): Promise<Task | null> {
    const pool = getPgPool();
    const result = await pool.query(
      `
        UPDATE tasks
        SET status = $2,
            updated_at = NOW(),
            completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
            archived_at = CASE WHEN $2 = 'archived' THEN NOW() ELSE archived_at END
        WHERE id = (
          SELECT id FROM tasks WHERE LOWER(title) LIKE LOWER($1) ORDER BY created_at DESC LIMIT 1
        )
        RETURNING *
      `,
      [`%${title}%`, status],
    );
    return result.rows[0] ? this.rowToTask(result.rows[0]) : null;
  }

  async updateByStatus(fromStatus: TaskStatus, toStatus: TaskStatus): Promise<Task[]> {
    const pool = getPgPool();
    const result = await pool.query(
      `
        UPDATE tasks
        SET status = $2,
            updated_at = NOW(),
            completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
            archived_at = CASE WHEN $2 = 'archived' THEN NOW() ELSE archived_at END
        WHERE status = $1
        RETURNING *
      `,
      [fromStatus, toStatus],
    );
    return result.rows.map((row) => this.rowToTask(row));
  }

  async delete(taskId: string): Promise<boolean> {
    const pool = getPgPool();
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    return (result.rowCount || 0) > 0;
  }
}

let repository: TaskRepository | null = null;

export function getTaskRepository(): TaskRepository {
  if (repository) return repository;
  const backend = (process.env.TASKS_BACKEND || process.env.DATA_BACKEND || '').toLowerCase();
  const hasDb = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL);
  repository = backend === 'postgres' || (backend !== 'file' && hasDb)
    ? new PostgresTaskRepository()
    : new FileTaskRepository();
  return repository;
}

