'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'stat' | 'activity';
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = true, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-300';
    
    const variants = {
      default: 'card-glow p-6',
      stat: 'stat-card rounded-xl p-5',
      activity: 'bg-gunmetal border border-steel-dark rounded-lg p-4 activity-item cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title Component
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx('font-orbitron text-lg font-semibold text-text-primary', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

// Card Content Component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx(className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';
