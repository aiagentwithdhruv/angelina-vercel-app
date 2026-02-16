export type Provider = 'openai' | 'anthropic' | 'perplexity' | 'google' | 'openrouter' | 'moonshot' | 'groq';

export interface TextModel {
  id: string;
  label: string;
  description: string;
  provider: Provider;
  routerId?: string; // OpenRouter model ID (provider/model format)
}

export const TEXT_MODELS: TextModel[] = [
  // ── OpenAI (direct) ──
  { id: 'gpt-5.2', label: 'GPT-5.2', description: 'Latest flagship', provider: 'openai' },
  { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Best for coding', provider: 'openai' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Fast + capable', provider: 'openai' },
  { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', description: 'Ultra fast', provider: 'openai' },
  { id: 'gpt-4o', label: 'GPT-4o', description: 'Multimodal', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast + cheap', provider: 'openai' },
  { id: 'o3-mini', label: 'o3-mini', description: 'Reasoning model', provider: 'openai' },

  // ── Anthropic Claude (direct) ──
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Most intelligent', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', description: 'Speed + intelligence', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', description: 'Fastest Claude', provider: 'anthropic' },

  // ── Perplexity (direct) ──
  { id: 'sonar', label: 'Sonar', description: 'Web search', provider: 'perplexity' },
  { id: 'sonar-pro', label: 'Sonar Pro', description: 'Deep search', provider: 'perplexity' },
  { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro', description: 'Search + reasoning', provider: 'perplexity' },

  // ── Google Gemini (direct) ──
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Advanced reasoning', provider: 'google' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fast + capable', provider: 'google' },

  // ── Moonshot / Kimi (direct) ──
  { id: 'kimi-k2.5', label: 'Kimi K2.5', description: 'Visual coding SOTA', provider: 'moonshot' },

  // ── Groq (direct) ──
  { id: 'groq:llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B', description: 'Low-cost fast inference', provider: 'groq' },
  { id: 'groq:mixtral-8x7b-32768', label: 'Groq Mixtral 8x7B', description: 'Budget model for simple tasks', provider: 'groq' },

  // ── OpenRouter (via OpenRouter API) ──
  { id: 'or:deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', description: 'GPT-5 class, cheap', provider: 'openrouter', routerId: 'deepseek/deepseek-v3.2' },
  { id: 'or:deepseek/deepseek-r1', label: 'DeepSeek R1', description: 'Deep reasoning', provider: 'openrouter', routerId: 'deepseek/deepseek-r1' },
  { id: 'or:moonshotai/kimi-k2.5', label: 'Kimi K2.5', description: 'Visual coding SOTA', provider: 'openrouter', routerId: 'moonshotai/kimi-k2.5' },
  { id: 'or:moonshotai/kimi-k2-thinking', label: 'Kimi K2 Thinking', description: '1T params, reasoning', provider: 'openrouter', routerId: 'moonshotai/kimi-k2-thinking' },
  { id: 'or:x-ai/grok-4-fast', label: 'Grok 4 Fast', description: 'xAI flagship', provider: 'openrouter', routerId: 'x-ai/grok-4-fast' },
  { id: 'or:meta-llama/llama-4-scout', label: 'Llama 4 Scout', description: 'Meta open model', provider: 'openrouter', routerId: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  { id: 'or:qwen/qwen3-coder-480b', label: 'Qwen3 Coder 480B', description: 'Coding specialist', provider: 'openrouter', routerId: 'qwen/qwen3-coder-480b-a35b-07-25' },
  { id: 'or:google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', description: 'Latest Gemini, fast', provider: 'openrouter', routerId: 'google/gemini-3-flash-preview' },
  { id: 'or:google/gemini-3-pro-preview', label: 'Gemini 3 Pro Preview', description: 'Latest Gemini, powerful', provider: 'openrouter', routerId: 'google/gemini-3-pro-preview' },
  { id: 'or:google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (OR)', description: 'Via OpenRouter', provider: 'openrouter', routerId: 'google/gemini-2.5-pro' },
  { id: 'or:openai/gpt-4.1-mini', label: 'GPT-4.1 Mini (OR)', description: 'Via OpenRouter', provider: 'openrouter', routerId: 'openai/gpt-4.1-mini-2025-04-14' },
];

export const VOICE_MODELS = [
  { id: 'gpt-4o-realtime-preview-2024-12-17', label: 'GPT-4o Realtime', description: 'Full quality' },
  { id: 'gpt-4o-mini-realtime-preview-2024-12-17', label: 'GPT-4o Mini Realtime', description: 'Faster + cheaper' },
] as const;

export type TextModelId = string;
export type VoiceModelId = typeof VOICE_MODELS[number]['id'];

export const DEFAULT_TEXT_MODEL = 'or:google/gemini-3-flash-preview';
export const DEFAULT_VOICE_MODEL: VoiceModelId = 'gpt-4o-mini-realtime-preview-2024-12-17';

export const ALLOWED_TEXT_MODELS: string[] = TEXT_MODELS.map(m => m.id);
export const ALLOWED_VOICE_MODELS: string[] = VOICE_MODELS.map(m => m.id);

export const PROVIDER_LABELS: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  perplexity: 'Perplexity',
  google: 'Google',
  openrouter: 'OpenRouter',
  moonshot: 'Moonshot',
  groq: 'Groq',
};

export function getProviderForModel(modelId: string): Provider {
  const model = TEXT_MODELS.find(m => m.id === modelId);
  return model?.provider || 'openai';
}
