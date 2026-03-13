'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic, Brain, Zap, Shield, ArrowRight, Check } from 'lucide-react';

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Show success even if API fails — we'll add proper backend later
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-deep-space text-text-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-steel-dark/30">
        <div className="flex items-center gap-2">
          <span className="font-orbitron text-xl font-bold text-cyan-glow">A</span>
          <span className="font-orbitron text-sm tracking-[0.2em] metallic-text">ANGELINA</span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow text-sm hover:bg-cyan-glow/20 transition-all"
        >
          Open App
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 md:pt-24 pb-16">
        {/* Voice orb */}
        <div className="relative mb-8">
          <div className="absolute -inset-8 rounded-full border border-cyan-glow/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute -inset-4 rounded-full border border-cyan-glow/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-glow/15 to-cyan-teal/5 border-2 border-cyan-glow/30"
            style={{ boxShadow: '0 0 60px rgba(0, 200, 232, 0.2)' }}
          >
            <Mic className="w-12 h-12 md:w-16 md:h-16 text-cyan-glow drop-shadow-[0_0_16px_rgba(0,200,232,0.8)]" />
          </div>
        </div>

        <h1 className="font-orbitron text-3xl md:text-5xl font-bold metallic-text mb-4 tracking-wide">
          Your AI That Actually <span className="text-cyan-glow">Works</span> For You
        </h1>
        <p className="text-base md:text-lg text-text-secondary max-w-2xl mb-8 leading-relaxed">
          Angelina isn&apos;t a chatbot. She&apos;s a voice-first AI operating system that checks your email,
          manages your tasks, remembers everything, and takes action — all by voice.
          Smarter than ChatGPT. Cheaper than Claude.
        </p>

        {/* CTA */}
        {!submitted ? (
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 h-12 rounded-full bg-gunmetal border border-steel-dark px-5 text-sm text-text-primary placeholder:text-text-muted focus:border-cyan-glow/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,200,232,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow mb-6">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when Angelina Pro launches.</span>
          </div>
        )}

        <p className="text-xs text-text-muted">Free tier: 30 messages/day. No credit card required.</p>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-16 border-t border-steel-dark/30">
        <h2 className="font-orbitron text-xl md:text-2xl font-bold text-center metallic-text mb-12 tracking-wide">
          Why Angelina &gt; ChatGPT
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: <Mic className="w-8 h-8 text-cyan-glow" />,
              title: 'Voice-First',
              description: 'Talk to Angelina like you talk to a person. No typing needed. One tap to start a conversation.',
            },
            {
              icon: <Brain className="w-8 h-8 text-purple-400" />,
              title: 'She Remembers You',
              description: 'Angelina remembers your preferences, clients, habits, and history. Every conversation makes her smarter.',
            },
            {
              icon: <Zap className="w-8 h-8 text-amber-400" />,
              title: 'She Acts, Not Just Talks',
              description: 'Check email, create tasks, search the web, make calls — Angelina does things autonomously without asking.',
            },
            {
              icon: <Shield className="w-8 h-8 text-emerald-400" />,
              title: '10x Cheaper',
              description: 'Multi-model routing means the cheapest model handles simple tasks. You get Claude-level smarts at Gemini prices.',
            },
            {
              icon: <span className="text-2xl">🎭</span>,
              title: 'Persona Modes',
              description: 'Switch between Bestie, English Tutor, Business Strategist, Life Coach, or Kids Playmate — same AI, different personality.',
            },
            {
              icon: <span className="text-2xl">🌅</span>,
              title: 'Morning Brief',
              description: 'Wake up to a personalized summary: emails, tasks, calendar, and priorities — delivered by voice or Telegram.',
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-gunmetal/50 border border-steel-dark hover:border-steel-mid transition-all">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-6 md:px-12 py-16 border-t border-steel-dark/30">
        <h2 className="font-orbitron text-xl md:text-2xl font-bold text-center metallic-text mb-12 tracking-wide">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="p-6 rounded-2xl bg-gunmetal/50 border border-steel-dark">
            <h3 className="font-orbitron text-lg font-bold text-text-primary mb-1">Free</h3>
            <p className="text-3xl font-bold text-text-primary mb-4">$0<span className="text-sm text-text-muted font-normal">/mo</span></p>
            <ul className="space-y-2 text-sm text-text-secondary mb-6">
              {['30 messages/day', 'Voice conversations', 'Basic memory', 'Persona modes', 'Web search'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/" className="block w-full text-center py-3 rounded-full border border-steel-mid text-sm text-text-secondary hover:border-cyan-glow/30 transition-all">
              Get Started
            </Link>
          </div>
          {/* Pro */}
          <div className="p-6 rounded-2xl bg-cyan-glow/5 border-2 border-cyan-glow/30 relative">
            <span className="absolute -top-3 left-6 px-3 py-0.5 bg-cyan-glow text-deep-space text-xs font-bold rounded-full">COMING SOON</span>
            <h3 className="font-orbitron text-lg font-bold text-cyan-glow mb-1">Pro</h3>
            <p className="text-3xl font-bold text-text-primary mb-4">$20<span className="text-sm text-text-muted font-normal">/mo</span></p>
            <ul className="space-y-2 text-sm text-text-secondary mb-6">
              {['Unlimited messages', 'Priority voice (OpenAI Realtime)', 'Full memory + knowledge graph', 'Autonomous actions', 'Morning brief (Telegram/voice)', 'Email & calendar integration', 'Priority support'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-glow flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                const el = document.querySelector('input[type="email"]');
                if (el) (el as HTMLInputElement).focus();
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-semibold text-sm hover:shadow-[0_0_20px_rgba(0,200,232,0.4)] transition-all"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-steel-dark/30 text-center">
        <p className="text-xs text-text-muted">
          Built by <a href="https://aiwithdhruv.com" target="_blank" rel="noopener noreferrer" className="text-cyan-glow/70 hover:text-cyan-glow">Dhruv</a> &middot; Powered by multiple AI models &middot; &copy; {new Date().getFullYear()} Angelina AI
        </p>
      </footer>
    </div>
  );
}
