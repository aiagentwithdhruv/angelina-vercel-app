/**
 * Billing API — Fetch real-time credit/balance from each AI provider
 *
 * Real-time APIs: Moonshot, Twilio
 * Manual overrides + usage subtraction: OpenRouter, OpenAI, Anthropic
 * No balance API: Vapi
 *
 * Manual balances are stored in billing-overrides.json.
 * Usage from usage-data.json is auto-subtracted since the override was set.
 */

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

interface Override {
  initial_balance: number;
  set_at: string;
}

interface UsageEntry {
  timestamp: string;
  provider: string;
  cost: number;
}

// ── Read overrides + usage ──

const OVERRIDES_FILE = join(process.cwd(), 'billing-overrides.json');
const USAGE_FILE = join(process.cwd(), 'usage-data.json');

function readOverrides(): Record<string, Override> {
  try {
    if (!existsSync(OVERRIDES_FILE)) return {};
    return JSON.parse(readFileSync(OVERRIDES_FILE, 'utf-8')).overrides || {};
  } catch { return {}; }
}

function getUsageSince(provider: string, since: string): number {
  try {
    if (!existsSync(USAGE_FILE)) return 0;
    const entries: UsageEntry[] = JSON.parse(readFileSync(USAGE_FILE, 'utf-8'));
    return entries
      .filter(e => e.provider === provider && e.timestamp >= since)
      .reduce((sum, e) => sum + (e.cost || 0), 0);
  } catch { return 0; }
}

function applyOverride(balance: ProviderBalance): ProviderBalance {
  if (balance.available !== null) return balance; // Already has real-time data

  const overrides = readOverrides();
  const override = overrides[balance.provider];
  if (!override) return balance;

  const usedSince = getUsageSince(balance.provider, override.set_at);
  const available = Math.max(0, override.initial_balance - usedSince);

  return {
    ...balance,
    available: Math.round(available * 100) / 100,
    used: Math.round(usedSince * 10000) / 10000,
    limit: override.initial_balance,
    status: available < 3 ? 'low' : 'ok',
    source: 'manual',
    error: undefined,
  };
}

// ── Provider fetch functions ──

async function getOpenRouterBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { provider: 'openrouter', label: 'OpenRouter', available: null, used: null, limit: null, currency: 'USD', status: 'unavailable', error: 'No API key' };

  // OpenRouter API doesn't expose prepaid credits — use manual override
  return applyOverride({
    provider: 'openrouter',
    label: 'OpenRouter',
    available: null,
    used: null,
    limit: null,
    currency: 'USD',
    status: 'ok',
  });
}

async function getMoonshotBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) return { provider: 'moonshot', label: 'Moonshot (Kimi)', available: null, used: null, limit: null, currency: 'USD', status: 'unavailable', error: 'No API key' };

  try {
    const res = await fetch('https://api.moonshot.ai/v1/users/me/balance', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || 'API error');

    const available = data.data?.available_balance ?? data.data?.balance ?? null;

    return {
      provider: 'moonshot',
      label: 'Moonshot (Kimi)',
      available: available !== null ? parseFloat(available) : null,
      used: null,
      limit: null,
      currency: 'USD',
      status: available !== null && parseFloat(available) < 5 ? 'low' : 'ok',
      source: 'api',
    };
  } catch (err: any) {
    return { provider: 'moonshot', label: 'Moonshot (Kimi)', available: null, used: null, limit: null, currency: 'USD', status: 'error', error: err.message };
  }
}

async function getOpenAIBalance(): Promise<ProviderBalance> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { provider: 'openai', label: 'OpenAI', available: null, used: null, limit: null, currency: 'USD', status: 'unavailable', error: 'No API key' };

  // OpenAI project keys can't access billing — use manual override
  return applyOverride({
    provider: 'openai',
    label: 'OpenAI',
    available: null,
    used: null,
    limit: null,
    currency: 'USD',
    status: 'ok',
  });
}

async function getAnthropicBalance(): Promise<ProviderBalance> {
  // Anthropic has no public billing API — always use manual override
  // Works regardless of API key (balance tracks Claude console credits)
  return applyOverride({
    provider: 'anthropic',
    label: 'Anthropic (Claude)',
    available: null,
    used: null,
    limit: null,
    currency: 'USD',
    status: 'ok',
  });
}

async function getTwilioBalance(): Promise<ProviderBalance> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { provider: 'twilio', label: 'Twilio (Calls)', available: null, used: null, limit: null, currency: 'USD', status: 'unavailable', error: 'No credentials' };

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
      headers: { 'Authorization': 'Basic ' + btoa(`${sid}:${token}`) },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Twilio API error');

    const balance = parseFloat(data.balance || '0');

    return {
      provider: 'twilio',
      label: 'Twilio (Calls)',
      available: balance,
      used: null,
      limit: null,
      currency: data.currency || 'USD',
      status: balance < 5 ? 'low' : 'ok',
      source: 'api',
    };
  } catch (err: any) {
    return { provider: 'twilio', label: 'Twilio (Calls)', available: null, used: null, limit: null, currency: 'USD', status: 'error', error: err.message };
  }
}

async function getVapiBalance(): Promise<ProviderBalance> {
  // Vapi has no public balance API — use manual override
  return applyOverride({
    provider: 'vapi',
    label: 'Vapi (AI Calls)',
    available: null,
    used: null,
    limit: null,
    currency: 'USD',
    status: 'ok',
  });
}

// ── GET handler ──

export async function GET() {
  try {
    const [openrouter, moonshot, openai, anthropic, twilio, vapi] = await Promise.all([
      getOpenRouterBalance(),
      getMoonshotBalance(),
      getOpenAIBalance(),
      getAnthropicBalance(),
      getTwilioBalance(),
      getVapiBalance(),
    ]);

    const balances = [openrouter, moonshot, openai, anthropic, twilio, vapi];

    // Calculate total available in USD
    let totalAvailableUSD = 0;
    let hasKnownBalance = false;

    for (const b of balances) {
      if (b.available !== null) {
        hasKnownBalance = true;
        totalAvailableUSD += b.available;
      }
    }

    return NextResponse.json({
      balances,
      summary: {
        totalAvailableUSD: hasKnownBalance ? Math.round(totalAvailableUSD * 100) / 100 : null,
        lowBalanceProviders: balances.filter(b => b.status === 'low').map(b => b.label),
        errorProviders: balances.filter(b => b.status === 'error').map(b => b.label),
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}
