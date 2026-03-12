'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, MessageCircle, Brain } from 'lucide-react';

export function WeeklyCard() {
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [conversations, setConversations] = useState(0);
  const [newNodes, setNewNodes] = useState(0);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    fetch('/api/tasks')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.tasks) return;
        const completed = d.tasks.filter((t: { status: string; completedAt?: string }) =>
          t.status === 'completed' && t.completedAt && t.completedAt >= weekAgo
        );
        setTasksCompleted(completed.length);
      })
      .catch(() => {});

    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.conversations) return;
        const recent = d.conversations.filter((c: { created_at: string }) => c.created_at >= weekAgo);
        setConversations(recent.length);
      })
      .catch(() => {});

    fetch('/api/knowledge?graph=true')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.nodes) return;
        const recent = d.nodes.filter((n: { created_at: string }) => n.created_at >= weekAgo);
        setNewNodes(recent.length);
      })
      .catch(() => {});
  }, []);

  const items = [
    { icon: CheckCircle, label: 'tasks completed', value: tasksCompleted, color: 'text-green-400' },
    { icon: MessageCircle, label: 'conversations', value: conversations, color: 'text-blue-400' },
    { icon: Brain, label: 'new knowledge nodes', value: newNodes, color: 'text-purple-400' },
  ];

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">THIS WEEK</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <span className="text-xl font-bold text-text-primary">{value}</span>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
