'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface Insight { type: string; title: string; body: string; priority: string }

export function InsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.ok ? r.json() : { insights: [] })
      .then(d => setInsights(d.insights || []))
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">INSIGHTS</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-text-muted">All clear — nothing needs attention right now.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-lg font-bold text-amber-300">{insights.length}</p>
          <p className="text-xs text-text-muted mb-2">need{insights.length === 1 ? 's' : ''} attention</p>
          {insights.slice(0, 2).map((ins, i) => (
            <div key={i} className="text-sm">
              <span className="text-amber-300/90 font-medium">{ins.title}</span>
              <span className="text-text-muted"> — {ins.body}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
