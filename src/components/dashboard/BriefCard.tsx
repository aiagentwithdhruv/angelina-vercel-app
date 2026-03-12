'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun } from 'lucide-react';

interface BriefSection { title: string; content: string; items?: string[] }
interface BriefData { greeting: string; sections: BriefSection[] }

export function BriefCard() {
  const [brief, setBrief] = useState<BriefData | null>(null);

  useEffect(() => {
    fetch('/api/brief').then(r => r.ok ? r.json() : null).then(setBrief).catch(() => {});
  }, []);

  if (!brief) return null;

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">MORNING BRIEF</h3>
      </div>
      <p className="text-text-primary font-medium mb-3">{brief.greeting}</p>
      <div className="space-y-2 text-sm text-text-secondary">
        {brief.sections.slice(0, 2).map((s, i) => (
          <div key={i}>
            <span className="text-cyan-glow/70">{s.title}:</span> {s.content}
            {s.items && s.items.length > 0 && (
              <ul className="list-disc list-inside ml-2 mt-1">
                {s.items.slice(0, 3).map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      <Link href="/" className="text-xs text-cyan-glow/70 hover:text-cyan-glow mt-3 block">
        Open chat for full brief →
      </Link>
    </div>
  );
}
