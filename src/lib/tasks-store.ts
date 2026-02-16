/**
 * Task Management Store
 * Uses repository backend (Postgres preferred, file fallback)
 */

import { getTaskRepository, Task, TaskStatus } from '@/lib/tasks-repository';

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  archived: number;
  completionRate: number;
}

const repo = getTaskRepository();

export async function getAllTasks(): Promise<Task[]> {
  return repo.getAll();
}

export async function getTaskStats(): Promise<TaskStats> {
  const tasks = await repo.getAll();
  const pending = tasks.filter(t => t.status === 'pending').length;
  const in_progress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const archived = tasks.filter(t => t.status === 'archived').length;
  const total = tasks.length;
  const activeTotal = total - archived;
  return {
    total,
    pending,
    in_progress,
    completed,
    archived,
    completionRate: activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0,
  };
}

export async function createTask(title: string, description?: string, priority?: string): Promise<Task> {
  return repo.create(title, description, priority);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
  return repo.updateStatusById(taskId, status);
}

export async function updateTaskByTitle(title: string, status: TaskStatus): Promise<Task | null> {
  return repo.updateStatusByTitle(title, status);
}

/**
 * Bulk update: move all tasks with a given status to a new status.
 * e.g. updateTasksByStatus('in_progress', 'pending') moves all in-progress → pending
 */
export async function updateTasksByStatus(fromStatus: TaskStatus, toStatus: TaskStatus): Promise<Task[]> {
  return repo.updateByStatus(fromStatus, toStatus);
}

export async function deleteTask(taskId: string): Promise<boolean> {
  return repo.delete(taskId);
}
