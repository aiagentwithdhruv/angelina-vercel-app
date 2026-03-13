'use client';

import React, { useState, useEffect } from 'react';

const SUPABASE_CONFIGURED =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const err = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('error') : null;
    if (err === 'auth_callback') setError('Sign-in was cancelled or failed. Try again.');
  }, []);

  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(res.ok ? 'Invalid response from server.' : `Server error (${res.status}). Check the terminal running npm run dev.`);
        setLoading(false);
        return;
      }
      if (data.success) window.location.href = '/';
      else setError(data.error || 'Invalid credentials');
    } catch (err) {
      setError('Connection error. Is the app running on this port? Try npm run dev (or npm run dev:3000) and use that URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }
        setError('');
        setLoading(false);
        setError('Check your email for the confirmation link.');
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      // New users go to onboarding, returning users go to app
      const onboarded = localStorage.getItem('angelina_onboarded');
      window.location.href = onboarded ? '/' : '/onboarding';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/api/auth/callback?next=/` },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleSubmit = SUPABASE_CONFIGURED ? handleSupabaseSubmit : handleLegacySubmit;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-500/30">
            A
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">ANGELINA</h1>
          <p className="text-gray-500 text-sm mt-1">Personal AI Operating System</p>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a32] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            {SUPABASE_CONFIGURED ? (isSignUp ? 'Create account' : 'Sign in') : 'Sign in to continue'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required={!SUPABASE_CONFIGURED || !isSignUp}
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Please wait...' : SUPABASE_CONFIGURED && isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {SUPABASE_CONFIGURED && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a32]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#12121a] text-gray-500">Or continue with</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-lg border border-[#2a2a32] bg-[#1a1a24] text-white hover:bg-[#2a2a32] transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-cyan-400 hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </>
          )}

          {SUPABASE_CONFIGURED && (
            <p className="text-center text-xs text-gray-500 mt-4">
              First time? Sign up with email above. If sign-in fails, add <code className="bg-black/30 px-1 rounded">/api/auth/callback</code> to Supabase Redirect URLs.
            </p>
          )}
          <p className="text-center text-xs text-gray-600 mt-6">Angelina AI</p>
        </div>
      </div>
    </div>
  );
}
