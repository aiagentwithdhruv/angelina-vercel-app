'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';

interface KNode { id: string; title: string; type: string; mention_count: number }

export function KnowledgeCard() {
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [topNodes, setTopNodes] = useState<KNode[]>([]);

  useEffect(() => {
    fetch('/api/knowledge?graph=true')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setNodeCount(d.nodes?.length ?? 0);
        setEdgeCount(d.edges?.length ?? 0);
        const sorted = [...(d.nodes || [])].sort((a: KNode, b: KNode) => b.mention_count - a.mention_count);
        setTopNodes(sorted.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">KNOWLEDGE GRAPH</h3>
      </div>
      {nodeCount === 0 ? (
        <p className="text-sm text-text-muted">Start chatting to grow your brain.</p>
      ) : (
        <>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-2xl font-bold text-text-primary">{nodeCount}</span>
            <span className="text-xs text-text-muted mb-1">nodes · {edgeCount} connections</span>
          </div>
          {topNodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topNodes.map(n => (
                <span key={n.id} className="px-2 py-0.5 rounded bg-charcoal text-xs text-cyan-glow/80 border border-steel-dark">
                  {n.title}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <Link href="/brain" className="text-xs text-cyan-glow/70 hover:text-cyan-glow mt-3 block">
        View all →
      </Link>
    </div>
  );
}
