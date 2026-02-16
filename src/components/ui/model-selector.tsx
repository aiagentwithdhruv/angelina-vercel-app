'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

interface ModelOption {
  id: string;
  label: string;
  description: string;
  provider?: string;
}

interface ModelSelectorProps {
  label: string;
  icon: React.ReactNode;
  options: readonly ModelOption[] | ModelOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  grouped?: boolean;
  groupLabels?: Record<string, string>;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  disabled = false,
  grouped = false,
  groupLabels = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.id === value);

  // Group options by provider if grouped
  const groups = grouped
    ? Array.from(new Set(options.map((o) => o.provider || 'other'))).map((provider) => ({
        provider,
        label: groupLabels[provider] || provider,
        models: options.filter((o) => (o.provider || 'other') === provider),
      }))
    : null;

  const isSelected = (id: string) => id === value;

  const renderOption = (option: ModelOption) => (
    <button
      key={option.id}
      type="button"
      onClick={() => { onChange(option.id); setIsOpen(false); }}
      className={clsx(
        'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2',
        'transition-all duration-150',
        isSelected(option.id)
          ? 'text-cyan-glow bg-cyan-glow/10 shadow-[inset_0_0_12px_rgba(0,200,232,0.08)]'
          : 'text-text-secondary hover:text-text-primary hover:bg-steel-dark/50 hover:shadow-[inset_0_0_8px_rgba(0,200,232,0.04)]',
      )}
    >
      <div className="min-w-0">
        <div className={clsx(
          'font-medium truncate',
          isSelected(option.id) && 'text-cyan-glow',
        )}>
          {option.label}
        </div>
        <div className={clsx(
          'text-[10px] truncate',
          isSelected(option.id) ? 'text-cyan-glow/60' : 'text-text-muted',
        )}>
          {option.description}
        </div>
      </div>
      {isSelected(option.id) && (
        <Check className="w-3.5 h-3.5 text-cyan-glow flex-shrink-0" />
      )}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
          'bg-gunmetal border border-steel-dark',
          'hover:border-cyan-glow/50 transition-all',
          isOpen && 'border-cyan-glow/40 shadow-glow-sm',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {icon}
        <span className="text-text-muted">{label}:</span>
        <span className="text-text-primary font-medium">{selected?.label ?? value}</span>
        <ChevronDown className={clsx('w-3 h-3 text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[260px] max-h-[400px] overflow-y-auto bg-charcoal border border-steel-dark/80 rounded-lg shadow-lg shadow-black/40 z-50 backdrop-blur-sm">
          {groups ? (
            groups.map((group) => (
              <div key={group.provider}>
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest bg-deep-space border-b border-steel-dark/50 sticky top-0 z-10">
                  <span className="metallic-text">{group.label}</span>
                </div>
                {group.models.map(renderOption)}
              </div>
            ))
          ) : (
            options.map(renderOption)
          )}
        </div>
      )}
    </div>
  );
};
