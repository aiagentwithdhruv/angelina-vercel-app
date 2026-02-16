'use client';

import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-500/30">
            A
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">ANGELINA</h1>
          <p className="text-gray-500 text-sm mt-1">Personal AI Operating System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#12121a] border border-[#2a2a32] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to continue</h2>

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
                required
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Secured by AIwithDhruv
          </p>
        </div>
      </div>
    </div>
  );
}
