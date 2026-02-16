'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Bell, Activity, ListTodo, LayoutDashboard, Users, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Chat', icon: Activity },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/social', label: 'Social', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface HeaderProps {
  isActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isActive }) => {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-charcoal/95 backdrop-blur-sm border-b border-steel-dark/60 z-50 flex items-center">
      <div className="w-full px-6 flex items-center justify-between">
        {/* Logo & Navigation */}
        <div className="flex items-center space-x-10">
          {/* Logo — glows when Angelina is active */}
          <Link href="/" className="flex items-center gap-3">
            <div className={clsx(
              'w-9 h-9 rounded-lg hero-glow-ring flex items-center justify-center',
              isActive && 'header-logo-active'
            )} style={!isActive ? { animationDuration: '5s' } : undefined}>
              <span className="text-lg font-bold hero-a-metallic font-orbitron">A</span>
            </div>
            <span className="font-orbitron text-lg font-bold metallic-text tracking-wider">ANGELINA</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 bg-gunmetal/50 rounded-xl p-1 border border-steel-dark/40">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'header-nav-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-b from-steel-dark to-charcoal text-cyan-glow border border-cyan-glow/20 shadow-[0_0_12px_rgba(0,200,232,0.15)]'
                      : 'text-text-muted hover:text-text-secondary hover:bg-steel-dark/30'
                  )}
                >
                  <Icon className={clsx('w-3.5 h-3.5', isActive ? 'text-cyan-glow' : 'text-text-muted')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="w-9 h-9 bg-gunmetal rounded-lg flex items-center justify-center border border-steel-dark hover:bg-steel-mid hover:border-cyan-glow/30 transition-all relative">
            <Bell className="w-4 h-4 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" style={{ boxShadow: '0 0 6px rgba(255, 59, 48, 0.5)' }} />
          </button>

          {/* Connection Status */}
          <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gunmetal/50 border border-steel-dark/30">
            <div
              className="w-1.5 h-1.5 rounded-full bg-success"
              style={{ boxShadow: '0 0 6px rgba(0, 232, 140, 0.6)' }}
            />
            <span className="text-[10px] text-text-muted font-mono">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
