/**
 * Goals Store — OKR/goal tracking for Angelina.
 *
 * Storage: /tmp on Vercel + in-memory fallback (same as youtube-store).
 * Zero API cost.
 */

import fs from 'fs';
import path from 'path';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target?: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

interface GoalsData {
  goals: Goal[];
}

const DATA_FILE = path.join(
  typeof process !== 'undefined' && process.env.VERCEL ? '/tmp' : process.cwd(),
  'goals-data.json',
);

let memCache: GoalsData | null = null;

function readStore(): GoalsData {
  if (memCache) return memCache;
  try {
    if (!fs.existsSync(DATA_FILE)) return { goals: [] };
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw) as GoalsData;
    memCache = data;
    return data;
  } catch {
    return { goals: [] };
  }
}

function writeStore(data: GoalsData): void {
  memCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch { /* read-only FS on Vercel */ }
}

export function getAllGoals(): Goal[] {
  return readStore().goals;
}

export function getActiveGoals(): Goal[] {
  return readStore().goals.filter((g) => g.status === 'active');
}

export function createGoal(
  title: string,
  description?: string,
  target?: string,
  deadline?: string,
): Goal {
  const data = readStore();
  const goal: Goal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    description,
    target,
    progress: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deadline,
  };
  data.goals.unshift(goal);
  writeStore(data);
  return goal;
}

export function updateGoalProgress(goalId: string, progress: number): Goal | null {
  const data = readStore();
  const goal = data.goals.find((g) => g.id === goalId || g.title.toLowerCase().includes(goalId.toLowerCase()));
  if (!goal) return null;
  goal.progress = Math.max(0, Math.min(100, progress));
  goal.updatedAt = new Date().toISOString();
  if (goal.progress >= 100) goal.status = 'completed';
  writeStore(data);
  return goal;
}

export function updateGoalStatus(goalId: string, status: 'active' | 'completed' | 'paused'): Goal | null {
  const data = readStore();
  const goal = data.goals.find((g) => g.id === goalId || g.title.toLowerCase().includes(goalId.toLowerCase()));
  if (!goal) return null;
  goal.status = status;
  goal.updatedAt = new Date().toISOString();
  writeStore(data);
  return goal;
}

export function buildGoalsContext(): string | null {
  const active = getActiveGoals();
  if (active.length === 0) return null;
  const lines = ['Active Goals:'];
  for (const g of active.slice(0, 5)) {
    const bar = `[${'█'.repeat(Math.floor(g.progress / 10))}${'░'.repeat(10 - Math.floor(g.progress / 10))}]`;
    const deadline = g.deadline ? ` (due: ${g.deadline})` : '';
    lines.push(`  ${bar} ${g.progress}% — ${g.title}${deadline}`);
  }
  return lines.join('\n');
}
