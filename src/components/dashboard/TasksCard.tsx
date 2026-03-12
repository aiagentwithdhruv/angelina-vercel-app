'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ListTodo } from 'lucide-react';

interface TaskStats { total: number; pending: number; in_progress: number; completed: number; overdue: number }

export function TasksCard() {
  const [stats, setStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.stats) return;
        const s = d.stats;
        const total = s.pending + s.in_progress + s.completed;
        setStats({ ...s, total, overdue: 0 });
      })
      .catch(() => {});
  }, []);

  const done = stats?.completed ?? 0;
  const total = stats?.total ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <ListTodo className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">TASKS</h3>
      </div>
      {total === 0 ? (
        <p className="text-sm text-text-muted">No tasks yet. Ask Angelina to create one!</p>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-text-primary">{done}/{total}</span>
            <span className="text-xs text-text-muted mb-1">completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-steel-dark mb-2">
            <div className="h-2 rounded-full bg-cyan-glow transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-text-muted">
            {stats?.pending ?? 0} pending · {stats?.in_progress ?? 0} in progress
          </p>
        </>
      )}
      <Link href="/tasks" className="text-xs text-cyan-glow/70 hover:text-cyan-glow mt-3 block">
        View all →
      </Link>
    </div>
  );
}
