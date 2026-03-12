'use client';

import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

interface Goal { id: string; title: string; progress: number; status: string }

export function GoalsCard() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetch('/api/tools/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.goals) setGoals(d.goals.filter((g: Goal) => g.status === 'active').slice(0, 4));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">GOALS</h3>
      </div>
      {goals.length === 0 ? (
        <p className="text-sm text-text-muted">No active goals. Set one with Angelina!</p>
      ) : (
        <div className="space-y-3">
          {goals.map(g => (
            <div key={g.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-text-primary truncate mr-2">{g.title}</span>
                <span className="text-xs text-text-muted flex-shrink-0">{g.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-steel-dark">
                <div className="h-1.5 rounded-full bg-cyan-glow transition-all" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
