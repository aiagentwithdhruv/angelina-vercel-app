/**
 * Tasks API - GET all tasks + stats, POST create, PATCH update status
 */

import { NextResponse } from 'next/server';
import { getAllTasks, getTaskStats, createTask, updateTaskStatus, updateTaskByTitle, deleteTask } from '@/lib/tasks-store';

// GET: List all tasks + stats
export async function GET() {
  try {
    const tasks = await getAllTasks();
    const stats = await getTaskStats();
    return NextResponse.json({ tasks, stats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST: Create or update a task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, title, description, priority, task_id, status } = body;

    if (action === 'create') {
      if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });
      const task = await createTask(title, description, priority);
      return NextResponse.json({ success: true, task, message: `Task created: ${title}` });
    }

    if (action === 'update') {
      if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 });
      let task;
      if (task_id) {
        task = await updateTaskStatus(task_id, status);
      } else if (title) {
        task = await updateTaskByTitle(title, status);
      }
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, task, message: `Task "${task.title}" → ${status}` });
    }

    if (action === 'delete') {
      if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 });
      const deleted = await deleteTask(task_id);
      if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Task deleted' });
    }

    return NextResponse.json({ error: 'Invalid action. Use: create, update, delete' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}
