'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { clsx } from 'clsx';
import {
  RefreshCw, Plus, Circle, PlayCircle, CheckCircle2, Archive,
  ChevronRight, Trash2, X, GripVertical,
} from 'lucide-react';

// ── Types ──

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  archived: number;
  completionRate: number;
}

// ── Column Config ──

const COLUMNS: { key: TaskStatus; label: string; icon: React.ElementType; color: string; dotColor: string; bgTint: string; borderColor: string; count_key: keyof TaskStats }[] = [
  { key: 'pending', label: 'TO DO', icon: Circle, color: 'text-amber-400', dotColor: 'bg-amber-400', bgTint: 'bg-amber-400/5', borderColor: 'border-amber-400/20', count_key: 'pending' },
  { key: 'in_progress', label: 'IN PROGRESS', icon: PlayCircle, color: 'text-cyan-glow', dotColor: 'bg-cyan-glow', bgTint: 'bg-cyan-glow/5', borderColor: 'border-cyan-glow/20', count_key: 'in_progress' },
  { key: 'completed', label: 'COMPLETED', icon: CheckCircle2, color: 'text-emerald-400', dotColor: 'bg-emerald-400', bgTint: 'bg-emerald-400/5', borderColor: 'border-emerald-400/20', count_key: 'completed' },
  { key: 'archived', label: 'ARCHIVED', icon: Archive, color: 'text-text-muted', dotColor: 'bg-steel-mid', bgTint: 'bg-steel-dark/30', borderColor: 'border-steel-dark', count_key: 'archived' },
];

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  medium: { label: 'Med', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  low: { label: 'Low', color: 'text-text-muted', bg: 'bg-steel-dark/50', border: 'border-steel-dark' },
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'archived',
  archived: null,
};

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  pending: null,
  in_progress: 'pending',
  completed: 'in_progress',
  archived: 'completed',
};

// ── Helpers ──

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Task Card ──

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onMove, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const nextStatus = NEXT_STATUS[task.status];
  const prevStatus = PREV_STATUS[task.status];

  return (
    <div
      className={clsx(
        'group relative bg-gunmetal border border-steel-dark rounded-xl p-4 transition-all',
        'hover:border-cyan-glow/40 hover:shadow-[0_0_20px_rgba(0,200,232,0.15)]',
        task.status === 'archived' && 'opacity-60'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag Handle + Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-steel-mid opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase', priorityCfg.color, priorityCfg.bg, priorityCfg.border)}>
            {priorityCfg.label}
          </span>
        </div>
        {/* Quick Actions */}
        <div className={clsx('flex items-center gap-1 transition-opacity', showActions ? 'opacity-100' : 'opacity-0')}>
          {prevStatus && (
            <button
              onClick={() => onMove(task.id, prevStatus)}
              className="w-6 h-6 flex items-center justify-center rounded bg-steel-dark/50 hover:bg-steel-mid text-text-muted hover:text-text-primary transition-all"
              title={`Move to ${prevStatus}`}
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onMove(task.id, nextStatus)}
              className="w-6 h-6 flex items-center justify-center rounded bg-steel-dark/50 hover:bg-cyan-glow/20 text-text-muted hover:text-cyan-glow transition-all"
              title={`Move to ${nextStatus}`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 flex items-center justify-center rounded bg-steel-dark/50 hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-all"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className={clsx(
        'text-sm font-medium mb-1',
        task.status === 'completed' || task.status === 'archived'
          ? 'text-text-muted line-through'
          : 'text-text-primary'
      )}>
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Timestamp */}
      <div className="text-[10px] text-text-muted font-mono">
        {task.status === 'completed' && task.completedAt
          ? `Completed ${relativeTime(task.completedAt)}`
          : task.status === 'archived' && task.archivedAt
          ? `Archived ${relativeTime(task.archivedAt)}`
          : `Updated ${relativeTime(task.updatedAt)}`
        }
      </div>
    </div>
  );
};

// ── Add Task Form (inline) ──

interface AddTaskFormProps {
  onAdd: (title: string, priority: 'low' | 'medium' | 'high') => void;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gunmetal border border-cyan-glow/30 rounded-xl p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full bg-steel-dark border border-steel-mid rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-glow/50"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['low', 'medium', 'high'] as const).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={clsx(
                  'text-[10px] px-2.5 py-1 rounded-full border font-mono uppercase transition-all',
                  priority === p
                    ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                    : 'text-text-muted bg-steel-dark/30 border-steel-dark hover:border-steel-mid'
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="text-xs px-3 py-1.5 rounded-lg bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30 hover:bg-cyan-glow/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Add
          </button>
        </div>
      </div>
    </form>
  );
};

// ── Main Page ──

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, pending: 0, in_progress: 0, completed: 0, archived: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0, archived: 0, completionRate: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', task_id: taskId, status: newStatus }),
      });
      fetchTasks();
    } catch {
      fetchTasks(); // revert on error
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', task_id: taskId }),
      });
      fetchTasks();
    } catch {
      fetchTasks();
    }
  };

  const handleAdd = async (title: string, priority: 'low' | 'medium' | 'high') => {
    setAddingTo(null);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title, priority }),
      });
      fetchTasks();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="min-h-screen bg-deep-space">
      {/* Desktop Layout */}
      <div className="hidden md:block">
      <Header />
        <main className="pt-24 px-8 pb-12">
          <div className="max-w-[1400px] mx-auto">
            <section className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-orbitron text-4xl font-bold metallic-text">Tasks</h1>
                  <p className="text-text-muted text-sm mt-1">
                    {stats.total > 0 ? `${stats.total} tasks \u00B7 ${stats.completionRate}% complete` : 'Track your work across stages'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => fetchTasks()} className="flex items-center gap-2 px-4 py-2.5 bg-gunmetal border border-steel-dark rounded-lg text-text-secondary hover:border-cyan-glow/50 transition-all text-sm">
                    <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                  </button>
                  <button onClick={() => setAddingTo('pending')} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-glow to-cyan-teal rounded-lg text-deep-space font-medium text-sm hover:shadow-[0_0_25px_rgba(0,200,232,0.4)] transition-all">
                    <Plus className="w-4 h-4" /> New Task
                  </button>
                </div>
              </div>
            </section>

            {stats.total > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-steel-dark rounded-full overflow-hidden">
                    <div className="h-full flex">
                      {stats.completed > 0 && <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />}
                      {stats.in_progress > 0 && <div className="h-full bg-gradient-to-r from-cyan-glow to-cyan-teal transition-all duration-500" style={{ width: `${(stats.in_progress / stats.total) * 100}%` }} />}
                      {stats.pending > 0 && <div className="h-full bg-amber-400/60 transition-all duration-500" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-text-muted flex-shrink-0">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{stats.pending} To Do</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-glow" />{stats.in_progress} In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />{stats.completed} Done</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-steel-mid" />{stats.archived} Archived</span>
                  </div>
                </div>
              </section>
            )}

            {loading && tasks.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-cyan-glow animate-spin mx-auto mb-4" />
              </div>
            )}

            {!loading && (
              <section className="grid grid-cols-4 gap-5">
                {COLUMNS.map((col) => {
                  const Icon = col.icon;
                  const columnTasks = tasks.filter(t => t.status === col.key);
                  const count = stats[col.count_key] ?? columnTasks.length;
                  return (
                    <div key={col.key} className="flex flex-col min-h-[400px]">
                      <div className={clsx('flex items-center justify-between px-4 py-3 rounded-t-xl border-b-2', col.bgTint, col.borderColor)}>
                        <div className="flex items-center gap-2.5">
                          <div className={clsx('w-2.5 h-2.5 rounded-full', col.dotColor)} style={{ boxShadow: `0 0 8px currentColor` }} />
                          <span className="font-orbitron text-xs font-bold tracking-wider text-text-primary">{col.label}</span>
                          <span className={clsx('text-xs font-mono px-2 py-0.5 rounded-full', col.bgTint, col.color)}>{count}</span>
                        </div>
                        {col.key === 'pending' && (
                          <button onClick={() => setAddingTo(addingTo === 'pending' ? null : 'pending')} className="w-6 h-6 flex items-center justify-center rounded-md bg-steel-dark/50 hover:bg-cyan-glow/20 text-text-muted hover:text-cyan-glow transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 rounded-b-xl border border-t-0 p-3 space-y-3 overflow-y-auto bg-charcoal/30 border-steel-dark/50">
                        {addingTo === col.key && <AddTaskForm onAdd={handleAdd} onCancel={() => setAddingTo(null)} />}
                        {columnTasks.map((task) => <TaskCard key={task.id} task={task} onMove={handleMove} onDelete={handleDelete} />)}
                        {columnTasks.length === 0 && addingTo !== col.key && (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Icon className={clsx('w-8 h-8 mb-3 opacity-20', col.color)} />
                            <p className="text-xs text-text-muted">No tasks here</p>
                            {col.key === 'pending' && <button onClick={() => setAddingTo('pending')} className="mt-2 text-[11px] text-cyan-glow hover:underline">+ Add a task</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Layout - Stacked list */}
      <div className="md:hidden">
        <MobileLayout title="Tasks">
          <main className="px-3 pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <div>
                {stats.total > 0 && (
                  <span className="text-xs text-text-muted">{stats.total} tasks &middot; {stats.completionRate}% done</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchTasks()} className="w-9 h-9 rounded-lg flex items-center justify-center bg-charcoal active:bg-steel-mid transition-all">
                  <RefreshCw className={clsx('w-4 h-4 text-text-muted', loading && 'animate-spin')} />
                </button>
                <button onClick={() => setAddingTo('pending')} className="h-9 px-3 bg-gradient-to-r from-cyan-glow to-cyan-teal rounded-lg text-deep-space text-xs font-medium flex items-center gap-1 active:scale-95 transition-all">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mb-3">
                <div className="h-1.5 bg-steel-dark rounded-full overflow-hidden">
                  <div className="h-full flex">
                    {stats.completed > 0 && <div className="h-full bg-emerald-400" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />}
                    {stats.in_progress > 0 && <div className="h-full bg-cyan-glow" style={{ width: `${(stats.in_progress / stats.total) * 100}%` }} />}
                    {stats.pending > 0 && <div className="h-full bg-amber-400/60" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{stats.pending}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />{stats.in_progress}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{stats.completed}</span>
                </div>
              </div>
            )}
            {addingTo && (
              <div className="mb-3">
                <AddTaskForm onAdd={handleAdd} onCancel={() => setAddingTo(null)} />
              </div>
            )}
            {loading && tasks.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-cyan-glow animate-spin" />
              </div>
            )}
            {!loading && COLUMNS.filter(col => col.key !== 'archived').map((col) => {
              const columnTasks = tasks.filter(t => t.status === col.key);
              if (columnTasks.length === 0) return null;
              return (
                <div key={col.key} className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className={clsx('w-2 h-2 rounded-full', col.dotColor)} />
                    <span className="font-orbitron text-[10px] font-bold tracking-wider text-text-muted uppercase">{col.label}</span>
                    <span className={clsx('text-[10px] font-mono', col.color)}>{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onMove={handleMove} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              );
            })}
            {!loading && tasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-2">No tasks yet</p>
                <button onClick={() => setAddingTo('pending')} className="text-xs text-cyan-glow">+ Create your first task</button>
              </div>
            )}
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
