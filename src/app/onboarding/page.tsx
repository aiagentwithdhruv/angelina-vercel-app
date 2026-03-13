'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ArrowRight, Check } from 'lucide-react';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'US Eastern (EST)' },
  { value: 'America/Chicago', label: 'US Central (CST)' },
  { value: 'America/Denver', label: 'US Mountain (MST)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST)' },
  { value: 'Europe/London', label: 'UK (GMT)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Australia (AEST)' },
];

const USE_CASES = [
  { id: 'productivity', emoji: '⚡', label: 'Productivity & Tasks', desc: 'Email, calendar, task management' },
  { id: 'business', emoji: '💼', label: 'Business & Work', desc: 'Strategy, proposals, client management' },
  { id: 'learning', emoji: '📚', label: 'Learning & Research', desc: 'Study, language, knowledge building' },
  { id: 'personal', emoji: '🏠', label: 'Personal Life', desc: 'Daily planning, reminders, wellness' },
  { id: 'creative', emoji: '🎨', label: 'Creative Work', desc: 'Writing, content, brainstorming' },
  { id: 'coding', emoji: '💻', label: 'Coding & Dev', desc: 'Development, debugging, GitHub' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = TIMEZONES.find(t => t.value === detected);
      if (match) setTimezone(match.value);
    } catch { /* fallback to manual selection */ }
  }, []);

  const toggleUseCase = (id: string) => {
    setSelectedUseCases(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save profile via API
      await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name,
          timezone,
          useCases: selectedUseCases,
          onboardingComplete: true,
        }),
      });

      // Save as memory so Angelina knows the user
      await fetch('/api/tools/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `User profile: ${name}`,
          content: `User's name is ${name}. Timezone: ${timezone}. Primary interests: ${selectedUseCases.join(', ')}. Call them by name.`,
          type: 'preference',
          importance: 'high',
        }),
      });

      // Mark onboarding done in localStorage
      localStorage.setItem('angelina_onboarded', 'true');
      localStorage.setItem('angelina_user_name', name);

      window.location.href = '/';
    } catch {
      // Even if save fails, let them through
      localStorage.setItem('angelina_onboarded', 'true');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-deep-space flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-cyan-glow w-6' : i < step ? 'bg-cyan-glow/60' : 'bg-steel-dark'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-glow/20 to-cyan-teal/10 border-2 border-cyan-glow/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(0, 200, 232, 0.2)' }}>
              <Mic className="w-8 h-8 text-cyan-glow" />
            </div>
            <h1 className="font-orbitron text-2xl font-bold metallic-text mb-2">Welcome to Angelina</h1>
            <p className="text-text-secondary mb-8">Let&apos;s set things up so I can help you better.</p>

            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-2 text-left">What should I call you?</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full h-12 rounded-xl bg-gunmetal border border-steel-dark px-4 text-text-primary placeholder:text-text-muted focus:border-cyan-glow/50 focus:outline-none text-lg"
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(1); }}
              />
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Timezone */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="font-orbitron text-xl font-bold metallic-text mb-2">Hi {name}!</h2>
            <p className="text-text-secondary mb-6">What timezone are you in? This helps me greet you at the right time.</p>

            <div className="grid grid-cols-2 gap-2 mb-6 max-h-[300px] overflow-y-auto">
              {TIMEZONES.map(tz => (
                <button
                  key={tz.value}
                  onClick={() => setTimezone(tz.value)}
                  className={`px-3 py-3 rounded-xl border text-left text-sm transition-all ${
                    timezone === tz.value
                      ? 'border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow'
                      : 'border-steel-dark bg-gunmetal/50 text-text-secondary hover:border-steel-mid'
                  }`}
                >
                  {tz.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl border border-steel-dark text-text-secondary">
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!timezone}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Use cases */}
        {step === 2 && (
          <div className="text-center">
            <h2 className="font-orbitron text-xl font-bold metallic-text mb-2">What will you use Angelina for?</h2>
            <p className="text-text-secondary mb-6">Pick as many as you like. This helps me prioritize.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {USE_CASES.map(uc => (
                <button
                  key={uc.id}
                  onClick={() => toggleUseCase(uc.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedUseCases.includes(uc.id)
                      ? 'border-cyan-glow/60 bg-cyan-glow/10'
                      : 'border-steel-dark bg-gunmetal/50 hover:border-steel-mid'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{uc.emoji}</span>
                    {selectedUseCases.includes(uc.id) && <Check className="w-4 h-4 text-cyan-glow ml-auto" />}
                  </div>
                  <p className="text-sm font-medium text-text-primary">{uc.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{uc.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border border-steel-dark text-text-secondary">
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {saving ? 'Setting up...' : 'Start Using Angelina'}
              </button>
            </div>
          </div>
        )}

        {/* Skip */}
        {step < 2 && (
          <button
            onClick={() => {
              localStorage.setItem('angelina_onboarded', 'true');
              window.location.href = '/';
            }}
            className="block mx-auto mt-6 text-xs text-text-muted hover:text-text-secondary transition-all"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
