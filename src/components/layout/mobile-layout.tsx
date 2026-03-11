'use client';

import React, { useState } from 'react';
import { MobileHeader } from './mobile-header';
import { MobileNav } from './mobile-nav';
import { MobileSidebar } from './mobile-sidebar';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  hideNav?: boolean;
  onChatHistory?: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  hideHeader = false,
  hideNav = false,
  onChatHistory,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      {!hideHeader && (
        <MobileHeader
          onMenuToggle={() => setSidebarOpen(true)}
          onChatHistory={onChatHistory}
          title={title}
        />
      )}

      {/* Sidebar */}
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Page Content */}
      {children}

      {/* Bottom Navigation */}
      {!hideNav && <MobileNav />}
    </>
  );
};
