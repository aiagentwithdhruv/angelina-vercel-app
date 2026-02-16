'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import {
  Search, Filter, RefreshCw,
  Mail, Send, Calendar, Globe, BookOpen, Newspaper,
  Brain, Phone, FileText, ListTodo, AlertTriangle,
  Check, PhoneCall,
} from 'lucide-react';

interface ActivityEntry {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  success: boolean;
  toolUsed?: string;
}

const FILTER_CHIPS = ['All', 'System', 'Tools', 'Voice', 'Errors'];

const TOOL_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  check_email: { icon: Mail, color: 'text-deep-space', bg: 'bg-gradient-to-br from-cyan-glow to-cyan-teal' },
  send_email: { icon: Send, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  check_calendar: { icon: Calendar, color: 'text-white', bg: 'bg-gradient-to-br from-warning to-amber-600' },
  web_search: { icon: Globe, color: 'text-white', bg: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  wikipedia: { icon: BookOpen, color: 'text-white', bg: 'bg-gradient-to-br from-gray-500 to-gray-600' },
  hacker_news: { icon: Newspaper, color: 'text-white', bg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  save_memory: { icon: Brain, color: 'text-white', bg: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  recall_memory: { icon: Search, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  call_dhruv: { icon: Phone, color: 'text-white', bg: 'bg-gradient-to-br from-success to-emerald-600' },
  manage_task: { icon: ListTodo, color: 'text-white', bg: 'bg-gradient-to-br from-amber-500 to-amber-600' },
  voice: { icon: PhoneCall, color: 'text-white', bg: 'bg-gradient-to-br from-violet-500 to-violet-600' },
};

const DEFAULT_ICON = { icon: FileText, color: 'text-deep-space', bg: 'bg-gradient-to-br from-cyan-glow to-cyan-teal' };

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.recentEntries || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === 'Tools') return !!entry.toolUsed;
    if (activeFilter === 'Voice') return entry.model?.toLowerCase().includes('realtime');
    if (activeFilter === 'Errors') return !entry.success;
    if (activeFilter === 'System') return !entry.toolUsed;
    return true;
  }).filter((entry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return entry.model.toLowerCase().includes(q) ||
      entry.provider.toLowerCase().includes(q) ||
      (entry.toolUsed && entry.toolUsed.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-deep-space">
      {/* Desktop */}
      <div className="hidden md:block">
      <Header />
        <main className="pt-24 px-8">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="font-orbitron text-4xl font-bold metallic-text mb-8">Activity</h1>
            <div className="space-y-3">
              {entries.length === 0 && !loading && (
                <p className="text-text-muted text-center py-12">No activity yet. Start chatting!</p>
              )}
              {entries.map((entry) => {
                const toolCfg = entry.toolUsed ? (TOOL_ICONS[entry.toolUsed] || DEFAULT_ICON) : DEFAULT_ICON;
                const Icon = toolCfg.icon;
                return (
                  <div key={entry.id} className="full-glow-card rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', entry.success ? toolCfg.bg : 'bg-gradient-to-br from-error to-red-600')}>
                        {entry.success ? <Icon className={clsx('w-4 h-4', toolCfg.color)} /> : <AlertTriangle className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{entry.model}</span>
                          {entry.toolUsed && <span className="text-[10px] px-1.5 py-0.5 bg-cyan-glow/10 text-cyan-glow rounded">{entry.toolUsed}</span>}
                          {!entry.success && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">failed</span>}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {entry.inputTokens + entry.outputTokens > 0 ? `${entry.inputTokens.toLocaleString()} in / ${entry.outputTokens.toLocaleString()} out` : 'Token count unavailable'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-cyan-glow">${entry.cost.toFixed(6)}</div>
                      <div className="text-[10px] text-text-muted">{timeAgo(entry.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileLayout title="Activity">
          <main className="pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            <div className="px-3 pt-2 pb-1">
              {searchOpen && (
                <div className="mb-2">
                  <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search activity..." className="w-full h-10 rounded-lg bg-gunmetal border border-steel-dark px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-cyan-glow/50 focus:outline-none" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setSearchOpen(!searchOpen)} className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all', searchOpen ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30' : 'bg-charcoal text-text-muted')}>
                  <Search className="w-4 h-4" />
                </button>
                <div className="flex gap-2 overflow-x-auto mobile-scroll-hide">
                  {FILTER_CHIPS.map((chip) => (
                    <button key={chip} onClick={() => setActiveFilter(chip)} className={clsx('flex-shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-all', activeFilter === chip ? 'bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/30' : 'bg-steel-dark text-text-secondary active:bg-steel-mid')}>
                      {chip}
                    </button>
                  ))}
                </div>
                <button onClick={fetchActivity} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-charcoal text-text-muted active:bg-steel-mid transition-all">
                  <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                </button>
              </div>
            </div>
            <div className="px-3 pt-2 space-y-2">
              {loading && entries.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-cyan-glow animate-spin" />
                </div>
              )}
              {!loading && filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-text-muted">No activity found</p>
                </div>
              )}
              {filteredEntries.map((entry) => {
                const toolCfg = entry.toolUsed ? (TOOL_ICONS[entry.toolUsed] || DEFAULT_ICON) : DEFAULT_ICON;
                const Icon = toolCfg.icon;
                return (
                  <div key={entry.id} className={clsx('bg-gunmetal border rounded-xl p-3 transition-all active:bg-steel-dark', entry.success ? 'border-steel-dark' : 'border-error/30')}>
                    <div className="flex items-start gap-3">
                      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', entry.success ? toolCfg.bg : 'bg-gradient-to-br from-error to-red-600')}>
                        {entry.success ? <Icon className={clsx('w-4 h-4', toolCfg.color)} /> : <AlertTriangle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-text-primary truncate">{entry.model}</span>
                          <span className="text-xs text-text-muted whitespace-nowrap ml-2">{timeAgo(entry.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.toolUsed && <span className="text-[10px] px-1.5 py-0.5 bg-cyan-glow/10 text-cyan-glow rounded">{entry.toolUsed}</span>}
                          {!entry.success && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">failed</span>}
                          <span className="text-[10px] text-text-muted">${entry.cost.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
