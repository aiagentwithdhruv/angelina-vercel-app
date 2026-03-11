'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview?: string;
}

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  activeId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed left-0 z-50 flex flex-col',
          'top-0 h-full md:top-16 md:h-[calc(100vh-4rem)]',
          'w-72 bg-charcoal border-r border-steel-dark/60',
          'transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-steel-dark/60">
          <span className="text-sm font-semibold text-text-primary font-orbitron tracking-wider">
            Chats
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg bg-gunmetal border border-steel-dark/60 hover:border-cyan-glow/50 transition-all"
              title="New chat"
            >
              <Plus size={16} className="text-cyan-glow" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gunmetal transition-all md:hidden"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare size={32} className="text-steel-dark mx-auto mb-3" />
              <p className="text-xs text-text-muted">No conversations yet</p>
              <button
                onClick={onNewChat}
                className="mt-3 text-xs text-cyan-glow hover:underline"
              >
                Start a chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={clsx(
                    'group px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all',
                    isActive
                      ? 'bg-gunmetal border border-cyan-glow/20'
                      : 'hover:bg-gunmetal/60 border border-transparent',
                  )}
                  onClick={() => onSelect(conv.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-[13px] font-medium truncate',
                        isActive ? 'text-cyan-glow' : 'text-text-primary',
                      )}>
                        {conv.title}
                      </p>
                      {conv.preview && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {/^\d{4,8}$/.test(conv.preview.trim()) ? '••••' : conv.preview}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-text-muted">
                        {timeAgo(conv.updated_at)}
                      </span>
                      {(hoveredId === conv.id || isActive) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          className="p-1 rounded hover:bg-red-500/20 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} className="text-text-muted hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
