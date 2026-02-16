/**
 * Smart Model Upgrade — Detects when a task needs a better model.
 *
 * Returns an upgrade suggestion (model + reason) when the current
 * cheap model likely can't handle the request well.
 * The UI shows an approval prompt; Angelina only upgrades if user confirms.
 *
 * Cost-safe: detection is pure regex/heuristics (zero API calls).
 */

export interface UpgradeSuggestion {
  shouldUpgrade: boolean;
  suggestedModel: string;
  suggestedLabel: string;
  reason: string;
  estimatedExtraCost: string;
}

const CHEAP_MODELS = new Set([
  'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o-mini',
  'groq:mixtral-8x7b-32768', 'groq:gemma2-9b-it',
  'groq:llama-3.3-70b-versatile', 'groq:llama-4-scout-17b-16e-instruct',
  'or:google/gemini-3-flash-preview', 'or:google/gemini-2.5-flash',
  'gemini-2.5-flash', 'kimi-k2.5',
]);

// Patterns that suggest complex work needing a stronger model
const COMPLEX_PATTERNS: Array<{ pattern: RegExp; model: string; label: string; reason: string; cost: string }> = [
  // Deep analysis / research
  {
    pattern: /\b(analyze|analysis|compare|evaluate|assess|audit|review in detail|deep dive|comprehensive|thorough)\b.{0,60}\b(strategy|business|market|competitor|architecture|codebase|system|proposal|plan)\b/i,
    model: 'gpt-4.1',
    label: 'GPT-4.1',
    reason: 'Deep analysis benefits from a stronger reasoning model',
    cost: '~$0.003',
  },
  // Long-form writing
  {
    pattern: /\b(write|draft|create|compose)\b.{0,40}\b(proposal|report|document|article|whitepaper|pitch deck|business plan|case study|email campaign)\b/i,
    model: 'claude-sonnet-4-5-20250929',
    label: 'Claude Sonnet 4.5',
    reason: 'Long-form writing quality is much better with Sonnet',
    cost: '~$0.005',
  },
  // Code generation
  {
    pattern: /\b(build|code|implement|develop|create|write)\b.{0,40}\b(app|api|function|component|script|workflow|integration|backend|frontend|database|migration)\b/i,
    model: 'gpt-4.1',
    label: 'GPT-4.1',
    reason: 'Code generation is significantly better with GPT-4.1',
    cost: '~$0.003',
  },
  // Reasoning / math / logic
  {
    pattern: /\b(reason|think through|figure out|calculate|solve|debug|diagnose|why is|what went wrong|root cause)\b/i,
    model: 'or:deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    reason: 'Deep reasoning tasks perform much better with R1',
    cost: '~$0.002',
  },
  // Multi-step planning
  {
    pattern: /\b(plan|roadmap|strategy|step.by.step|action plan|project plan|sprint plan|break down|phase)\b.{0,40}\b(for|to|how|building|launching|shipping)\b/i,
    model: 'claude-sonnet-4-5-20250929',
    label: 'Claude Sonnet 4.5',
    reason: 'Multi-step planning is more reliable with Sonnet',
    cost: '~$0.005',
  },
];

export function detectUpgradeNeeded(
  userMessage: string,
  currentModel: string,
): UpgradeSuggestion {
  // Only suggest upgrades from cheap models
  if (!CHEAP_MODELS.has(currentModel)) {
    return { shouldUpgrade: false, suggestedModel: '', suggestedLabel: '', reason: '', estimatedExtraCost: '' };
  }

  for (const { pattern, model, label, reason, cost } of COMPLEX_PATTERNS) {
    if (pattern.test(userMessage)) {
      return {
        shouldUpgrade: true,
        suggestedModel: model,
        suggestedLabel: label,
        reason,
        estimatedExtraCost: cost,
      };
    }
  }

  return { shouldUpgrade: false, suggestedModel: '', suggestedLabel: '', reason: '', estimatedExtraCost: '' };
}
