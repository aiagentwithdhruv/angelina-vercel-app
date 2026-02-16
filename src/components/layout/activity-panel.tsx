'use client';

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Filter, Mail, Check, Calendar, TrendingUp, FileText, AlertTriangle, Globe, BookOpen, Newspaper, Phone, Brain, Search, Send, PhoneCall, Circle, PlayCircle, CheckCircle2, Archive, ListTodo, DollarSign, Pencil } from 'lucide-react';

// ── Types ──

export interface Activity {
  id: string;
  type: string;       // tool name or event type
  title: string;
  detail: string;
  timestamp: number;  // Date.now()
  status?: 'success' | 'error';
}

interface QuickStat {
  label: string;
  value: string;
  progress?: number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// ── Icon/color mapping for each tool ──

const TOOL_CONFIG: Record<string, { icon: React.ElementType; iconColor: string; iconBg: string }> = {
  check_email: { icon: Mail, iconColor: 'text-deep-space', iconBg: 'bg-gradient-to-br from-cyan-glow to-cyan-teal' },
  send_email: { icon: Send, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  check_calendar: { icon: Calendar, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-warning to-amber-600' },
  web_search: { icon: Globe, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  wikipedia: { icon: BookOpen, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-gray-500 to-gray-600' },
  hacker_news: { icon: Newspaper, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  save_memory: { icon: Brain, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  recall_memory: { icon: Search, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  call_dhruv: { icon: Phone, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-success to-emerald-600' },
  chat: { icon: FileText, iconColor: 'text-deep-space', iconBg: 'bg-gradient-to-br from-cyan-glow to-cyan-teal' },
  voice: { icon: PhoneCall, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600' },
  manage_task: { icon: ListTodo, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600' },
  error: { icon: AlertTriangle, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-error to-red-600' },
};

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  archived: number;
  completionRate: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending: { icon: Circle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Pending' },
  in_progress: { icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  archived: { icon: Archive, color: 'text-text-muted', bg: 'bg-steel-dark/30', label: 'Archived' },
};

const PRIORITY_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-text-muted',
};

const DEFAULT_CONFIG = { icon: Check, iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-steel-mid to-steel-dark' };

// ── Relative time ──

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Component ──

interface ActivityPanelProps {
  className?: string;
  activities?: Activity[];
  isInitialState?: boolean;
  onQuickAction?: (label: string) => void;
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ className, activities = [], isInitialState, onQuickAction }) => {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, pending: 0, in_progress: 0, completed: 0, archived: 0, completionRate: 0 });
  const [revenue, setRevenue] = useState(0);
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueInput, setRevenueInput] = useState('');
  const [, setTick] = useState(0);

  // Refresh relative timestamps every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) return;
        const data = await res.json();
        setTasks(data.tasks || []);
        setTaskStats(data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0, completionRate: 0 });
      } catch {}
    }
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [activities.length]); // re-fetch when activities change (tool might have added a task)

  // Fetch revenue
  useEffect(() => {
    fetch('/api/revenue')
      .then(res => res.json())
      .then(data => { if (typeof data.currentRevenue === 'number') setRevenue(data.currentRevenue); })
      .catch(() => {});
  }, []);

  const saveRevenue = async () => {
    const amount = parseFloat(revenueInput);
    if (isNaN(amount)) { setEditingRevenue(false); return; }
    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.currentRevenue !== undefined) setRevenue(data.currentRevenue);
    } catch {}
    setEditingRevenue(false);
  };

  // Fetch real usage stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/usage');
        if (!res.ok) return;
        const data = await res.json();
        setStats([
          {
            label: 'Total Cost Today',
            value: `$${(data.costToday || 0).toFixed(4)}`,
            change: `$${(data.costThisMonth || 0).toFixed(4)} this month`,
            changeType: 'neutral',
          },
          {
            label: 'API Calls Today',
            value: String(data.dailyCosts?.[data.dailyCosts.length - 1]?.requests || 0),
            change: `${data.totalRequests || 0} total`,
            changeType: 'neutral',
          },
          {
            label: 'Tools Used',
            value: String(activities.filter(a => a.type !== 'chat' && a.type !== 'error').length),
            progress: Math.min(100, activities.length * 10),
            changeType: 'neutral',
          },
        ]);
      } catch {
        // Silently fail
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [activities.length]);

  return (
    <aside className={clsx('w-80 bg-charcoal border-l border-steel-dark overflow-y-auto', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron text-lg font-semibold text-text-primary">Activity Feed</h2>
          <div className="flex items-center gap-2">
            {activities.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-glow/20 text-cyan-glow font-mono">
                {activities.length}
              </span>
            )}
            <button className="w-8 h-8 bg-gunmetal rounded-lg flex items-center justify-center border border-steel-dark hover:bg-steel-mid hover:border-cyan-glow/40 hover:shadow-[0_0_15px_rgba(0,200,232,0.25)] transition-all">
              <Filter className="w-4 h-4 text-cyan-glow" />
            </button>
          </div>
        </div>

        {/* Quick Actions — shown in sidebar when in initial/hero state */}
        {isInitialState && onQuickAction && (
          <div className="mb-6">
            <h3 className="font-orbitron text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Check Email', icon: Mail, bg: 'from-cyan-glow to-cyan-teal', color: 'text-deep-space' },
                { label: 'Web Search', icon: Globe, bg: 'from-green-500 to-emerald-600', color: 'text-white' },
                { label: 'Calendar', icon: Calendar, bg: 'from-warning to-amber-600', color: 'text-white' },
                { label: 'Hacker News', icon: Newspaper, bg: 'from-orange-500 to-orange-600', color: 'text-white' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => onQuickAction(action.label)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gunmetal border border-steel-dark hover:border-cyan-glow/30 transition-all text-left"
                  >
                    <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${action.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${action.color}`} />
                    </div>
                    <span className="text-[11px] text-text-secondary">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity List */}
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gunmetal border border-steel-dark flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">No activity yet</p>
              <p className="text-xs text-text-muted mt-1">Start chatting to see live updates</p>
            </div>
          ) : (
            activities.map((activity) => {
              const config = TOOL_CONFIG[activity.type] || DEFAULT_CONFIG;
              const IconComponent = config.icon;
              return (
                <div
                  key={activity.id}
                  className={clsx(
                    'activity-item bg-gunmetal border rounded-lg p-4 group transition-all',
                    activity.status === 'error' ? 'border-error/30' : 'border-steel-dark'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        activity.status === 'error'
                          ? 'bg-gradient-to-br from-error to-red-600'
                          : config.iconBg
                      )}
                      style={{ boxShadow: '0 0 15px rgba(0, 200, 232, 0.2)' }}
                    >
                      <IconComponent
                        className={clsx(
                          'w-4 h-4',
                          activity.status === 'error' ? 'text-white' : config.iconColor
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-text-primary truncate">
                          {activity.title}
                        </span>
                        <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                          {timeAgo(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{activity.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-orbitron text-sm font-semibold text-cyan-glow">Tasks</h3>
            {taskStats.total > 0 && (
              <span className="text-[10px] text-text-muted font-mono">
                {taskStats.completed}/{taskStats.total} done
              </span>
            )}
          </div>

          {/* Status Counts */}
          {taskStats.total > 0 && (
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1.5 text-center">
                <div className="text-sm font-bold text-amber-400 font-orbitron">{taskStats.pending}</div>
                <div className="text-[9px] text-amber-400/70 uppercase">Pending</div>
              </div>
              <div className="flex-1 bg-blue-400/10 border border-blue-400/20 rounded-lg px-2 py-1.5 text-center">
                <div className="text-sm font-bold text-blue-400 font-orbitron">{taskStats.in_progress}</div>
                <div className="text-[9px] text-blue-400/70 uppercase">Active</div>
              </div>
              <div className="flex-1 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-2 py-1.5 text-center">
                <div className="text-sm font-bold text-emerald-400 font-orbitron">{taskStats.completed}</div>
                <div className="text-[9px] text-emerald-400/70 uppercase">Done</div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {taskStats.total > 0 && (
            <div className="w-full h-1.5 bg-steel-dark rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-glow rounded-full transition-all duration-500"
                style={{ width: `${taskStats.completionRate}%`, boxShadow: '0 0 8px rgba(0, 232, 140, 0.4)' }}
              />
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-text-muted">No tasks yet</p>
                <p className="text-[10px] text-text-muted mt-1">Say &quot;add task&quot; to create one</p>
              </div>
            ) : (
              tasks.slice(0, 8).map((task) => {
                const statusCfg = STATUS_CONFIG[task.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <div
                    key={task.id}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                      task.status === 'completed'
                        ? 'bg-emerald-400/5 border-emerald-400/15'
                        : task.status === 'in_progress'
                        ? 'bg-blue-400/5 border-blue-400/15'
                        : 'bg-gunmetal border-steel-dark'
                    )}
                  >
                    <StatusIcon className={clsx('w-4 h-4 flex-shrink-0', statusCfg.color)} />
                    <span
                      className={clsx(
                        'text-xs flex-1 truncate',
                        task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'
                      )}
                    >
                      {task.title}
                    </span>
                    <span className={clsx('text-[8px] uppercase font-mono', PRIORITY_COLORS[task.priority])}>
                      {task.priority === 'high' ? 'H' : task.priority === 'medium' ? 'M' : 'L'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current Revenue */}
        <div className="mt-8">
          <h3 className="font-orbitron text-sm font-semibold text-emerald-400 mb-3">Current Revenue</h3>
          <div className="bg-gunmetal border border-emerald-400/20 rounded-lg p-4"
               style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-deep-space" />
                </div>
                {editingRevenue ? (
                  <input
                    type="number"
                    autoFocus
                    value={revenueInput}
                    onChange={(e) => setRevenueInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveRevenue(); if (e.key === 'Escape') setEditingRevenue(false); }}
                    onBlur={saveRevenue}
                    className="bg-steel-dark border border-emerald-400/30 rounded-md px-3 py-1.5 text-lg font-bold text-emerald-400 font-orbitron w-32 outline-none focus:border-emerald-400/60"
                    placeholder="0"
                  />
                ) : (
                  <span className="text-2xl font-bold text-emerald-400 font-orbitron">
                    ${revenue.toLocaleString()}
                  </span>
                )}
              </div>
              {!editingRevenue && (
                <button
                  onClick={() => { setRevenueInput(String(revenue)); setEditingRevenue(true); }}
                  className="w-7 h-7 rounded-md bg-steel-dark/60 border border-steel-dark hover:border-emerald-400/30 flex items-center justify-center transition-all"
                >
                  <Pencil className="w-3 h-3 text-text-muted" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-text-muted mt-2">Click pencil to update manually</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h3 className="font-orbitron text-sm font-semibold text-cyan-glow mb-4">Quick Stats</h3>
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <div key={index} className="activity-item bg-gunmetal border border-steel-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary">{stat.label}</span>
                  <span className="text-lg font-bold text-cyan-glow font-orbitron">{stat.value}</span>
                </div>
                {stat.progress !== undefined && (
                  <div className="w-full h-1.5 bg-steel-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-glow to-cyan-teal rounded-full transition-all duration-500"
                      style={{ width: `${stat.progress}%`, boxShadow: '0 0 8px rgba(0, 200, 232, 0.4)' }}
                    />
                  </div>
                )}
                {stat.change && (
                  <div className="flex items-center space-x-2 text-xs text-text-muted">
                    {stat.changeType === 'positive' && <span className="text-success">↑</span>}
                    {stat.changeType === 'negative' && <span className="text-error">↓</span>}
                    <span className={stat.changeType === 'positive' ? 'text-success' : ''}>
                      {stat.change}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
