'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  X, MessageCircle, Activity, BarChart3, Settings,
  ListTodo, Users, Lightbulb,
} from 'lucide-react';
import { Avatar } from '../ui/avatar';

const sidebarItems = [
  { href: '/', label: 'Chat', icon: MessageCircle },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/social', label: 'Social', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-72 bg-gunmetal border-r border-steel-dark overflow-y-auto md:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-steel-dark">
          <div className="flex items-center gap-3">
            <Avatar size="md" fallback="D" className="border-2 border-cyan-glow/30" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Dhruv</div>
              <div className="text-xs text-text-muted">Agentic AI Hub</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-charcoal active:bg-steel-mid transition-all"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  isActive
                    ? 'bg-steel-mid glow-soft border border-cyan-glow/30 text-cyan-glow'
                    : 'text-text-secondary hover:bg-steel-mid active:bg-steel-light'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-cyan-glow' : 'text-text-muted')} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Tip Box */}
        <div className="mx-3 mt-6 p-4 bg-charcoal rounded-xl border border-steel-dark">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <span className="text-xs font-semibold text-text-primary">Quick Tip</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Say &quot;Hey Angelina&quot; in the chat to activate voice mode, or tap the A button.
          </p>
        </div>
      </aside>
    </>
  );
};
