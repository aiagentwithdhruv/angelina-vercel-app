'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg';
    
    const variants = {
      primary: 'bg-gradient-to-b from-steel-mid to-gunmetal border border-cyan-glow/20 text-text-primary hover:border-cyan-glow/50 hover:shadow-[0_0_20px_rgba(0,200,232,0.3),0_0_35px_rgba(0,200,232,0.15),inset_0_0_20px_rgba(0,200,232,0.05)] active:scale-95',
      secondary: 'bg-transparent border border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60 hover:shadow-[0_0_20px_rgba(0,200,232,0.25),0_0_30px_rgba(0,200,232,0.12)] active:bg-cyan-glow/15',
      ghost: 'bg-transparent border border-steel-dark text-text-secondary hover:border-cyan-glow/40 hover:text-cyan-glow hover:shadow-[0_0_15px_rgba(0,200,232,0.15),0_0_25px_rgba(0,200,232,0.08)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          (disabled || isLoading) && disabledStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
