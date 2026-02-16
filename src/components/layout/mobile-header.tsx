'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Avatar } from '../ui/avatar';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle, title }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gunmetal border-b border-steel-dark md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-charcoal active:bg-steel-mid transition-all"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-glow to-cyan-teal rounded-full flex items-center justify-center glow-soft">
              <svg className="w-4 h-4 text-deep-space" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-orbitron text-lg font-bold metallic-text">
              {title || 'ANGELINA'}
            </span>
          </div>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-charcoal relative active:bg-steel-mid transition-all">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <Avatar size="sm" fallback="D" className="border-2 border-cyan-glow/30" />
        </div>
      </div>
    </header>
  );
};
