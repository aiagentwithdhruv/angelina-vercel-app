'use client';

import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isAI?: boolean;
  isActive?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', isAI, isActive, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-14 h-14 text-lg',
      xl: 'w-20 h-20 text-xl',
    };

    const aiStyles = isAI
      ? 'bg-gradient-to-br from-cyan-glow to-cyan-teal avatar-glow'
      : 'bg-steel-mid';

    const activeStyles = isActive ? 'ring-2 ring-cyan-glow ring-offset-2 ring-offset-deep-space' : '';

    return (
      <div
        ref={ref}
        className={clsx(
          'relative rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
          sizes[size],
          aiStyles,
          activeStyles,
          isAI && 'avatar-glow',
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : isAI ? (
          <svg className="w-1/2 h-1/2 text-deep-space" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        ) : (
          <span className="font-semibold text-text-primary">
            {fallback || '?'}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar with Status Indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export const AvatarWithStatus = React.forwardRef<HTMLDivElement, AvatarWithStatusProps>(
  ({ status = 'online', size = 'md', ...props }, ref) => {
    const statusColors = {
      online: 'bg-success',
      offline: 'bg-steel-mid',
      busy: 'bg-error',
      away: 'bg-warning',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    return (
      <div className="relative" ref={ref}>
        <Avatar size={size} {...props} />
        <div
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-deep-space',
            statusColors[status],
            statusSizes[size],
            status === 'online' && 'shadow-[0_0_8px_rgba(0,232,140,0.6)]'
          )}
        />
      </div>
    );
  }
);

AvatarWithStatus.displayName = 'AvatarWithStatus';
