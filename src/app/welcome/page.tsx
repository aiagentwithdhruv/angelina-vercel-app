'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic, Brain, Zap, Mail, Calendar, CheckSquare, Search, Github,
  ArrowRight, Check, ChevronDown, Shield, Clock, TrendingUp,
  MessageSquare, Globe, Sparkles, Users, Lock, BarChart3, X, Phone,
  MicOff,
} from 'lucide-react';
import { useGeminiLiveVoice } from '@/hooks/useGeminiLiveVoice';

/* ─── constants ─── */
const TOOLS = [
  { icon: Mail, label: 'Email', color: 'text-red-400' },
  { icon: Calendar, label: 'Calendar', color: 'text-blue-400' },
  { icon: CheckSquare, label: 'Tasks', color: 'text-emerald-400' },
  { icon: Search, label: 'Web Search', color: 'text-amber-400' },
  { icon: Github, label: 'GitHub', color: 'text-purple-400' },
  { icon: MessageSquare, label: 'Telegram', color: 'text-sky-400' },
  { icon: Globe, label: 'Wikipedia', color: 'text-teal-400' },
  { icon: BarChart3, label: 'Analytics', color: 'text-pink-400' },
];

const USE_CASES = [
  {
    title: 'Freelancers & Consultants',
    desc: 'Juggling 5 clients? Angelina remembers every project, deadline, and preference. Ask "What did I discuss with Acme last week?" — instant answer.',
    icon: Users,
  },
  {
    title: 'Founders & Solo Operators',
    desc: 'You wear every hat. Angelina checks email, creates tasks from voice, tracks goals, and sends you a morning brief — before you open your laptop.',
    icon: TrendingUp,
  },
  {
    title: 'Sales Professionals',
    desc: 'Never forget a prospect again. Angelina stores every conversation, drafts follow-ups, and reminds you who to call — all by voice between meetings.',
    icon: Zap,
  },
  {
    title: 'Developers',
    desc: 'Voice-first task management, GitHub integration, web search, and persistent memory for debugging context. Code more, type less.',
    icon: Github,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Tap & Talk', desc: 'One tap opens a voice conversation. No menus, no typing. Just speak.', icon: Mic },
  { step: '02', title: 'She Acts', desc: 'Checks email, creates tasks, searches the web — autonomously.', icon: Zap },
  { step: '03', title: 'She Remembers', desc: 'Every interaction builds your personal knowledge graph. Gets smarter over time.', icon: Brain },
  { step: '04', title: 'She Reports', desc: 'Morning brief, proactive alerts. Never miss what matters.', icon: Clock },
];

const COMPARISON = [
  { feature: 'Remembers your conversations', angelina: true, chatgpt: false, claude: false },
  { feature: 'Checks your email', angelina: true, chatgpt: false, claude: false },
  { feature: 'Creates & tracks tasks', angelina: true, chatgpt: false, claude: false },
  { feature: 'Voice-first (one tap)', angelina: true, chatgpt: false, claude: false },
  { feature: 'Morning brief via Telegram', angelina: true, chatgpt: false, claude: false },
  { feature: 'Multi-model routing', angelina: true, chatgpt: false, claude: false },
  { feature: 'Acts autonomously', angelina: true, chatgpt: false, claude: false },
  { feature: 'Free tier', angelina: true, chatgpt: true, claude: true },
];

/* ─── animated counter ─── */
function AnimatedNumber({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── sketch SVG icons (background doodles) ─── */
function SketchIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Brain */}
      <svg className="sketch-icon" style={{ top: '8%', left: '5%', width: 80, height: 80 }} viewBox="0 0 24 24">
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
        <path d="M9 21h6M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
      </svg>
      {/* Mail */}
      <svg className="sketch-icon" style={{ top: '15%', right: '8%', width: 70, height: 70 }} viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 4L12 13 2 4" />
      </svg>
      {/* Chart */}
      <svg className="sketch-icon" style={{ top: '45%', left: '3%', width: 60, height: 60 }} viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
      {/* Phone */}
      <svg className="sketch-icon" style={{ top: '60%', right: '5%', width: 55, height: 55 }} viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      {/* Target */}
      <svg className="sketch-icon" style={{ top: '75%', left: '10%', width: 65, height: 65 }} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
      {/* Users */}
      <svg className="sketch-icon" style={{ top: '30%', right: '12%', width: 72, height: 72 }} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

/* ─── Angelina sales prompt ─── */
const ANGELINA_SALES_PROMPT = `You are Angelina — a voice-first AI productivity assistant. You are currently on the landing page of your own website, talking to a potential user who just clicked "Talk to Angelina."

Your goal: Be warm, impressive, and conversational. Help them understand what you can do. Make them want to sign up.

Key facts about yourself:
- You're a voice-first AI that checks email, manages tasks, searches the web, and remembers everything
- You have persistent memory — you get smarter the more someone uses you
- You're 10x cheaper than ChatGPT Pro thanks to multi-model routing
- You support 30+ tool integrations (email, calendar, GitHub, Telegram, web search, etc.)
- Free tier: 30 messages/day. Pro: $20/month with unlimited messages
- Built for professionals — freelancers, founders, sales people, developers

Conversation style:
- Warm, confident, slightly playful
- Keep responses SHORT (2-3 sentences max) — this is voice, not text
- Ask what they do for work, then explain how you'd help THEM specifically
- If they ask "what can you do?" — give 2-3 concrete examples, not a feature list
- End with a soft CTA: "Want to try me out? Just sign up — it's free"

Do NOT:
- Be robotic or corporate
- Give long feature lists
- Say "I'm just an AI" or downplay yourself
- Mention technical details unless asked

Start by saying: "Hey! I'm Angelina. Thanks for clicking — most people just scroll past. What do you do for work? I want to show you something cool."`;

/* ─── hero voice widget (inline) ─── */
function HeroVoiceWidget() {
  const [started, setStarted] = useState(false);

  const {
    isConnected,
    isListening,
    isSpeaking,
    aiTranscript,
    userTranscript,
    connect,
    disconnect,
    startListening,
    stopListening,
    error,
  } = useGeminiLiveVoice({
    systemPrompt: ANGELINA_SALES_PROMPT,
    voice: 'Zephyr',
  });

  const handleStart = useCallback(async () => {
    try {
      await connect();
      await startListening();
      setStarted(true);
    } catch (err) {
      console.error('[LandingVoice] Failed to start:', err);
    }
  }, [connect, startListening]);

  const handleStop = useCallback(() => {
    stopListening();
    disconnect();
    setStarted(false);
  }, [stopListening, disconnect]);

  const isActive = isListening || isSpeaking;

  return (
    <div className="flex flex-col items-center">
      {/* Voice orb */}
      <div className="relative mb-6">
        {/* Orbit rings */}
        {!started && (
          <>
            <div className="hero-orbit-ring" />
            <div className="hero-orbit-ring-2" />
          </>
        )}
        {/* Listening rings */}
        {isActive && (
          <div className="listening-ring-container">
            <div className="listening-ring" />
            <div className="listening-ring" />
            <div className="listening-ring" />
          </div>
        )}
        <button
          onClick={started ? handleStop : handleStart}
          className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
            isSpeaking
              ? 'hero-glow-ring'
              : isListening
              ? 'hero-glow-ring'
              : 'hero-glow-ring'
          } ${started ? 'header-logo-active' : ''}`}
          style={started && isActive ? {
            boxShadow: '0 0 40px rgba(0,200,232,0.4), 0 0 80px rgba(0,200,232,0.2), 0 0 120px rgba(0,200,232,0.1)',
          } : undefined}
        >
          {started ? (
            isSpeaking ? (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 bg-cyan-glow rounded-full voice-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            ) : isListening ? (
              <Mic className="w-12 h-12 md:w-14 md:h-14 text-cyan-glow drop-shadow-[0_0_20px_rgba(0,200,232,0.8)]" />
            ) : (
              <Mic className="w-12 h-12 md:w-14 md:h-14 text-text-muted" />
            )
          ) : (
            <Mic className="w-12 h-12 md:w-14 md:h-14 text-cyan-glow drop-shadow-[0_0_20px_rgba(0,200,232,0.8)]" />
          )}
        </button>
      </div>

      {/* Status text */}
      {started ? (
        <div className="text-center mb-4">
          <p className="text-sm text-cyan-glow font-medium mb-1">
            {isSpeaking ? 'Angelina is speaking...' : isListening ? 'Listening...' : isConnected ? 'Connected' : 'Connecting...'}
          </p>
          {(aiTranscript || userTranscript) && (
            <div className="max-w-md mx-auto text-xs space-y-1 mt-2 px-4">
              {userTranscript && (
                <p className="text-text-muted"><span className="text-text-secondary">You:</span> {userTranscript}</p>
              )}
              {aiTranscript && (
                <p className="text-cyan-glow/70"><span className="text-cyan-glow">Angelina:</span> {aiTranscript}</p>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          <button onClick={handleStop} className="mt-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-all">
            <MicOff className="w-3 h-3 inline mr-1" /> End
          </button>
        </div>
      ) : (
        <p className="text-sm text-text-muted mb-2">Tap the orb to talk with Angelina</p>
      )}
    </div>
  );
}

/* ─── page ─── */
export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    } catch { /* handled below */ }
    setSubmitted(true);
    setLoading(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-deep-space text-text-primary overflow-x-hidden">

      {/* ━━━ NAV ━━━ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-nav border-b border-steel-dark/40 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-glow to-cyan-teal flex items-center justify-center shadow-glow-sm">
              <span className="font-orbitron text-sm font-bold text-deep-space">A</span>
            </div>
            <span className="font-orbitron text-sm tracking-[0.15em] text-text-primary font-semibold">ANGELINA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <button onClick={() => scrollToSection('features')} className="hover:text-cyan-glow transition-colors">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-cyan-glow transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('use-cases')} className="hover:text-cyan-glow transition-colors">Use Cases</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-glow transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-all">
              Sign in
            </Link>
            <Link href="/login" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-bold text-sm hover:shadow-glow-lg transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-6">
        {/* Background layers */}
        <div className="landing-grid-bg" />
        <div className="landing-top-light" />
        <div className="landing-rays" />
        <div className="landing-hero-glow" />
        <SketchIcons />

        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-glow/5 rounded-full blur-3xl float-orb pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-teal/5 rounded-full blur-3xl float-orb pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-500/3 rounded-full blur-3xl float-orb pointer-events-none" style={{ animationDelay: '5s' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-glow/5 border border-cyan-glow/20 text-cyan-glow text-xs font-medium mb-8 animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5" />
            AI Productivity OS for Professionals
          </div>

          {/* Voice Orb — THE MAIN CTA */}
          <div className="animate-fade-in-up animate-fade-in-up-delay-1">
            <HeroVoiceWidget />
          </div>

          {/* Headline */}
          <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] animate-fade-in-up animate-fade-in-up-delay-2">
            <span className="metallic-text">The AI That </span>
            <span className="metallic-shimmer">Remembers</span>
            <br className="hidden sm:block" />
            <span className="metallic-text"> Your Work & </span>
            <span className="metallic-shimmer">Gets It Done</span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animate-fade-in-up-delay-3">
            Angelina is a voice-first AI that checks your email, manages tasks, and remembers everything about your work.
            Stop copy-pasting from ChatGPT. Start getting things done.
          </p>

          {/* Email CTA */}
          <div className="animate-fade-in-up animate-fade-in-up-delay-4">
            {!submitted ? (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="flex-1 h-[52px] rounded-full bg-gunmetal/80 border border-steel-dark px-6 text-sm text-text-primary placeholder:text-text-muted focus:border-cyan-glow/50 focus:outline-none backdrop-blur-sm input-glow"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-[52px] px-8 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-bold text-sm flex items-center justify-center gap-2 hover:shadow-glow-lg transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? 'Joining...' : 'Start Free'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 mb-6">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">You&apos;re in! Check your email for next steps.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 30 free messages/day</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Setup in 60 seconds</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-text-muted" />
        </div>
      </section>

      {/* ━━━ GLOW LINE DIVIDER ━━━ */}
      <div className="glow-line-h w-full max-w-2xl mx-auto" />

      {/* ━━━ SOCIAL PROOF BAR ━━━ */}
      <section className="relative border-y border-steel-dark/30 bg-gunmetal/20">
        <div className="landing-grid-dots" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="stat-card rounded-xl p-4">
            <p className="font-orbitron text-2xl md:text-3xl font-bold text-cyan-glow"><AnimatedNumber target={30} suffix="+" /></p>
            <p className="text-xs text-text-muted mt-1">Tool Integrations</p>
          </div>
          <div className="stat-card rounded-xl p-4">
            <p className="font-orbitron text-2xl md:text-3xl font-bold text-text-primary"><AnimatedNumber target={5} /></p>
            <p className="text-xs text-text-muted mt-1">AI Models Working Together</p>
          </div>
          <div className="stat-card rounded-xl p-4">
            <p className="font-orbitron text-2xl md:text-3xl font-bold text-text-primary"><AnimatedNumber target={10} suffix="x" /></p>
            <p className="text-xs text-text-muted mt-1">Cheaper Than ChatGPT Pro</p>
          </div>
          <div className="stat-card rounded-xl p-4">
            <p className="font-orbitron text-2xl md:text-3xl font-bold text-emerald-400">&lt;1s</p>
            <p className="text-xs text-text-muted mt-1">Voice Response Time</p>
          </div>
        </div>
      </section>

      {/* ━━━ THE PROBLEM ━━━ */}
      <section className="relative px-6 py-20 md:py-28">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-orbitron text-2xl md:text-3xl font-bold mb-6">
            ChatGPT Is a <span className="text-text-muted line-through decoration-red-400/60">Search Engine</span> With Personality
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            You ask. It answers. You copy-paste. Repeat. It doesn&apos;t know your clients, can&apos;t check your email,
            forgets everything next session, and costs $20/month just to type at it.
          </p>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { pain: 'Forgets everything', fix: 'Angelina builds permanent memory of your work', icon: Brain },
              { pain: "Can't take action", fix: 'Angelina checks email, creates tasks, searches — by voice', icon: Zap },
              { pain: '$20/mo to type at it', fix: 'Free tier + multi-model routing = 10x cheaper', icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="card-glow p-5 rounded-2xl text-left hover-lift">
                <item.icon className="w-6 h-6 text-cyan-glow mb-3" />
                <p className="text-red-400/70 text-sm line-through mb-2">{item.pain}</p>
                <p className="text-sm text-text-primary leading-relaxed">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30">
        <div className="landing-grid-dots" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Core Features</p>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold">
              Everything You Need. <span className="metallic-shimmer">Nothing You Don&apos;t.</span>
            </h2>
          </div>

          {/* Feature 1: Voice-First */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow text-xs font-medium mb-4">
                <Mic className="w-3.5 h-3.5" /> Voice-First
              </div>
              <h3 className="font-orbitron text-xl md:text-2xl font-bold mb-4 metallic-text">Talk, Don&apos;t Type</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                One tap opens a voice conversation. Ask Angelina to check your email between meetings,
                create a task while driving, or brainstorm while walking.
              </p>
              <ul className="space-y-2.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-glow flex-shrink-0" /> Free voice via Gemini Live API</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-glow flex-shrink-0" /> Premium voice via OpenAI Realtime</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-glow flex-shrink-0" /> Works on mobile, tablet, desktop</li>
              </ul>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-glow/8 to-transparent border border-cyan-glow/15 flex items-center justify-center">
                  <div className="w-44 h-44 rounded-full bg-gradient-to-br from-cyan-glow/12 to-transparent border border-cyan-glow/20 flex items-center justify-center animate-breath">
                    <div className="w-24 h-24 rounded-full icon-ring flex items-center justify-center">
                      <Mic className="w-10 h-10 text-cyan-glow drop-shadow-[0_0_15px_rgba(0,200,232,0.6)]" />
                    </div>
                  </div>
                </div>
                <div className="hero-orbit-ring" style={{ inset: '-12px' }} />
              </div>
            </div>
          </div>

          {/* Feature 2: Persistent Memory */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 relative flex items-center justify-center">
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {[
                  { text: 'Client: Acme Corp — prefers Monday calls', delay: '0s' },
                  { text: 'Project deadline: March 28', delay: '0.15s' },
                  { text: 'Likes concise emails, no fluff', delay: '0.3s' },
                  { text: 'Tech stack: React + Python', delay: '0.45s' },
                ].map((mem, i) => (
                  <div key={i} className="card-glow p-3 rounded-xl text-xs text-text-secondary leading-relaxed hover-lift" style={{ animationDelay: mem.delay }}>
                    <Brain className="w-3.5 h-3.5 text-purple-400 mb-1.5" />
                    {mem.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-xs font-medium mb-4">
                <Brain className="w-3.5 h-3.5" /> Persistent Memory
              </div>
              <h3 className="font-orbitron text-xl md:text-2xl font-bold mb-4 metallic-text">She Remembers Everything</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Every conversation, every preference, every client detail — stored permanently with semantic search.
                Ask &quot;What did we decide about the pricing?&quot; — instant answer from months ago.
              </p>
              <ul className="space-y-2.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 flex-shrink-0" /> Semantic search via pgvector embeddings</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 flex-shrink-0" /> Auto-saves important facts from conversations</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-purple-400 flex-shrink-0" /> Gets smarter the more you use it</li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Autonomous Actions */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium mb-4">
                <Zap className="w-3.5 h-3.5" /> Autonomous Actions
              </div>
              <h3 className="font-orbitron text-xl md:text-2xl font-bold mb-4 metallic-text">She Acts, You Don&apos;t Ask</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Morning brief at 8 AM. Proactive task reminders. Email digests. Calendar prep before meetings.
                Angelina works in the background.
              </p>
              <ul className="space-y-2.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 flex-shrink-0" /> Morning brief via Telegram or voice</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 flex-shrink-0" /> Autonomous task execution every 15 min</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 flex-shrink-0" /> Proactive alerts for deadlines & follow-ups</li>
              </ul>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="space-y-3 max-w-xs w-full">
                {[
                  { time: '8:00 AM', action: 'Morning brief sent to Telegram', icon: Clock, color: 'text-amber-400' },
                  { time: '10:15 AM', action: 'Reminded: Follow up with client', icon: MessageSquare, color: 'text-cyan-glow' },
                  { time: '2:00 PM', action: 'Task completed: Research report', icon: CheckSquare, color: 'text-emerald-400' },
                  { time: '6:30 PM', action: 'Daily digest: 12 emails, 3 tasks done', icon: BarChart3, color: 'text-purple-400' },
                ].map((item, i) => (
                  <div key={i} className="card-glow flex items-center gap-3 p-3 rounded-xl hover-lift">
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted">{item.time}</p>
                      <p className="text-sm text-text-secondary truncate">{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ TOOLS GRID ━━━ */}
      <section className="relative px-6 py-16 border-t border-steel-dark/30 bg-gunmetal/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Integrations</p>
          <h2 className="font-orbitron text-xl md:text-2xl font-bold mb-10">30+ Tools. <span className="metallic-shimmer">One Voice Command.</span></h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {TOOLS.map((tool, i) => (
              <div key={i} className="card-glow flex flex-col items-center gap-2 p-3 rounded-xl group hover-lift">
                <tool.icon className={`w-6 h-6 ${tool.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] text-text-muted">{tool.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30">
        <div className="landing-grid-dots" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">How It Works</p>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold">From Voice to <span className="metallic-shimmer">Action</span> in Seconds</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative text-center hover-lift">
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-px glow-line-h" />
                )}
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl card-glow flex items-center justify-center relative">
                  <item.icon className="w-8 h-8 text-cyan-glow" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space text-xs font-bold flex items-center justify-center shadow-glow-sm">{item.step}</span>
                </div>
                <h4 className="font-semibold text-text-primary mb-2">{item.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ USE CASES ━━━ */}
      <section id="use-cases" className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Built For Professionals</p>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold">Your Role. <span className="metallic-shimmer">Your AI.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {USE_CASES.map((uc, i) => (
              <div key={i} className="full-glow-card p-6 rounded-2xl">
                <uc.icon className="w-8 h-8 text-cyan-glow mb-3" />
                <h3 className="font-semibold text-lg text-text-primary mb-2">{uc.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ COMPARISON TABLE ━━━ */}
      <section className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30">
        <div className="landing-grid-dots" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Comparison</p>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold">Angelina vs. <span className="metallic-shimmer">The Rest</span></h2>
          </div>
          <div className="card-glow rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 bg-gunmetal/60 text-xs font-semibold text-text-muted py-3.5 px-5 border-b border-steel-dark">
              <span>Feature</span>
              <span className="text-center text-cyan-glow">Angelina</span>
              <span className="text-center">ChatGPT</span>
              <span className="text-center">Claude</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 text-sm py-3 px-5 transition-colors hover:bg-cyan-glow/3 ${i % 2 === 0 ? 'bg-gunmetal/20' : 'bg-transparent'} ${i < COMPARISON.length - 1 ? 'border-b border-steel-dark/20' : ''}`}>
                <span className="text-text-secondary text-xs sm:text-sm">{row.feature}</span>
                <span className="text-center">{row.angelina ? <Check className="w-4 h-4 text-cyan-glow mx-auto" /> : <span className="text-text-muted">-</span>}</span>
                <span className="text-center">{row.chatgpt ? <Check className="w-4 h-4 text-text-muted mx-auto" /> : <span className="text-text-muted">-</span>}</span>
                <span className="text-center">{row.claude ? <Check className="w-4 h-4 text-text-muted mx-auto" /> : <span className="text-text-muted">-</span>}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TECH STACK ━━━ */}
      <section className="relative px-6 py-16 border-t border-steel-dark/30 bg-gunmetal/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Under The Hood</p>
            <h2 className="font-orbitron text-xl md:text-2xl font-bold"><span className="metallic-shimmer">Enterprise-Grade</span> Architecture</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Multi-Model Routing', desc: 'GPT-4, Claude, Gemini — picks the best model per query', icon: Sparkles },
              { label: 'Semantic Memory', desc: 'pgvector embeddings for meaning-based recall', icon: Brain },
              { label: 'End-to-End Encrypted', desc: 'Your data stays yours. Supabase RLS on every table', icon: Lock },
              { label: 'Real-Time Streaming', desc: "Responses stream as they're generated. No waiting", icon: Zap },
            ].map((item, i) => (
              <div key={i} className="card-glow p-4 rounded-xl hover-lift">
                <item.icon className="w-5 h-5 text-cyan-glow mb-2" />
                <p className="text-sm font-medium text-text-primary mb-1">{item.label}</p>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30">
        <div className="landing-grid-dots" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-cyan-glow/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cyan-glow text-sm font-medium tracking-wider uppercase mb-3">Pricing</p>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold mb-3">Start Free. <span className="metallic-shimmer">Upgrade When Hooked.</span></h2>
            <p className="text-text-secondary text-sm">No credit card. No trial that expires. Just start.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="card-glow p-7 rounded-2xl">
              <h3 className="font-orbitron text-lg font-bold text-text-primary mb-1">Free</h3>
              <p className="text-4xl font-bold text-text-primary mb-1">$0<span className="text-sm text-text-muted font-normal">/month</span></p>
              <p className="text-xs text-text-muted mb-6">Experience the magic</p>
              <div className="glow-line-h mb-6" />
              <ul className="space-y-2.5 text-sm text-text-secondary mb-8">
                {['30 messages per day', 'Voice conversations (Gemini)', 'Persistent memory', 'Web search & Wikipedia', 'Task management', 'Persona modes'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/login" className="block w-full text-center py-3.5 rounded-full border border-steel-mid text-sm text-text-secondary hover:border-cyan-glow/40 hover:text-text-primary transition-all">
                Get Started Free
              </Link>
            </div>
            {/* Pro */}
            <div className="full-glow-card p-7 rounded-2xl relative border-2 border-cyan-glow/30">
              <span className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space text-xs font-bold rounded-full shadow-glow-sm">MOST POPULAR</span>
              <h3 className="font-orbitron text-lg font-bold text-cyan-glow mb-1">Pro</h3>
              <p className="text-4xl font-bold text-text-primary mb-1">$20<span className="text-sm text-text-muted font-normal">/month</span></p>
              <p className="text-xs text-text-muted mb-6">For professionals who mean business</p>
              <div className="glow-line-h mb-6" />
              <ul className="space-y-2.5 text-sm text-text-secondary mb-8">
                {['Unlimited messages', 'Priority voice (OpenAI Realtime)', 'Full memory + knowledge graph', 'Email & calendar integration', 'Autonomous morning briefs', 'GitHub integration', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-glow flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="block w-full text-center py-3.5 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-bold text-sm hover:shadow-glow-lg transition-all cursor-pointer"
              >
                Join Waitlist for Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="relative px-6 py-20 md:py-28 border-t border-steel-dark/30 overflow-hidden">
        <div className="landing-grid-bg" />
        <div className="landing-hero-glow" style={{ top: '0' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-orbitron text-2xl md:text-4xl font-bold mb-4">
            Stop Typing at Chatbots.<br /><span className="metallic-shimmer">Start Getting Things Done.</span>
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Join professionals who are replacing 5 productivity apps with one voice-first AI that actually remembers their work.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-glow to-cyan-teal text-deep-space font-bold text-base hover:shadow-glow-lg transition-all"
          >
            Start Using Angelina — Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-text-muted mt-4">30 messages/day free. No credit card needed.</p>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-steel-dark/30 bg-gunmetal/20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-glow to-cyan-teal flex items-center justify-center shadow-glow-sm">
                  <span className="font-orbitron text-xs font-bold text-deep-space">A</span>
                </div>
                <span className="font-orbitron text-xs tracking-[0.15em] text-text-primary font-semibold">ANGELINA</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                AI productivity OS for professionals. Voice-first. Memory-powered. Action-oriented.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2 text-xs text-text-muted">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-glow transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-glow transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('use-cases')} className="hover:text-cyan-glow transition-colors">Use Cases</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Resources</p>
              <ul className="space-y-2 text-xs text-text-muted">
                <li><Link href="/login" className="hover:text-cyan-glow transition-colors">Sign In</Link></li>
                <li><a href="https://github.com/aiagentwithdhruv" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-glow transition-colors">GitHub</a></li>
                <li><a href="https://youtube.com/@aiwithdhruv" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-glow transition-colors">YouTube</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Connect</p>
              <ul className="space-y-2 text-xs text-text-muted">
                <li><a href="https://linkedin.com/in/aiwithdhruv" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-glow transition-colors">LinkedIn</a></li>
                <li><a href="https://x.com/aiwithdhruv" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-glow transition-colors">X / Twitter</a></li>
                <li><a href="https://aiwithdhruv.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-glow transition-colors">Portfolio</a></li>
              </ul>
            </div>
          </div>
          <div className="glow-line-h mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} Angelina AI. Built by <a href="https://aiwithdhruv.com" target="_blank" rel="noopener noreferrer" className="text-cyan-glow/70 hover:text-cyan-glow transition-colors">Dhruv</a>
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your data is encrypted and never shared</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
