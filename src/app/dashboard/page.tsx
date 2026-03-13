'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { BriefCard } from '@/components/dashboard/BriefCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { KnowledgeCard } from '@/components/dashboard/KnowledgeCard';
import { UsageCard } from '@/components/dashboard/UsageCard';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { WeeklyCard } from '@/components/dashboard/WeeklyCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';

interface ProviderBalance {
  provider: string;
  label: string;
  available: number | null;
  used: number | null;
  limit: number | null;
  currency: string;
  status: 'ok' | 'low' | 'error' | 'unavailable';
}

interface BillingData {
  balances: ProviderBalance[];
  summary: {
    totalAvailableUSD: number | null;
    lowBalanceProviders: string[];
    errorProviders: string[];
  };
}

interface UsageStats {
  totalRequests: number;
  totalCost: number;
  successRate: number;
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
  modelBreakdown: Array<{ model: string; requests: number; cost: number; tokens: number }>;
  providerBreakdown: Array<{ provider: string; requests: number; cost: number }>;
  toolUsage: Array<{ tool: string; count: number; percentage: number }>;
}

function AnalyticsSection({
  data,
  billing,
  revenue,
  onRefresh,
  loading,
  billingLoading,
}: {
  data: UsageStats | null;
  billing: BillingData | null;
  revenue: number;
  onRefresh: () => void;
  loading: boolean;
  billingLoading: boolean;
}) {
  const topModels = data?.modelBreakdown.slice(0, 5) || [];
  const topTools = data?.toolUsage.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-4 min-w-[220px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-deep-space" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Revenue</p>
              <p className="font-orbitron text-2xl font-bold text-text-primary">${revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-gunmetal border border-steel-dark rounded-lg text-text-secondary hover:border-cyan-glow/50 transition-all text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || billingLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-cyan-glow" />
            <h3 className="font-orbitron text-sm font-semibold text-text-secondary">Billing Balances</h3>
          </div>
          {!billing ? (
            <p className="text-sm text-text-muted">No billing data available.</p>
          ) : (
            <div className="space-y-2">
              {billing.balances.map((b) => (
                <div key={b.provider} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{b.label}</span>
                  <span className="text-text-primary font-medium">
                    {b.available !== null ? `${b.currency === 'CNY' ? '¥' : '$'}${b.available.toFixed(2)}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-cyan-glow" />
            <h3 className="font-orbitron text-sm font-semibold text-text-secondary">Usage Summary</h3>
          </div>
          {!data ? (
            <p className="text-sm text-text-muted">No usage data available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-muted">Requests</p>
                <p className="text-text-primary font-semibold">{data.totalRequests}</p>
              </div>
              <div>
                <p className="text-text-muted">Success Rate</p>
                <p className="text-text-primary font-semibold">{data.successRate}%</p>
              </div>
              <div>
                <p className="text-text-muted">Today</p>
                <p className="text-text-primary font-semibold">${data.costToday.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-text-muted">This Month</p>
                <p className="text-text-primary font-semibold">${data.costThisMonth.toFixed(4)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
          <h3 className="font-orbitron text-sm font-semibold text-text-secondary mb-3">Top Models</h3>
          {topModels.length === 0 ? (
            <p className="text-sm text-text-muted">No model usage yet.</p>
          ) : (
            <div className="space-y-2">
              {topModels.map((m) => (
                <div key={m.model} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary truncate mr-3">{m.model}</span>
                  <span className="text-cyan-glow font-medium">${m.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
          <h3 className="font-orbitron text-sm font-semibold text-text-secondary mb-3">Tool Usage</h3>
          {topTools.length === 0 ? (
            <p className="text-sm text-text-muted">No tool usage yet.</p>
          ) : (
            <div className="space-y-2">
              {topTools.map((t) => (
                <div key={t.tool}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">{t.tool}</span>
                    <span className="text-cyan-glow font-medium">{t.count}x</span>
                  </div>
                  <div className="w-full h-1.5 bg-steel-dark rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-glow rounded-full" style={{ width: `${t.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<UsageStats | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const refreshAll = async () => {
    setLoading(true);
    setBillingLoading(true);
    await Promise.all([
      fetch('/api/usage').then((r) => r.ok ? r.json() : null).then(setData).catch(() => {}),
      fetch('/api/billing').then((r) => r.ok ? r.json() : null).then(setBilling).catch(() => {}),
      fetch('/api/revenue').then((r) => r.ok ? r.json() : null).then((d) => { if (d && typeof d.currentRevenue === 'number') setRevenue(d.currentRevenue); }).catch(() => {}),
    ]);
    setLoading(false);
    setBillingLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const desktopBody = useMemo(() => (
    <main className="pt-24 px-8">
      <div className="max-w-[1200px] mx-auto">
        <section className="mb-8">
          <h1 className="font-orbitron text-4xl font-bold metallic-text mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><BriefCard /></div>
            <CalendarCard />
            <TasksCard />
            <GoalsCard />
            <KnowledgeCard />
            <UsageCard />
            <InsightsCard />
            <div className="md:col-span-2"><WeeklyCard /></div>
          </div>
        </section>

        <section className="mb-8">
          <button
            onClick={() => setAnalyticsOpen((v) => !v)}
            className="flex items-center gap-2 font-orbitron text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            {analyticsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Detailed Analytics
          </button>
          {analyticsOpen && (
            <AnalyticsSection
              data={data}
              billing={billing}
              revenue={revenue}
              onRefresh={refreshAll}
              loading={loading}
              billingLoading={billingLoading}
            />
          )}
        </section>
      </div>
    </main>
  ), [analyticsOpen, billing, billingLoading, data, loading, revenue]);

  return (
    <div className="min-h-screen bg-deep-space">
      <div className="hidden md:block">
        <Header />
        {desktopBody}
      </div>

      <div className="md:hidden">
        <MobileLayout title="Dashboard">
          <main className="px-3 pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            <div className="space-y-3 mb-4">
              <BriefCard />
              <CalendarCard />
              <TasksCard />
              <GoalsCard />
              <KnowledgeCard />
              <UsageCard />
              <InsightsCard />
              <WeeklyCard />
            </div>

            <button
              onClick={() => setAnalyticsOpen((v) => !v)}
              className="flex items-center gap-2 font-orbitron text-xs font-semibold text-text-muted uppercase tracking-wider mb-3"
            >
              {analyticsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Analytics
            </button>
            {analyticsOpen && (
              <AnalyticsSection
                data={data}
                billing={billing}
                revenue={revenue}
                onRefresh={refreshAll}
                loading={loading}
                billingLoading={billingLoading}
              />
            )}
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
