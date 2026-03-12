'use client';

import { useState, useEffect, ReactNode } from 'react';

export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 border border-cyan-500/40 flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-cyan-400 font-orbitron">A</span>
          </div>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
