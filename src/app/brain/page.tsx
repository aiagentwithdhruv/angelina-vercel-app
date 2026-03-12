'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Brain, Search, Filter, RefreshCw, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface KnowledgeNode {
  id: string;
  type: string;
  title: string;
  content: string | null;
  mention_count: number;
  last_seen: string;
}

interface KnowledgeEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
}

const NODE_COLORS: Record<string, string> = {
  person: 'bg-blue-500/20 border-blue-400/50 text-blue-200',
  project: 'bg-green-500/20 border-green-400/50 text-green-200',
  company: 'bg-purple-500/20 border-purple-400/50 text-purple-200',
  decision: 'bg-orange-500/20 border-orange-400/50 text-orange-200',
  idea: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200',
  goal: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200',
  tool: 'bg-steel-mid/30 border-steel-mid text-text-secondary',
  place: 'bg-pink-500/20 border-pink-400/50 text-pink-200',
};

export default function BrainPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge?graph=true');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch {
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const filtered = nodes.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const types = Array.from(new Set(nodes.map((n) => n.type))).sort();
  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const connected = selectedId
    ? edges.filter((e) => e.source_id === selectedId || e.target_id === selectedId)
    : [];

  return (
    <MobileLayout>
      <Header />
      <main className="pt-20 min-h-screen bg-deep-space text-text-primary px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-glow/20 border border-cyan-glow/40 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-glow" />
            </div>
            <div>
              <h1 className="font-orbitron text-xl font-bold text-text-primary">Your Brain</h1>
              <p className="text-sm text-text-muted">
                {nodes.length} nodes · {edges.length} connections
              </p>
            </div>
          </div>

          <p className="text-text-muted text-sm mb-4">
            Your knowledge graph grows automatically as you chat with Angelina. Entities from conversations are extracted and linked here.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gunmetal border border-steel-dark text-text-primary placeholder-text-muted focus:border-cyan-glow/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gunmetal border border-steel-dark text-text-secondary"
            >
              <Filter className="w-4 h-4" />
              {typeFilter ? typeFilter : 'Type'}
              {filterOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={fetchGraph}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gunmetal border border-steel-dark text-text-secondary hover:border-cyan-glow/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>

          {filterOpen && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-3 py-1 rounded-full text-sm ${!typeFilter ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40' : 'bg-gunmetal border border-steel-dark text-text-muted'}`}
              >
                All
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-sm ${typeFilter === t ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40' : 'bg-gunmetal border border-steel-dark text-text-muted'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-glow" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-8 text-center text-text-muted">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-text-secondary">No knowledge nodes yet</p>
              <p className="text-sm mt-1">Start chatting with Angelina. Your graph builds automatically from conversations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                {filtered.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedId(selectedId === node.id ? null : node.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedId === node.id ? 'border-cyan-glow/50 bg-cyan-glow/10' : 'border-steel-dark bg-gunmetal/50 hover:border-steel-mid'} ${NODE_COLORS[node.type] || 'bg-charcoal border-steel-dark'}`}
                  >
                    <span className="text-xs uppercase tracking-wider opacity-80">{node.type}</span>
                    <p className="font-medium text-text-primary mt-0.5">{node.title}</p>
                    <p className="text-xs text-text-muted mt-1">Mentions: {node.mention_count}</p>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-1">
                {selected ? (
                  <div className="sticky top-24 rounded-xl bg-gunmetal border border-steel-dark p-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${NODE_COLORS[selected.type] || ''}`}>
                      {selected.type}
                    </span>
                    <h3 className="font-orbitron font-semibold text-lg mt-2 text-text-primary">{selected.title}</h3>
                    {selected.content && <p className="text-sm text-text-muted mt-2">{selected.content}</p>}
                    <p className="text-xs text-text-muted mt-2">Mentions: {selected.mention_count}</p>
                    {connected.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-steel-dark">
                        <p className="text-xs text-text-muted mb-2">Connected ({connected.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {connected.slice(0, 10).map((e) => {
                            const otherId = e.source_id === selected.id ? e.target_id : e.source_id;
                            const other = nodes.find((n) => n.id === otherId);
                            return other ? (
                              <button
                                key={e.id}
                                onClick={() => setSelectedId(other.id)}
                                className="px-2 py-1 rounded bg-charcoal text-xs text-cyan-glow/90 hover:bg-steel-dark"
                              >
                                {other.title}
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sticky top-24 rounded-xl bg-gunmetal/50 border border-steel-dark p-4 text-center text-text-muted text-sm">
                    Click a node to see details and connections.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </MobileLayout>
  );
}
