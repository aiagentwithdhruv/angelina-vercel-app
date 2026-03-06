/**
 * Goals Tool — Autonomous goal management with AI decomposition.
 *
 * When a goal is created, it's automatically decomposed into
 * executable tasks that Angelina runs autonomously.
 *
 * Actions:
 *   set/create — Create a new goal + auto-decompose into tasks
 *   update     — Update progress or status
 *   list       — List all goals
 *   queue      — Show the autonomous task queue
 */

import { NextResponse } from 'next/server';
import {
  createAutonomousGoal,
  getAllGoals as getAllAutoGoals,
  updateGoalProgress as updateAutoProgress,
  updateGoalStatus as updateAutoStatus,
  getTaskQueueStats,
  getNextPendingTasks,
} from '@/lib/autonomous-queue';
import { decomposeGoal } from '@/lib/goal-decomposer';
// Fallback for when Postgres tables don't exist yet
import {
  getAllGoals as getFileGoals,
  createGoal as createFileGoal,
  updateGoalProgress as updateFileProgress,
  updateGoalStatus as updateFileStatus,
} from '@/lib/goals-store';

async function isAutonomousReady(): Promise<boolean> {
  try {
    const { getPgPool } = await import('@/lib/db');
    const pool = getPgPool();
    await pool.query('SELECT 1 FROM autonomous_goals LIMIT 0');
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { action, title, description, target, deadline, progress, status, goal_id, priority } =
      await request.json();

    const autonomous = await isAutonomousReady();

    switch (action) {
      case 'set':
      case 'create': {
        if (!title) {
          return NextResponse.json({ success: false, error: 'Title is required' });
        }

        if (autonomous) {
          const goal = await createAutonomousGoal(title, {
            description,
            target,
            priority: priority || 'medium',
            deadline,
            source: 'user',
          });

          // Auto-decompose into executable tasks
          let taskIds: string[] = [];
          try {
            taskIds = await decomposeGoal(goal.id, title, description);
          } catch (err) {
            console.warn('[Goals] Decomposition failed, goal created without tasks:', err);
          }

          return NextResponse.json({
            success: true,
            message: `Goal created: "${goal.title}" → ${taskIds.length} autonomous tasks queued`,
            goal,
            tasks_created: taskIds.length,
            autonomous: true,
          });
        } else {
          const goal = createFileGoal(title, description, target, deadline);
          return NextResponse.json({
            success: true,
            message: `Goal created: "${goal.title}"`,
            goal,
            autonomous: false,
          });
        }
      }

      case 'update': {
        const id = goal_id || title || '';

        if (autonomous) {
          if (progress !== undefined) {
            const goal = await updateAutoProgress(id, progress);
            if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
            return NextResponse.json({
              success: true,
              message: `Goal "${goal.title}" updated to ${goal.progress}%${goal.status === 'completed' ? ' — COMPLETED!' : ''}`,
              goal,
            });
          }
          if (status) {
            const goal = await updateAutoStatus(id, status);
            if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
            return NextResponse.json({
              success: true,
              message: `Goal "${goal.title}" status → ${goal.status}`,
              goal,
            });
          }
        } else {
          if (progress !== undefined) {
            const goal = updateFileProgress(id, progress);
            if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
            return NextResponse.json({
              success: true,
              message: `Goal "${goal.title}" updated to ${goal.progress}%${goal.status === 'completed' ? ' — COMPLETED!' : ''}`,
              goal,
            });
          }
          if (status) {
            const goal = updateFileStatus(id, status);
            if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
            return NextResponse.json({
              success: true,
              message: `Goal "${goal.title}" status → ${goal.status}`,
              goal,
            });
          }
        }
        return NextResponse.json({ success: false, error: 'Provide progress (0-100) or status' });
      }

      case 'list': {
        if (autonomous) {
          const goals = await getAllAutoGoals();
          return NextResponse.json({
            success: true,
            goals,
            summary: {
              total: goals.length,
              active: goals.filter((g) => g.status === 'active').length,
              completed: goals.filter((g) => g.status === 'completed').length,
              paused: goals.filter((g) => g.status === 'paused').length,
              failed: goals.filter((g) => g.status === 'failed').length,
            },
            autonomous: true,
          });
        } else {
          const goals = getFileGoals();
          return NextResponse.json({
            success: true,
            goals,
            summary: {
              total: goals.length,
              active: goals.filter((g) => g.status === 'active').length,
              completed: goals.filter((g) => g.status === 'completed').length,
              paused: goals.filter((g) => g.status === 'paused').length,
            },
            autonomous: false,
          });
        }
      }

      case 'queue': {
        if (!autonomous) {
          return NextResponse.json({ success: false, error: 'Autonomous queue requires Postgres migration. Run scripts/migrate-autonomous.sql' });
        }
        const stats = await getTaskQueueStats();
        const pending = await getNextPendingTasks(10);
        return NextResponse.json({
          success: true,
          stats,
          pending_tasks: pending.map((t) => ({
            id: t.id,
            title: t.title,
            tool: t.tool_name || 'AI reasoning',
            priority: t.priority,
            scheduled_for: t.scheduled_for,
            depends_on: t.depends_on,
          })),
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action. Use: set, update, list, queue',
        });
    }
  } catch (error) {
    console.error('[Goals] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Goals operation failed',
    });
  }
}
