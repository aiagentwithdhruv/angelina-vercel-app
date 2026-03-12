'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Insight {
  type: string;
  title: string;
  body: string;
  action_suggestion?: string;
  priority: string;
}

export function ProactiveBanner() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch('/api/insights')
        .then((res) => (res.ok ? res.json() : { insights: [] }))
        .then((d) => setInsights(d.insights || []))
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || insights.length === 0) return null;

  const top = insights[0];
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-400/30 text-text-primary">
      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-200/90">{top.title}</p>
        <p className="text-sm text-text-secondary mt-0.5">{top.body}</p>
        {top.action_suggestion && (
          <p className="text-xs text-cyan-glow/80 mt-1">{top.action_suggestion}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-amber-400/20 text-text-muted hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
