'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Key, 
  Mail, 
  Github, 
  CheckSquare, 
  Search, 
  Brain, 
  Sparkles,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  RefreshCw,
  Calendar,
  HardDrive,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Workflow,
  Server,
  Zap
} from 'lucide-react';

interface APIKeyConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  category: 'ai' | 'integration' | 'search' | 'automation';
}

const apiConfigs: APIKeyConfig[] = [
  // AI Models - Updated with latest
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, o1, Realtime Voice, Whisper, DALL-E',
    icon: <Sparkles className="w-5 h-5" />,
    placeholder: 'sk-...',
    category: 'ai'
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Claude 4, 3.5 Sonnet, Haiku, Opus',
    icon: <Brain className="w-5 h-5" />,
    placeholder: 'sk-ant-...',
    category: 'ai'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ models: Llama, Mistral, Gemini, Claude',
    icon: <RefreshCw className="w-5 h-5" />,
    placeholder: 'sk-or-...',
    category: 'ai'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.0 Flash, Pro, Ultra',
    icon: <Sparkles className="w-5 h-5" />,
    placeholder: 'AI...',
    category: 'ai'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference: Llama, Mixtral',
    icon: <Zap className="w-5 h-5" />,
    placeholder: 'gsk_...',
    category: 'ai'
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    description: 'Kimi K2.5, K2 Thinking, V1 128K',
    icon: <Sparkles className="w-5 h-5" />,
    placeholder: 'sk-...',
    category: 'ai'
  },
  // Calling
  {
    id: 'twilio_sid',
    name: 'Twilio Account SID',
    description: 'For "Call Me" feature (Twilio)',
    icon: <Zap className="w-5 h-5" />,
    placeholder: 'AC...',
    category: 'automation'
  },
  {
    id: 'twilio_token',
    name: 'Twilio Auth Token',
    description: 'Twilio auth token',
    icon: <Zap className="w-5 h-5" />,
    placeholder: 'your auth token',
    category: 'automation'
  },
  {
    id: 'twilio_phone',
    name: 'Twilio Phone Number',
    description: 'Your Twilio phone number',
    icon: <Zap className="w-5 h-5" />,
    placeholder: '+1...',
    category: 'automation'
  },
  {
    id: 'dhruv_phone',
    name: 'Your Phone Number',
    description: 'Where Angelina calls you',
    icon: <Zap className="w-5 h-5" />,
    placeholder: '+91...',
    category: 'automation'
  },
  // Telegram
  {
    id: 'telegram_bot_token',
    name: 'Telegram Bot Token',
    description: 'For proactive digest & notifications',
    icon: <Zap className="w-5 h-5" />,
    placeholder: '123456:ABC...',
    category: 'automation'
  },
  {
    id: 'telegram_chat_id',
    name: 'Telegram Chat ID',
    description: 'Your Telegram chat ID for push messages',
    icon: <Zap className="w-5 h-5" />,
    placeholder: '637313836',
    category: 'automation'
  },
  // Search
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Real-time web search with AI',
    icon: <Search className="w-5 h-5" />,
    placeholder: 'pplx-...',
    category: 'search'
  },
  // Automation
  {
    id: 'n8n',
    name: 'n8n Instance URL',
    description: 'Your n8n URL (cloud or self-hosted)',
    icon: <Workflow className="w-5 h-5" />,
    placeholder: 'https://your-n8n.app.n8n.cloud',
    category: 'automation'
  },
  {
    id: 'n8n_api_key',
    name: 'n8n API Key (optional)',
    description: 'For authenticated n8n instances',
    icon: <Workflow className="w-5 h-5" />,
    placeholder: 'n8n API key (leave blank if not needed)',
    category: 'automation'
  },
  {
    id: 'mcp',
    name: 'MCP Server URL',
    description: 'Model Context Protocol — discover & call external tools',
    icon: <Server className="w-5 h-5" />,
    placeholder: 'https://your-mcp-server.com or http://localhost:3001',
    category: 'automation'
  },
  // Integrations
  {
    id: 'github',
    name: 'GitHub',
    description: 'Memory storage, code access, repos',
    icon: <Github className="w-5 h-5" />,
    placeholder: 'ghp_...',
    category: 'integration'
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'Task management, projects, goals',
    icon: <CheckSquare className="w-5 h-5" />,
    placeholder: 'pk_...',
    category: 'integration'
  },
];

// Google services (all connected via single OAuth)
const googleServices = [
  { id: 'gmail', name: 'Gmail', description: 'Read, send, manage emails', icon: <Mail className="w-5 h-5" /> },
  { id: 'calendar', name: 'Calendar', description: 'Events, schedules, reminders', icon: <Calendar className="w-5 h-5" /> },
  { id: 'drive', name: 'Drive', description: 'Files, folders, storage', icon: <HardDrive className="w-5 h-5" /> },
  { id: 'sheets', name: 'Sheets', description: 'Spreadsheets, data', icon: <FileSpreadsheet className="w-5 h-5" /> },
  { id: 'docs', name: 'Docs', description: 'Documents, writing', icon: <FileText className="w-5 h-5" /> },
  { id: 'youtube', name: 'YouTube', description: 'Channel analytics, video stats', icon: <ExternalLink className="w-5 h-5" /> },
];

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'connected' | 'error' | null>>({});
  const [googleConnected, setGoogleConnected] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [costData, setCostData] = useState<{ costToday: number; costThisWeek: number; costThisMonth: number } | null>(null);

  // Check connection status and fetch cost data on mount
  useEffect(() => {
    checkAllConnections();
    fetchCostData();

    // Check URL params for success/error messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'google_connected') {
      setGoogleConnected(true);
      setSuccessMessage('Google Workspace connected successfully! 🎉');
      window.history.replaceState({}, '', '/settings');
    }
    if (params.get('error')) {
      setSuccessMessage(`Error: ${params.get('error')}. Please try again.`);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const fetchCostData = async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const stats = await res.json();
        setCostData({
          costToday: stats.costToday,
          costThisWeek: stats.costThisWeek,
          costThisMonth: stats.costThisMonth,
        });
      }
    } catch (err) {
      console.error('Failed to fetch cost data:', err);
    }
  };

  const checkAllConnections = async () => {
    try {
      const response = await fetch('/api/settings/status');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status || {});
        const isGoogleConnected = data.status?.google === 'connected';
        setGoogleConnected(isGoogleConnected);

        // Auto-sync Google tokens to file for Telegram/server-side access
        if (isGoogleConnected) {
          fetch('/api/auth/google/sync', { method: 'POST' }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveKey = async (configId: string) => {
    const key = apiKeys[configId];
    if (!key) return;

    setSaving(configId);
    try {
      const response = await fetch('/api/settings/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: configId, value: key }),
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [configId]: 'connected' }));
        setApiKeys(prev => ({ ...prev, [configId]: '' }));
        setSuccessMessage(`${configId} saved successfully! ✓`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setConnectionStatus(prev => ({ ...prev, [configId]: 'error' }));
      }
    } catch (error) {
      console.error('Failed to save key:', error);
      setConnectionStatus(prev => ({ ...prev, [configId]: 'error' }));
    }
    setSaving(null);
  };

  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const renderCategory = (category: 'ai' | 'integration' | 'search' | 'automation', title: string, emoji: string) => {
    const categoryConfigs = apiConfigs.filter(c => c.category === category);
    
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">{emoji} {title}</h2>
        <div className="grid gap-4">
          {categoryConfigs.map(config => (
            <Card key={config.id} className="full-glow-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1a1a24] flex items-center justify-center text-cyan-400">
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{config.name}</h3>
                    <p className="text-sm text-gray-400">{config.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {connectionStatus[config.id] === 'connected' && (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <Check className="w-4 h-4" /> Connected
                    </span>
                  )}
                  {connectionStatus[config.id] === 'error' && (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" /> Error
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys[config.id] ? 'text' : 'password'}
                    value={apiKeys[config.id] || ''}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [config.id]: e.target.value }))}
                    placeholder={connectionStatus[config.id] === 'connected' ? '••••••••••••••••' : config.placeholder}
                    className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={() => toggleShowKey(config.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKeys[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  onClick={() => handleSaveKey(config.id)}
                  disabled={!apiKeys[config.id] || saving === config.id}
                  className="hover-glow-border"
                >
                  {saving === config.id ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Desktop Layout */}
      <div className="hidden md:block">
      <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your API keys, integrations & automation</p>
          </div>

          {successMessage && (
            <div className={`mb-6 p-4 rounded-lg ${successMessage.includes('Error') ? 'bg-red-900/30 border border-red-500/50' : 'bg-green-900/30 border border-green-500/50'}`}>
              <p className={successMessage.includes('Error') ? 'text-red-300' : 'text-green-300'}>{successMessage}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Google Workspace</h2>
            <Card className="full-glow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">Connect Google Account</h3>
                  <p className="text-sm text-gray-400">One click to access Gmail, Calendar, Drive, Sheets & Docs</p>
                </div>
                {googleConnected ? (
                  <button onClick={handleGoogleConnect} className="flex items-center gap-2 text-green-400 hover:text-cyan-400 transition-colors cursor-pointer"><Check className="w-5 h-5" /> Reconnect</button>
                ) : (
                  <Button onClick={handleGoogleConnect} className="hover-glow-border flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Connect Google</Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {googleServices.map(service => (
                  <div key={service.id} className={`p-4 rounded-lg border ${googleConnected ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-[#2a2a32] bg-[#1a1a24]'} text-center`}>
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${googleConnected ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400 bg-[#2a2a32]'}`}>{service.icon}</div>
                    <h4 className={`font-medium ${googleConnected ? 'text-white' : 'text-gray-400'}`}>{service.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                    {googleConnected && <span className="inline-block mt-2 text-xs text-green-400">Ready</span>}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {renderCategory('ai', 'AI Models', '🤖')}
          {renderCategory('automation', 'Automation & Tools', '⚡')}
          {renderCategory('search', 'Search & Research', '🔍')}
          {renderCategory('integration', 'Other Integrations', '🔗')}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Memory Settings</h2>
            <Card className="full-glow-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-white">GitHub Memory Sync</h3>
                  <p className="text-sm text-gray-400">Sync long-term memory to your GitHub repo</p>
                </div>
                {connectionStatus['github'] === 'connected' && (
                  <span className="text-green-400 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Active</span>
                )}
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Memory Repository</label>
                  <input type="text" defaultValue="aiagentwithdhruv/Angelina" className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Memory Path</label>
                  <input type="text" defaultValue="memory/" className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a32] rounded-lg text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Cost Tracking</h2>
            <Card className="full-glow-card p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">${costData?.costToday?.toFixed(4) ?? '0.0000'}</div>
                  <div className="text-sm text-gray-400">Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">${costData?.costThisWeek?.toFixed(4) ?? '0.0000'}</div>
                  <div className="text-sm text-gray-400">This Week</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">${costData?.costThisMonth?.toFixed(4) ?? '0.0000'}</div>
                  <div className="text-sm text-gray-400">This Month</div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileLayout title="Settings">
          <main className="pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            {successMessage && (
              <div className={`mx-3 mt-2 p-3 rounded-lg text-sm ${successMessage.includes('Error') ? 'bg-red-900/30 border border-red-500/50 text-red-300' : 'bg-green-900/30 border border-green-500/50 text-green-300'}`}>
                {successMessage}
              </div>
            )}
            <div className="mx-3 mt-3 mb-4 bg-gunmetal border border-steel-dark rounded-xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-glow to-cyan-teal flex items-center justify-center text-deep-space font-bold text-xl">D</div>
              <div className="flex-1">
                <div className="text-base font-semibold text-text-primary">Dhruv</div>
                <div className="text-xs text-text-muted">Agentic AI Hub</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" style={{ boxShadow: '0 0 8px rgba(0, 232, 140, 0.6)' }} />
                <span className="text-[10px] text-text-muted">Online</span>
              </div>
            </div>
            <div className="mb-4">
              <div className="px-4 mb-1.5"><span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Account</span></div>
              <div className="mx-3 bg-gunmetal border border-steel-dark rounded-xl overflow-hidden">
                <button onClick={handleGoogleConnect} className="w-full h-14 flex items-center justify-between px-4 border-b border-steel-dark/50 active:bg-steel-dark transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center"><ExternalLink className="w-4 h-4 text-text-secondary" /></div>
                    <span className="text-sm text-text-primary">Google Workspace</span>
                  </div>
                  {googleConnected ? <span className="text-xs text-success">Connected</span> : <span className="text-xs text-cyan-glow">Connect</span>}
                </button>
                <div className="h-14 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center"><Key className="w-4 h-4 text-text-secondary" /></div>
                    <span className="text-sm text-text-primary">Cost Today</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-glow">${costData?.costToday?.toFixed(4) ?? '0.0000'}</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="px-4 mb-1.5"><span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">AI Models</span></div>
              <div className="mx-3 bg-gunmetal border border-steel-dark rounded-xl overflow-hidden">
                {apiConfigs.filter(c => c.category === 'ai').map((config, i, arr) => (
                  <div key={config.id} className={`px-4 py-3 ${i < arr.length - 1 ? 'border-b border-steel-dark/50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center text-cyan-glow">{config.icon}</div>
                        <div>
                          <span className="text-sm text-text-primary">{config.name}</span>
                          <p className="text-[10px] text-text-muted">{config.description}</p>
                        </div>
                      </div>
                      {connectionStatus[config.id] === 'connected' && <span className="text-[10px] text-success flex items-center gap-0.5"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input type={showKeys[config.id] ? 'text' : 'password'} value={apiKeys[config.id] || ''} onChange={(e) => setApiKeys(prev => ({ ...prev, [config.id]: e.target.value }))} placeholder={connectionStatus[config.id] === 'connected' ? '••••••••' : config.placeholder} className="w-full h-9 px-3 bg-charcoal border border-steel-dark rounded-lg text-sm text-white placeholder-text-muted focus:border-cyan-glow/50 focus:outline-none" />
                        <button onClick={() => toggleShowKey(config.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted">
                          {showKeys[config.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button onClick={() => handleSaveKey(config.id)} disabled={!apiKeys[config.id] || saving === config.id} className="h-9 px-3 bg-cyan-glow/10 text-cyan-glow text-xs rounded-lg border border-cyan-glow/20 disabled:opacity-30 active:bg-cyan-glow/20 transition-all">
                        {saving === config.id ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="px-4 mb-1.5"><span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">App</span></div>
              <div className="mx-3 bg-gunmetal border border-steel-dark rounded-xl overflow-hidden">
                <div className="h-14 flex items-center justify-between px-4 border-b border-steel-dark/50">
                  <span className="text-sm text-text-primary">Memory Sync</span>
                  {connectionStatus['github'] === 'connected' ? <span className="text-xs text-success">Active</span> : <span className="text-xs text-text-muted">Not configured</span>}
                </div>
                <div className="h-14 flex items-center justify-between px-4 border-b border-steel-dark/50">
                  <span className="text-sm text-text-primary">Version</span>
                  <span className="text-xs text-text-muted">1.0.0</span>
                </div>
                <div className="h-14 flex items-center justify-between px-4">
                  <span className="text-sm text-text-primary">Cost This Month</span>
                  <span className="text-sm font-semibold text-cyan-glow">${costData?.costThisMonth?.toFixed(4) ?? '0.0000'}</span>
                </div>
              </div>
            </div>
            <div className="h-4" />
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
