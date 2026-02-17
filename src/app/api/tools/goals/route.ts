/**
 * Goals Tool — Set, update, and track goals/OKRs.
 *
 * Actions:
 *   set     — Create a new goal
 *   update  — Update progress (0-100) or status
 *   list    — List all goals
 */

import { NextResponse } from 'next/server';
import {
  getAllGoals,
  createGoal,
  updateGoalProgress,
  updateGoalStatus,
} from '@/lib/goals-store';

export async function POST(request: Request) {
  try {
    const { action, title, description, target, deadline, progress, status, goal_id } =
      await request.json();

    switch (action) {
      case 'set':
      case 'create': {
        if (!title) {
          return NextResponse.json({ success: false, error: 'Title is required' });
        }
        const goal = createGoal(title, description, target, deadline);
        return NextResponse.json({
          success: true,
          message: `Goal created: "${goal.title}"`,
          goal,
        });
      }

      case 'update': {
        const id = goal_id || title || '';
        if (progress !== undefined) {
          const goal = updateGoalProgress(id, progress);
          if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
          return NextResponse.json({
            success: true,
            message: `Goal "${goal.title}" updated to ${goal.progress}%${goal.status === 'completed' ? ' — COMPLETED!' : ''}`,
            goal,
          });
        }
        if (status) {
          const goal = updateGoalStatus(id, status);
          if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' });
          return NextResponse.json({
            success: true,
            message: `Goal "${goal.title}" status → ${goal.status}`,
            goal,
          });
        }
        return NextResponse.json({ success: false, error: 'Provide progress (0-100) or status' });
      }

      case 'list': {
        const goals = getAllGoals();
        return NextResponse.json({
          success: true,
          goals,
          summary: {
            total: goals.length,
            active: goals.filter((g) => g.status === 'active').length,
            completed: goals.filter((g) => g.status === 'completed').length,
            paused: goals.filter((g) => g.status === 'paused').length,
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action. Use: set, update, list',
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
