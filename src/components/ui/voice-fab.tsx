'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';

interface VoiceFABProps {
  onStart?: () => void;
  onStop?: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  isConnected?: boolean;
  className?: string;
}

export const VoiceFAB: React.FC<VoiceFABProps> = ({
  onStart,
  onStop,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  isConnected = false,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isListening || isConnected || isSpeaking) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  // Determine the state for styling
  const isActive = isListening || isSpeaking || isConnected;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gunmetal border-2 transition-all duration-300',
        'hover-glow-border',
        // Default state
        !isActive && 'border-cyan-glow/30',
        !isActive && isHovered && 'border-cyan-glow/60 shadow-[0_0_20px_rgba(0,200,232,0.3)]',
        // Active/Connected state
        isActive && 'border-cyan-glow shadow-[0_0_25px_rgba(0,200,232,0.5)] bg-cyan-glow/10',
        // Listening state - pulsing
        isListening && 'animate-pulse',
        // Speaking state - glowing strongly
        isSpeaking && 'shadow-[0_0_35px_rgba(0,200,232,0.6)]',
        // Processing state
        isProcessing && 'opacity-70',
        className
      )}
      disabled={isProcessing}
    >
      {isProcessing ? (
        // Loading spinner
        <svg className="w-6 h-6 text-cyan-glow animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        // "A" for Angelina with glow effect
        <span 
          className={clsx(
            'text-2xl font-bold transition-all duration-300',
            isActive ? 'text-cyan-glow drop-shadow-[0_0_10px_rgba(0,200,232,0.8)]' : 'text-cyan-glow/80',
            isHovered && !isActive && 'text-cyan-glow drop-shadow-[0_0_8px_rgba(0,200,232,0.5)]',
            isSpeaking && 'animate-pulse'
          )}
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          A
        </span>
      )}
    </button>
  );
};

// Voice Waveform Component
export const VoiceWaveform: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('flex items-center gap-0.5', className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="voice-bar w-1 bg-gradient-to-t from-cyan-glow to-cyan-teal rounded-full"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
};

// Typing Indicator Component
export const TypingIndicator: React.FC<{ className?: string; text?: string }> = ({ 
  className, 
  text = 'Thinking...' 
}) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-cyan-glow" />
        <span className="typing-dot w-2 h-2 rounded-full bg-cyan-glow" />
        <span className="typing-dot w-2 h-2 rounded-full bg-cyan-glow" />
      </div>
      <span className="text-sm text-text-secondary italic">{text}</span>
    </div>
  );
};
