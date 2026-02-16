export interface ModelPricing {
  inputPer1M: number;   // USD per 1M input tokens
  outputPer1M: number;  // USD per 1M output tokens
}

// Pricing map keyed by model ID substring (longest-match-first in getPricing)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-5.2':        { inputPer1M: 5.00,  outputPer1M: 20.00 },
  'gpt-4.1-nano':   { inputPer1M: 0.10,  outputPer1M: 0.40 },
  'gpt-4.1-mini':   { inputPer1M: 0.40,  outputPer1M: 1.60 },
  'gpt-4.1':        { inputPer1M: 2.00,  outputPer1M: 8.00 },
  'gpt-4o-mini':    { inputPer1M: 0.15,  outputPer1M: 0.60 },
  'gpt-4o':         { inputPer1M: 2.50,  outputPer1M: 10.00 },
  'o3-mini':        { inputPer1M: 1.10,  outputPer1M: 4.40 },

  // Anthropic Claude
  'claude-opus-4':   { inputPer1M: 15.00, outputPer1M: 75.00 },
  'claude-sonnet-4': { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-haiku-4':  { inputPer1M: 0.80,  outputPer1M: 4.00 },

  // Google Gemini
  'gemini-3-pro':     { inputPer1M: 1.50,  outputPer1M: 10.00 },
  'gemini-3-flash':   { inputPer1M: 0.15,  outputPer1M: 0.60 },
  'gemini-2.5-pro':   { inputPer1M: 1.25,  outputPer1M: 10.00 },
  'gemini-2.5-flash': { inputPer1M: 0.15,  outputPer1M: 0.60 },

  // Perplexity
  'sonar-reasoning-pro': { inputPer1M: 2.00,  outputPer1M: 8.00 },
  'sonar-pro':           { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'sonar':               { inputPer1M: 1.00,  outputPer1M: 1.00 },

  // Groq
  'llama-3.3-70b':       { inputPer1M: 0.59,  outputPer1M: 0.79 },
  'mixtral-8x7b':        { inputPer1M: 0.24,  outputPer1M: 0.24 },

  // OpenRouter models (matched via routerId substrings)
  'deepseek-v3':   { inputPer1M: 0.27,  outputPer1M: 1.10 },
  'deepseek-r1':   { inputPer1M: 0.55,  outputPer1M: 2.19 },
  'kimi-k2':       { inputPer1M: 0.60,  outputPer1M: 2.40 },
  'grok-4':        { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'llama-4':       { inputPer1M: 0.15,  outputPer1M: 0.60 },
  'qwen3-coder':   { inputPer1M: 0.50,  outputPer1M: 2.00 },
};

const DEFAULT_PRICING: ModelPricing = { inputPer1M: 1.00, outputPer1M: 4.00 };

// Realtime API audio pricing (per 1M audio tokens)
export interface RealtimePricing {
  audioInputPer1M: number;
  audioOutputPer1M: number;
  textInputPer1M: number;
  textOutputPer1M: number;
}

const REALTIME_PRICING: Record<string, RealtimePricing> = {
  'gpt-4o-realtime': {
    audioInputPer1M: 100.00,
    audioOutputPer1M: 200.00,
    textInputPer1M: 5.00,
    textOutputPer1M: 20.00,
  },
  'gpt-4o-mini-realtime': {
    audioInputPer1M: 10.00,
    audioOutputPer1M: 20.00,
    textInputPer1M: 0.60,
    textOutputPer1M: 2.40,
  },
};

// Sort keys once by length descending for longest-match-first
const SORTED_KEYS = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);

export function getPricing(modelId: string): ModelPricing {
  for (const key of SORTED_KEYS) {
    if (modelId.includes(key)) {
      return MODEL_PRICING[key];
    }
  }
  return DEFAULT_PRICING;
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getPricing(modelId);
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function calculateRealtimeCost(
  modelId: string,
  audioInputTokens: number,
  audioOutputTokens: number,
  textInputTokens: number,
  textOutputTokens: number
): number {
  // Find matching realtime pricing
  let pricing: RealtimePricing | undefined;
  for (const key of Object.keys(REALTIME_PRICING)) {
    if (modelId.includes(key)) {
      pricing = REALTIME_PRICING[key];
      break;
    }
  }
  if (!pricing) pricing = REALTIME_PRICING['gpt-4o-realtime'];

  const audioCost =
    (audioInputTokens / 1_000_000) * pricing.audioInputPer1M +
    (audioOutputTokens / 1_000_000) * pricing.audioOutputPer1M;
  const textCost =
    (textInputTokens / 1_000_000) * pricing.textInputPer1M +
    (textOutputTokens / 1_000_000) * pricing.textOutputPer1M;
  return Math.round((audioCost + textCost) * 1_000_000) / 1_000_000;
}
