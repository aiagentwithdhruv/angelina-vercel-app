'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { MessageCircle, Activity, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Chat', icon: MessageCircle },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal border-t border-steel-dark md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative',
                isActive ? 'text-cyan-glow' : 'text-text-muted'
              )}
            >
              {/* Active indicator line */}
              {isActive && (
                <div
                  className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-cyan-glow rounded-full"
                  style={{ boxShadow: '0 0 12px rgba(0, 200, 232, 0.6)' }}
                />
              )}
              <Icon className={clsx('w-6 h-6', isActive && 'drop-shadow-[0_0_8px_rgba(0,200,232,0.6)]')} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
