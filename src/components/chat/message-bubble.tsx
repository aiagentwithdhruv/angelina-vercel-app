'use client';

import React from 'react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar } from '../ui/avatar';
import { VoiceWaveform, TypingIndicator } from '../ui/voice-fab';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  isSpeaking?: boolean;
  model?: string;
  toolUsed?: string;
  attachments?: Array<{
    type: 'email' | 'task' | 'file';
    title: string;
    detail?: string;
    time?: string;
  }>;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex items-start space-x-3 message-enter', isUser && 'flex-row-reverse space-x-reverse')}>
      {/* Avatar */}
      <Avatar
        size="sm"
        isAI={!isUser}
        fallback={isUser ? 'D' : undefined}
        className={isUser ? 'bg-steel-mid' : undefined}
      />

      {/* Bubble */}
      <div className={clsx('flex flex-col max-w-[70%]', isUser && 'items-end')}>
        <div
          className={clsx(
            'px-4 py-3 text-base leading-relaxed rounded-2xl',
            isUser
              ? 'message-user rounded-tr-sm'
              : clsx(
                  'message-ai rounded-tl-sm',
                  message.isTyping && 'typing-shimmer'
                )
          )}
        >
          {/* Typing Indicator */}
          {message.isTyping && (
            <div className="flex items-center gap-3">
              <TypingIndicator text="Thinking..." />
            </div>
          )}

          {/* Speaking Indicator */}
          {message.isSpeaking && (
            <div className="flex items-center space-x-4 mb-2">
              <VoiceWaveform />
              <span className="text-sm text-cyan-glow font-orbitron tracking-wider">Speaking...</span>
            </div>
          )}

          {/* Content - Markdown rendered */}
          {!message.isTyping && (
            <div className="text-text-primary markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Attachments (like email summaries) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mt-3 text-sm">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="bg-gunmetal rounded-lg p-3 border border-steel-dark"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-cyan-glow">{attachment.title}</span>
                    {attachment.time && (
                      <span className="text-xs text-text-muted">{attachment.time}</span>
                    )}
                  </div>
                  {attachment.detail && (
                    <p className="text-text-secondary">{attachment.detail}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + Model Info + Tool Badge */}
        <div className={clsx('flex items-center gap-2 mt-1.5 flex-wrap', isUser ? 'mr-2 flex-row-reverse' : 'ml-2')}>
          <span className="text-xs text-text-muted">
            {message.timestamp}
          </span>
          {!isUser && message.model && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-steel-dark/50 text-text-muted font-mono">
              {message.model}
            </span>
          )}
          {!isUser && message.toolUsed && (
            <span className="tool-badge">
              {message.toolUsed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick Action Button Component
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="quick-action bg-gunmetal border border-steel-dark rounded-full px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap flex items-center space-x-2 flex-shrink-0 hover:border-cyan-glow/50 hover:text-cyan-glow hover:shadow-[0_0_15px_rgba(0,200,232,0.25),0_0_25px_rgba(0,200,232,0.12)] transition-all"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
