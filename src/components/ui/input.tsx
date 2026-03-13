'use client';

import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, iconPosition = 'left', type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={clsx(
              'w-full h-11 bg-charcoal border border-steel-dark rounded-lg px-4 text-base text-text-primary placeholder-text-muted',
              'transition-all duration-200 input-glow',
              icon && iconPosition === 'left' && 'pl-12',
              icon && iconPosition === 'right' && 'pr-12',
              error && 'border-error focus:border-error',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full bg-charcoal border border-steel-dark rounded-lg p-4 text-base text-text-primary placeholder-text-muted',
            'transition-all duration-200 input-glow resize-none',
            error && 'border-error focus:border-error',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Chat Input Component (Pill-shaped)
interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onAttach?: () => void;
  onDictate?: () => void;
  isDictating?: boolean;
}

export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ className, onAttach, onDictate, isDictating, ...props }, ref) => {
    return (
      <div className="relative flex-1">
        <button
          type="button"
          onClick={onAttach}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-cyan-glow transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={ref}
          className={clsx(
            'w-full h-12 bg-charcoal border border-steel-dark rounded-full pl-12 text-base text-text-primary placeholder-text-muted',
            'transition-all duration-200 input-glow',
            onDictate ? 'pr-11' : 'px-5',
            className
          )}
          {...props}
        />
        {onDictate && (
          <button
            type="button"
            onClick={onDictate}
            className={clsx(
              'absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all',
              isDictating ? 'bg-cyan-glow/20 text-cyan-glow animate-pulse' : 'text-text-muted hover:text-cyan-glow'
            )}
            title="Dictate"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
