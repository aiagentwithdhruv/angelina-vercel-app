'use client';

import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useLocalRecording } from '@/hooks/useLocalRecording';

interface RecordForContextButtonProps {
  onSaved?: (summary: string, count: number) => void;
  onError?: (message: string) => void;
  className?: string;
  compact?: boolean;
}

export function RecordForContextButton({
  onSaved,
  onError,
  className,
  compact = false,
}: RecordForContextButtonProps) {
  const { isRecording, error, startRecording, stopRecording, clearRecording } = useLocalRecording();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const handleStopAndSave = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) {
      setStatus('error');
      setLastMessage('No recording');
      onError?.('No recording');
      return;
    }

    setStatus('saving');
    setLastMessage(null);

    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    formData.append('language_code', 'en-IN');

    try {
      const res = await fetch('/api/record/process', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg = data.error || `Request failed (${res.status})`;
        if (msg.toLowerCase().includes('extract')) {
          msg = 'Recording received. Add OPENROUTER_API_KEY in .env.local for full extraction, or try again.';
        }
        setStatus('error');
        setLastMessage(msg);
        onError?.(msg);
        return;
      }

      if (data.success && (data.summary != null || data.entitiesCreated != null)) {
        const count = Array.isArray(data.entitiesCreated) ? data.entitiesCreated.length : 0;
        const summary = typeof data.summary === 'string' ? data.summary : '';
        setStatus('saved');
        setLastMessage(count > 0 ? `Saved ${count} item(s)` : 'Saved');
        onSaved?.(summary, count);
        setTimeout(() => {
          setStatus('idle');
          setLastMessage(null);
          clearRecording();
        }, 2500);
      } else {
        const errMsg = data.error || 'Could not save context';
        setStatus('error');
        setLastMessage(errMsg);
        onError?.(errMsg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setStatus('error');
      setLastMessage(msg);
      onError?.(msg);
    }
  }, [stopRecording, clearRecording, onSaved, onError]);

  const handleClick = () => {
    if (status === 'saving') return;
    if (isRecording) {
      handleStopAndSave();
    } else {
      startRecording();
    }
  };

  const displayError = error || (status === 'error' ? lastMessage : null);

  return (
    <div className={clsx('flex flex-col items-center gap-1', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'saving'}
        title={isRecording ? 'Stop and save context' : 'Keep this record'}
        className={clsx(
          'rounded-full flex items-center justify-center transition-all border-2 bg-gunmetal border-amber-500/40 hover:border-amber-500/70',
          compact ? 'w-10 h-10' : 'w-12 h-12',
          isRecording && 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse',
          status === 'saving' && 'opacity-70'
        )}
      >
        {status === 'saving' ? (
          <Loader2 className={clsx('text-amber-400 animate-spin', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : isRecording ? (
          <Square className={clsx('text-amber-400 fill-amber-400', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : (
          <Mic className={clsx('text-amber-400', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        )}
      </button>
      {compact && (isRecording || status === 'saved' || status === 'saving') && (
        <span className="text-[10px] text-amber-400/90 max-w-[80px] truncate">
          {isRecording ? 'Recording…' : status === 'saving' ? 'Saving…' : lastMessage || 'Saved'}
        </span>
      )}
      {!compact && (lastMessage || displayError) && (
        <span className={clsx('text-xs max-w-[120px] truncate', status === 'error' || displayError ? 'text-red-400' : 'text-amber-400/90')}>
          {displayError || lastMessage}
        </span>
      )}
    </div>
  );
}
