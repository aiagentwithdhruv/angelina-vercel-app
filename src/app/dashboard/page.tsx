'use client';

import React, { useState, useEffect } from 'react';
import { Download, ArrowUp, ArrowDown, RefreshCw, Wallet, AlertTriangle, DollarSign, Pencil, FileDown } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Button } from '@/components/ui/button';

interface ProviderBalance {
  provider: string;
  label: string;
  available: number | null;
  used: number | null;
  limit: number | null;
  currency: string;
  status: 'ok' | 'low' | 'error' | 'unavailable';
  error?: string;
  source?: 'api' | 'manual';
}

interface BillingData {
  balances: ProviderBalance[];
  summary: {
    totalAvailableUSD: number | null;
    lowBalanceProviders: string[];
    errorProviders: string[];
  };
  fetchedAt: string;
}

interface UsageStats {
  totalRequests: number;
  totalCost: number;
  successRate: number;
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
  dailyCosts: Array<{ date: string; cost: number; requests: number }>;
  modelBreakdown: Array<{ model: string; requests: number; cost: number; tokens: number }>;
  providerBreakdown: Array<{ provider: string; requests: number; cost: number }>;
  toolUsage: Array<{ tool: string; count: number; percentage: number }>;
  recentEntries: Array<{
    id: string;
    timestamp: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    success: boolean;
    toolUsed?: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<UsageStats | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueInput, setRevenueInput] = useState('');

  useEffect(() => {
    fetchUsageData();
    fetchBillingData();
    fetch('/api/revenue')
      .then(res => res.json())
      .then(d => { if (typeof d.currentRevenue === 'number') setRevenue(d.currentRevenue); })
      .catch(() => {});
  }, []);

  const saveRevenue = async () => {
    const amount = parseFloat(revenueInput);
    if (isNaN(amount)) { setEditingRevenue(false); return; }
    try {
      const res = await fetch('/api/revenue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) });
      const d = await res.json();
      if (d.currentRevenue !== undefined) setRevenue(d.currentRevenue);
    } catch {}
    setEditingRevenue(false);
  };

  const exportRevenue = () => {
    const csv = `Revenue Report\nDate,Amount\n${new Date().toISOString().split('T')[0]},$${revenue.toLocaleString()}\n\nTotal Revenue,$${revenue.toLocaleString()}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `revenue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingData = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing');
      if (res.ok) {
        const billingData = await res.json();
        setBilling(billingData);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const refreshAll = () => {
    fetchUsageData();
    fetchBillingData();
  };

  // Derived stat cards
  const stats = data ? [
    {
      label: 'TOTAL REQUESTS',
      value: data.totalRequests.toString(),
      change: `${data.dailyCosts[data.dailyCosts.length - 1]?.requests || 0} today`,
      isPositive: true,
    },
    {
      label: 'COST TODAY',
      value: `$${data.costToday.toFixed(4)}`,
      change: `$${data.costThisWeek.toFixed(4)} this week`,
      isPositive: false,
    },
    {
      label: 'SUCCESS RATE',
      value: `${data.successRate}%`,
      change: data.successRate >= 90 ? 'Healthy' : 'Needs attention',
      isPositive: data.successRate >= 90,
    },
    {
      label: 'MODELS USED',
      value: data.modelBreakdown.length.toString(),
      change: data.modelBreakdown[0] ? `Top: ${data.modelBreakdown[0].model}` : 'No data',
      isPositive: true,
    },
  ] : [];

  // Cost chart data
  const costChartData = data?.dailyCosts.map(d => ({
    day: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    cost: d.cost,
    requests: d.requests,
  })) || [];

  const maxCost = Math.max(...costChartData.map(d => d.cost), 0.001);

  // Tool usage (top 5)
  const toolUsageData = data?.toolUsage.slice(0, 5) || [];

  // Model breakdown (top 5 for display)
  const topModels = data?.modelBreakdown.slice(0, 5) || [];
  const maxModelCost = Math.max(...topModels.map(m => m.cost), 0.001);

  return (
    <div className="min-h-screen bg-deep-space">
      {/* Desktop */}
      <div className="hidden md:block">
      <Header />
        <main className="pt-24 px-8">
          <div className="max-w-[1200px] mx-auto">
            <section className="mb-8">
              <div className="flex items-center justify-between">
                <h1 className="font-orbitron text-4xl font-bold metallic-text">Dashboard</h1>
                <div className="flex items-center space-x-4">
                  <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2.5 bg-gunmetal border border-steel-dark rounded-lg text-text-secondary hover:border-cyan-glow/50 transition-all text-sm">
                    <RefreshCw className={`w-4 h-4 ${loading || billingLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <Button icon={<Download className="w-4 h-4" />}>Export</Button>
                </div>
              </div>
            </section>

            {/* Revenue Card — metallic style */}
            <section className="mb-8">
              <div className="full-glow-card rounded-xl p-6 border border-emerald-400/15"
                   style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center"
                         style={{ boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)' }}>
                      <DollarSign className="w-7 h-7 text-deep-space" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Revenue</p>
                      {editingRevenue ? (
                        <input
                          type="number"
                          autoFocus
                          value={revenueInput}
                          onChange={(e) => setRevenueInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveRevenue(); if (e.key === 'Escape') setEditingRevenue(false); }}
                          onBlur={saveRevenue}
                          className="bg-steel-dark border border-emerald-400/30 rounded-lg px-4 py-2 text-3xl font-bold text-emerald-400 font-orbitron w-48 outline-none focus:border-emerald-400/60"
                          placeholder="0"
                        />
                      ) : (
                        <span className="font-orbitron text-4xl font-bold metallic-text">
                          ${revenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editingRevenue && (
                      <button
                        onClick={() => { setRevenueInput(String(revenue)); setEditingRevenue(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gunmetal border border-steel-dark rounded-lg text-text-secondary hover:border-emerald-400/40 transition-all text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={exportRevenue}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gunmetal border border-steel-dark rounded-lg text-text-secondary hover:border-cyan-glow/50 transition-all text-sm"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {loading && !data && (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-cyan-glow animate-spin mx-auto mb-4" />
              </div>
            )}

            {!loading && data && data.totalRequests === 0 && (
              <div className="text-center py-10">
                <p className="text-text-secondary text-lg mb-2">No usage data yet</p>
                <p className="text-text-muted text-sm">Start chatting with Angelina to see real-time stats here!</p>
              </div>
            )}

            {/* Show balances even when no usage data */}
            {billing && (!data || data.totalRequests === 0) && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-orbitron text-lg font-semibold text-text-primary flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-cyan-glow" />
                    Provider Balances
                  </h3>
                  {billing.summary.totalAvailableUSD !== null && (
                    <div className="text-sm text-text-secondary">
                      Total Available: <span className="font-orbitron font-bold text-cyan-glow">${billing.summary.totalAvailableUSD.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {billing.balances.map((b) => (
                    <div key={b.provider} className={`full-glow-card rounded-xl p-4 ${b.status === 'low' ? 'border-amber-500/40' : b.status === 'error' ? 'border-red-500/40' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted uppercase tracking-wider truncate">{b.label}</span>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'ok' ? 'bg-success' : b.status === 'low' ? 'bg-amber-400' : b.status === 'error' ? 'bg-red-400' : 'bg-steel-mid'}`} />
                      </div>
                      {b.available !== null ? (
                        <div className="font-orbitron text-xl font-bold text-text-primary">
                          {b.currency === 'CNY' ? '¥' : '$'}{b.available.toFixed(2)}
                        </div>
                      ) : b.used !== null ? (
                        <div className="font-orbitron text-xl font-bold text-text-primary">
                          ${b.used.toFixed(2)} <span className="text-xs text-text-muted font-normal">used</span>
                        </div>
                      ) : (
                        <div className="font-orbitron text-lg text-text-muted">—</div>
                      )}
                      {b.error && b.status !== 'ok' && (
                        <div className="text-[10px] text-text-muted mt-1 truncate" title={b.error}>{b.error}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-text-muted mt-2 text-right">
                  Updated: {new Date(billing.fetchedAt).toLocaleTimeString()}
                </div>
              </section>
            )}

            {data && data.totalRequests > 0 && (
              <>
                {/* Stats Grid - 4 columns */}
                <section className="mb-8">
                  <div className="grid grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="full-glow-card rounded-xl p-5">
                        <div className="text-text-muted text-xs uppercase tracking-wider mb-2">{stat.label}</div>
                        <div className="font-orbitron text-3xl font-bold text-text-primary mb-2">{stat.value}</div>
                        <div className="flex items-center text-xs">
                          {stat.isPositive ? <ArrowUp className="w-3 h-3 text-success mr-1" /> : <ArrowDown className="w-3 h-3 text-error mr-1" />}
                          <span className={stat.isPositive ? 'text-success' : 'text-error'}>{stat.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Provider Balances */}
                {billing && (
                  <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-orbitron text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-cyan-glow" />
                        Provider Balances
                      </h3>
                      {billing.summary.totalAvailableUSD !== null && (
                        <div className="text-sm text-text-secondary">
                          Total Available: <span className="font-orbitron font-bold text-cyan-glow">${billing.summary.totalAvailableUSD.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {billing.summary.lowBalanceProviders.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-300">Low balance: {billing.summary.lowBalanceProviders.join(', ')}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {billing.balances.map((b) => (
                        <div key={b.provider} className={`full-glow-card rounded-xl p-4 ${b.status === 'low' ? 'border-amber-500/40' : b.status === 'error' ? 'border-red-500/40' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-muted uppercase tracking-wider truncate">{b.label}</span>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'ok' ? 'bg-success' : b.status === 'low' ? 'bg-amber-400' : b.status === 'error' ? 'bg-red-400' : 'bg-steel-mid'}`} />
                          </div>
                          {b.available !== null ? (
                            <div className="font-orbitron text-xl font-bold text-text-primary">
                              {b.currency === 'CNY' ? '¥' : '$'}{b.available.toFixed(2)}
                            </div>
                          ) : b.used !== null ? (
                            <div className="font-orbitron text-xl font-bold text-text-primary">
                              ${b.used.toFixed(2)} <span className="text-xs text-text-muted font-normal">used</span>
                            </div>
                          ) : (
                            <div className="font-orbitron text-lg text-text-muted">—</div>
                          )}
                          {b.limit !== null && (
                            <div className="mt-1">
                              <div className="w-full h-1.5 bg-steel-dark rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-glow rounded-full" style={{ width: `${Math.min(((b.used || 0) / b.limit) * 100, 100)}%` }} />
                              </div>
                              <div className="text-[10px] text-text-muted mt-0.5">${(b.used || 0).toFixed(2)} / ${b.limit.toFixed(2)}</div>
                            </div>
                          )}
                          {b.error && b.status !== 'ok' && (
                            <div className="text-[10px] text-text-muted mt-1 truncate" title={b.error}>{b.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-text-muted mt-2 text-right">
                      Updated: {new Date(billing.fetchedAt).toLocaleTimeString()}
                    </div>
                  </section>
                )}

                {/* Cost Chart */}
                <section className="mb-8">
                  <div className="full-glow-card rounded-xl p-6">
                    <h3 className="font-orbitron text-lg font-semibold text-text-primary mb-4">Cost Breakdown (Last 7 Days)</h3>
                    <div className="h-64 flex items-end justify-between gap-4">
                      {costChartData.map((d, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center justify-end h-52 relative">
                            <div className="text-[10px] text-text-muted mb-1">${d.cost.toFixed(4)}</div>
                            <div className="chart-bar w-full bg-gradient-to-t from-cyan-glow to-cyan-teal rounded-t-md cursor-pointer" style={{ height: `${Math.max((d.cost / maxCost) * 100, 2)}%`, boxShadow: '0 0 10px rgba(0, 200, 232, 0.3)' }} />
                          </div>
                          <span className="text-xs text-text-muted mt-2">{d.day}</span>
                          <span className="text-[10px] text-text-muted">{d.requests} req</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-end mt-4 gap-6">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-glow rounded-sm" /><span className="text-xs text-text-muted">Daily Cost (USD)</span></div>
                      <div className="text-xs text-text-muted">Total: ${data.totalCost.toFixed(4)}</div>
                    </div>
                  </div>
                </section>

                {/* Bottom Cards - 2 columns */}
                <section className="grid grid-cols-2 gap-6 mb-8">
                  <div className="full-glow-card rounded-xl p-6">
                    <h3 className="font-orbitron text-lg font-semibold text-text-primary mb-6">Model Cost Breakdown</h3>
                    {topModels.length > 0 ? (
                      <div className="space-y-4">
                        {topModels.map((m, index) => (
                          <div key={index} className="tool-row">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-text-secondary">{m.model}</span>
                              <span className="text-sm font-semibold text-cyan-glow">${m.cost.toFixed(4)}</span>
                            </div>
                            <div className="w-full h-2 bg-steel-dark rounded-full overflow-hidden">
                              <div className="h-full progress-fill rounded-full transition-all duration-500" style={{ width: `${(m.cost / maxModelCost) * 100}%` }} />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-text-muted">{m.requests} requests</span>
                              <span className="text-[10px] text-text-muted">{m.tokens.toLocaleString()} tokens</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-text-muted">No model data yet</p>}
                  </div>

                  <div className="full-glow-card rounded-xl p-6">
                    <h3 className="font-orbitron text-lg font-semibold text-text-primary mb-6">Recent API Calls</h3>
                    {data.recentEntries.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {data.recentEntries.slice(0, 10).map((entry) => (
                          <div key={entry.id} className="flex items-start justify-between py-2 border-b border-steel-dark/30 last:border-0">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary font-medium">{entry.model}</span>
                                {!entry.success && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">failed</span>}
                                {entry.toolUsed && <span className="text-[10px] px-1.5 py-0.5 bg-cyan-glow/10 text-cyan-glow rounded">{entry.toolUsed}</span>}
                              </div>
                              <div className="text-[10px] text-text-muted mt-0.5">{entry.inputTokens + entry.outputTokens > 0 ? `${entry.inputTokens.toLocaleString()} in / ${entry.outputTokens.toLocaleString()} out` : 'Token count unavailable'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-cyan-glow">${entry.cost.toFixed(6)}</div>
                              <div className="text-[10px] text-text-muted">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-text-muted">No recent activity</p>}
                  </div>
                </section>

                {(toolUsageData.length > 0 || data.providerBreakdown.length > 0) && (
                  <section className="grid grid-cols-2 gap-6 mb-8">
                    {toolUsageData.length > 0 && (
                      <div className="full-glow-card rounded-xl p-6">
                        <h3 className="font-orbitron text-lg font-semibold text-text-primary mb-6">Tool Usage</h3>
                        <div className="space-y-4">
                          {toolUsageData.map((tool, index) => (
                            <div key={index} className="tool-row">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-text-secondary">{tool.tool}</span>
                                <span className="text-sm font-semibold text-cyan-glow">{tool.count}x ({tool.percentage}%)</span>
                              </div>
                              <div className="w-full h-2 bg-steel-dark rounded-full overflow-hidden">
                                <div className="h-full progress-fill rounded-full transition-all duration-500" style={{ width: `${tool.percentage}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.providerBreakdown.length > 0 && (
                      <div className="full-glow-card rounded-xl p-6">
                        <h3 className="font-orbitron text-lg font-semibold text-text-primary mb-6">Provider Breakdown</h3>
                        <div className="space-y-4">
                          {data.providerBreakdown.map((p, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-steel-dark/30 last:border-0">
                              <div>
                                <span className="text-sm text-text-secondary font-medium capitalize">{p.provider}</span>
                                <span className="text-[10px] text-text-muted ml-2">{p.requests} requests</span>
                              </div>
                              <span className="text-sm font-semibold text-cyan-glow">${p.cost.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileLayout title="Dashboard">
          <main className="px-3 pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-orbitron text-sm font-semibold text-text-muted uppercase tracking-wider">Overview</h2>
              <button onClick={refreshAll} className="w-9 h-9 rounded-lg flex items-center justify-center bg-charcoal active:bg-steel-mid transition-all">
                <RefreshCw className={`w-4 h-4 text-text-muted ${loading || billingLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {/* Revenue Card — Mobile */}
            <div className="bg-gunmetal border border-emerald-400/15 rounded-xl p-4 mb-3"
                 style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-deep-space" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Revenue</p>
                    {editingRevenue ? (
                      <input
                        type="number"
                        autoFocus
                        value={revenueInput}
                        onChange={(e) => setRevenueInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveRevenue(); if (e.key === 'Escape') setEditingRevenue(false); }}
                        onBlur={saveRevenue}
                        className="bg-steel-dark border border-emerald-400/30 rounded-md px-2 py-1 text-xl font-bold text-emerald-400 font-orbitron w-28 outline-none"
                        placeholder="0"
                      />
                    ) : (
                      <span className="font-orbitron text-xl font-bold metallic-text">${revenue.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {!editingRevenue && (
                    <button onClick={() => { setRevenueInput(String(revenue)); setEditingRevenue(true); }}
                      className="w-8 h-8 rounded-lg bg-steel-dark/60 border border-steel-dark flex items-center justify-center">
                      <Pencil className="w-3 h-3 text-text-muted" />
                    </button>
                  )}
                  <button onClick={exportRevenue}
                    className="w-8 h-8 rounded-lg bg-steel-dark/60 border border-steel-dark flex items-center justify-center">
                    <FileDown className="w-3 h-3 text-text-muted" />
                  </button>
                </div>
              </div>
            </div>
            {loading && !data && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-glow animate-spin" />
              </div>
            )}
            {!loading && data && data.totalRequests === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-text-muted">No data yet. Start chatting!</p>
              </div>
            )}
            {data && data.totalRequests > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-gunmetal border border-steel-dark rounded-xl p-3">
                      <div className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{stat.label}</div>
                      <div className="font-orbitron text-xl font-bold text-text-primary">{stat.value}</div>
                      <div className="flex items-center text-[10px] mt-1">
                        {stat.isPositive ? <ArrowUp className="w-2.5 h-2.5 text-success mr-0.5" /> : <ArrowDown className="w-2.5 h-2.5 text-error mr-0.5" />}
                        <span className={stat.isPositive ? 'text-success' : 'text-error'}>{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {billing && (
                  <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-orbitron text-xs font-semibold text-text-primary flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-cyan-glow" />
                        Balances
                      </h3>
                      {billing.summary.totalAvailableUSD !== null && (
                        <span className="text-[10px] text-cyan-glow font-orbitron font-bold">${billing.summary.totalAvailableUSD.toFixed(2)}</span>
                      )}
                    </div>
                    {billing.summary.lowBalanceProviders.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md">
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] text-amber-300">Low: {billing.summary.lowBalanceProviders.join(', ')}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {billing.balances.map((b) => (
                        <div key={b.provider} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.status === 'ok' ? 'bg-success' : b.status === 'low' ? 'bg-amber-400' : b.status === 'error' ? 'bg-red-400' : 'bg-steel-mid'}`} />
                            <span className="text-xs text-text-secondary">{b.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-text-primary font-orbitron">
                            {b.available !== null
                              ? `${b.currency === 'CNY' ? '¥' : '$'}${b.available.toFixed(2)}`
                              : b.used !== null
                                ? `$${b.used.toFixed(2)} used`
                                : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                  <h3 className="font-orbitron text-xs font-semibold text-text-primary mb-2">Cost (7 Days)</h3>
                  <div className="h-[120px] flex items-end justify-between gap-1">
                    {costChartData.map((d, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center justify-end h-[90px]">
                          <div className="chart-bar w-full bg-gradient-to-t from-cyan-glow to-cyan-teal rounded-t-sm" style={{ height: `${Math.max((d.cost / maxCost) * 100, 4)}%`, boxShadow: '0 0 6px rgba(0, 200, 232, 0.3)' }} />
                        </div>
                        <span className="text-[9px] text-text-muted mt-1">{d.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-text-muted">Total: ${data.totalCost.toFixed(4)}</span>
                  </div>
                </div>
                {topModels.length > 0 && (
                  <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                    <h3 className="font-orbitron text-xs font-semibold text-text-primary mb-2">Models</h3>
                    <div className="space-y-2">
                      {topModels.map((m, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-secondary truncate mr-2">{m.model}</span>
                            <span className="text-xs font-semibold text-cyan-glow">${m.cost.toFixed(4)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-steel-dark rounded-full overflow-hidden">
                            <div className="h-full progress-fill rounded-full" style={{ width: `${(m.cost / maxModelCost) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.providerBreakdown.length > 0 && (
                  <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                    <h3 className="font-orbitron text-xs font-semibold text-text-primary mb-2">Providers</h3>
                    <div className="space-y-2">
                      {data.providerBreakdown.map((p, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary capitalize">{p.provider}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted">{p.requests} req</span>
                            <span className="text-xs font-semibold text-cyan-glow">${p.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
