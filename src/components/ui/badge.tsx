'use client';

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, pulse, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-r from-steel-dark to-gunmetal border-steel-mid text-text-secondary',
      success: 'bg-success/10 border-success/30 text-success',
      warning: 'bg-warning/10 border-warning/30 text-warning',
      error: 'bg-error/10 border-error/30 text-error',
      info: 'bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow',
    };

    const dotColors = {
      default: 'bg-text-muted',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      info: 'bg-cyan-glow',
    };

    const sizes = {
      sm: 'h-5 px-2 text-xs',
      md: 'h-6 px-3 text-sm',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              dotColors[variant],
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge with specific states
interface StatusBadgeProps {
  status: 'thinking' | 'executing' | 'completed' | 'failed' | 'waiting';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    thinking: { variant: 'info' as const, text: 'Thinking', pulse: true },
    executing: { variant: 'warning' as const, text: 'Executing', pulse: true },
    completed: { variant: 'success' as const, text: 'Completed', pulse: false },
    failed: { variant: 'error' as const, text: 'Failed', pulse: false },
    waiting: { variant: 'default' as const, text: 'Waiting', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot pulse={config.pulse}>
      {config.text}
    </Badge>
  );
};
