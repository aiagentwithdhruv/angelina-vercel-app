/**
 * Manage Task Tool - Create, update, list tasks via Angelina chat
 */

import { NextResponse } from 'next/server';
import { getAllTasks, getTaskStats, createTask, updateTaskStatus, updateTaskByTitle, updateTasksByStatus } from '@/lib/tasks-store';

export async function POST(request: Request) {
  try {
    const { action, title, description, priority, status, task_id, from_status } = await request.json();

    // List tasks
    if (action === 'list' || !action) {
      const tasks = await getAllTasks();
      const stats = await getTaskStats();
      return NextResponse.json({ tasks, stats });
    }

    // Create new task
    if (action === 'create') {
      if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
      const task = await createTask(title, description, priority);
      const stats = await getTaskStats();
      return NextResponse.json({ success: true, task, stats, message: `Task created: "${title}"` });
    }

    // Update single task status
    if (action === 'update') {
      if (!status) return NextResponse.json({ error: 'Status required (pending, in_progress, completed)' }, { status: 400 });
      let task;
      if (task_id) {
        task = await updateTaskStatus(task_id, status);
      } else if (title) {
        task = await updateTaskByTitle(title, status);
      } else {
        return NextResponse.json({ error: 'Provide title or task_id' }, { status: 400 });
      }
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      const stats = await getTaskStats();
      return NextResponse.json({ success: true, task, stats, message: `"${task.title}" → ${status}` });
    }

    // Bulk update: move all tasks from one status to another
    if (action === 'update_all') {
      if (!from_status || !status) {
        return NextResponse.json({ error: 'Both from_status and status required' }, { status: 400 });
      }
      const updated = await updateTasksByStatus(from_status, status);
      const stats = await getTaskStats();
      return NextResponse.json({
        success: true,
        updatedCount: updated.length,
        updatedTasks: updated.map(t => t.title),
        stats,
        message: updated.length > 0
          ? `Moved ${updated.length} task(s) from ${from_status} → ${status}`
          : `No tasks found with status "${from_status}"`,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use: list, create, update, update_all' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Task operation failed' },
      { status: 500 }
    );
  }
}
