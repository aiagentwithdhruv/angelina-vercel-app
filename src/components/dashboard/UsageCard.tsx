'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu } from 'lucide-react';

export function UsageCard() {
  const [costToday, setCostToday] = useState(0);
  const [topModel, setTopModel] = useState('');
  const [requests, setRequests] = useState(0);

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setCostToday(d.costToday ?? 0);
        setRequests(d.totalRequests ?? 0);
        setTopModel(d.modelBreakdown?.[0]?.model || '');
      })
      .catch(() => {});
  }, []);

  const cap = parseFloat(process.env.NEXT_PUBLIC_DAILY_CAP || '2');
  const pct = cap > 0 ? Math.min(100, Math.round((costToday / cap) * 100)) : 0;

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">AI USAGE</h3>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-bold text-text-primary">${costToday.toFixed(2)}</span>
        <span className="text-xs text-text-muted mb-1">today</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-steel-dark mb-2">
        <div className={`h-1.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-cyan-glow'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-text-muted">
        {requests} requests{topModel ? ` · Top: ${topModel.split('/').pop()}` : ''}
      </p>
      <Link href="/dashboard" className="text-xs text-cyan-glow/70 hover:text-cyan-glow mt-3 block">
        Detailed analytics →
      </Link>
    </div>
  );
}
