/**
 * Model Router — Quality-first task-aware routing ($5-10/day budget)
 *
 * Real-time tested (Mar 9 2026) — all scored 5/5 on complex coding task:
 *   Coding      → Kimi K2.5 (SOTA) → Qwen3 Coder 480B ($0.22, tested 22s)
 *   Research    → Sonar (built-in web search, $1)
 *   Content     → Kimi K2.5 → Llama 4 Maverick ($0.15, tested 1.8s!)
 *   Chat        → Grok 4.1 Fast (#1 tool calling for MCP/agent)
 *   Analysis    → Grok 4.1 Fast → Qwen3 235B ($0.07, tested 19s)
 *   Simple      → Groq Llama (free, instant)
 *
 * Only applies when user hasn't manually selected a model.
 * Provider availability checked at runtime via env vars.
 */

import { DEFAULT_TEXT_MODEL } from './models';

export type Complexity = 'simple' | 'moderate' | 'complex';
export type TaskType = 'coding' | 'research' | 'content' | 'analysis' | 'chat';

// ── Task Type Detection ─────────────────────────────────────────────────────

const CODING_PATTERNS = [
  /```/,
  /\b(function|class|import|export|const|let|var|def |async |await |return )\b/,
  /\b(code|debug|refactor|implement|deploy|build|api|endpoint|route|bug|fix|error|stack trace)\b/i,
  /\b(python|javascript|typescript|react|nextjs|fastapi|docker|git|npm|pip)\b/i,
  /\b(write me a|build a|create a|develop a)\b.{0,10}\b(app|script|function|component|api|bot|tool|service)\b/i,
];

const RESEARCH_PATTERNS = [
  /\b(search|find|look up|what is|who is|latest|news|trending|current)\b/i,
  /\b(research|investigate|compare|alternatives|competitors|market|industry)\b/i,
  /\b(tell me about|how does|what are the|explain the difference)\b/i,
];

const CONTENT_PATTERNS = [
  /\b(write|draft|compose|create)\b.{0,15}\b(post|article|email|blog|tweet|thread|caption|copy|description|bio|pitch|proposal)\b/i,
  /\b(linkedin|twitter|instagram|youtube|social media|content|headline|title|hook)\b/i,
  /\b(thumbnail|diagram|infographic|presentation|slides|visual)\b/i,
];

const ANALYSIS_PATTERNS = [
  /\b(analyze|evaluate|assess|review|audit|break down|deep dive)\b/i,
  /\b(strategy|plan|roadmap|pros? and cons?|trade.?offs?|advantages|disadvantages)\b/i,
  /\b(step.by.step|multi.?step|detailed|comprehensive|thorough)\b/i,
  /\b(architecture|design pattern|system design|database schema)\b/i,
];

function detectTaskType(message: string): TaskType {
  const trimmed = message.trim();

  // Coding gets highest priority — very distinct patterns
  if (CODING_PATTERNS.some(p => p.test(trimmed))) return 'coding';

  // Content creation
  if (CONTENT_PATTERNS.some(p => p.test(trimmed))) return 'content';

  // Research / web search
  if (RESEARCH_PATTERNS.some(p => p.test(trimmed))) return 'research';

  // Deep analysis
  if (ANALYSIS_PATTERNS.some(p => p.test(trimmed))) return 'analysis';

  return 'chat';
}

// ── Complexity Detection ────────────────────────────────────────────────────

const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|yes|no|ok|okay|sure|good|great|bye|cool|nice|yep|nope|got it|alright)\b/i,
  /^(what time|what day|what date)/i,
  /^(gm|gn|good morning|good night|good evening)\b/i,
];

export function classifyComplexity(message: string): Complexity {
  const trimmed = message.trim();

  if (trimmed.length < 30 && SIMPLE_PATTERNS.some(p => p.test(trimmed))) return 'simple';
  if (trimmed.length < 15) return 'simple';
  if (trimmed.length > 500) return 'complex';
  if (CODING_PATTERNS.some(p => p.test(trimmed))) return 'complex';
  if (ANALYSIS_PATTERNS.some(p => p.test(trimmed))) return 'complex';

  return 'moderate';
}

// ── Best Model Per Task Type ────────────────────────────────────────────────
// Each entry has a primary (best) and fallback (if primary provider missing).
// Checked at runtime so only available providers are used.

interface ModelChoice {
  model: string;
  envKey: string;  // Required env var for this provider
}

// QUALITY-FIRST routing ($5-10/day budget) — real-time tested Mar 9 2026
// Best model per task type, with cheaper fallbacks if provider missing.
// Claude Opus ($15/$75) and Sonar Pro ($3/$15) = MANUAL ONLY (too expensive for auto)
const TASK_ROUTING: Record<TaskType, ModelChoice[]> = {
  coding: [
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },           // $0.60/$2.40 — SOTA coding
    { model: 'or:qwen/qwen3-coder', envKey: 'OPENROUTER_API_KEY' },     // $0.22/$1.00 — 480B coder, tested 5/5 22s
    { model: 'or:x-ai/grok-code-fast-1', envKey: 'OPENROUTER_API_KEY' },// $0.20/$1.50 — xAI coding model, tested 5/5 17s
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },          // $0.40/$1.60
  ],
  research: [
    { model: 'sonar', envKey: 'PERPLEXITY_API_KEY' },             // $1/$1 — built-in web search
    { model: 'or:x-ai/grok-4.1-fast', envKey: 'OPENROUTER_API_KEY' },   // $0.20/$0.50 — #1 tool calling
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },          // $0.40/$1.60
    { model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY' },      // $0.15/$0.60
  ],
  content: [
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },           // $0.60/$2.40 — great writer
    { model: 'or:meta-llama/llama-4-maverick', envKey: 'OPENROUTER_API_KEY' }, // $0.15/$0.60 — tested 5/5, 1.8s!
    { model: 'or:x-ai/grok-4.1-fast', envKey: 'OPENROUTER_API_KEY' },   // $0.20/$0.50
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },          // $0.40/$1.60
  ],
  analysis: [
    { model: 'or:x-ai/grok-4.1-fast', envKey: 'OPENROUTER_API_KEY' },   // $0.20/$0.50 — #1 legal, #2 finance, thorough
    { model: 'or:qwen/qwen3-235b-a22b-2507', envKey: 'OPENROUTER_API_KEY' }, // $0.07/$0.10 — 235B params, tested 5/5 19s
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },           // $0.60/$2.40
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },          // $0.40/$1.60
  ],
  chat: [
    { model: 'or:x-ai/grok-4.1-fast', envKey: 'OPENROUTER_API_KEY' },   // $0.20/$0.50 — #1 tool calling (MCP/agent)
    { model: 'or:meta-llama/llama-4-maverick', envKey: 'OPENROUTER_API_KEY' }, // $0.15/$0.60 — blazing 1.8s, 1M ctx
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },          // $0.40/$1.60
    { model: 'groq:llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY' },   // Free fallback
  ],
};

// Simple tier always uses cheapest available
const SIMPLE_MODELS: ModelChoice[] = [
  { model: 'groq:llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY' },
  { model: 'groq:gemma2-9b-it', envKey: 'GROQ_API_KEY' },
  { model: 'gpt-4.1-nano', envKey: 'OPENAI_API_KEY' },
  { model: 'or:google/gemini-3-flash-preview', envKey: 'OPENROUTER_API_KEY' },
];

/**
 * Pick the first model whose provider env key is available.
 */
function pickAvailable(choices: ModelChoice[]): string | null {
  for (const choice of choices) {
    if (process.env[choice.envKey]) return choice.model;
  }
  return null;
}

/**
 * Get the optimal model for a message based on task type + complexity.
 * Only routes if user is using the default model.
 */
export function getRoutedModel(
  userSelectedModel: string,
  message: string,
): { model: string; complexity: Complexity; routed: boolean; taskType?: TaskType } {
  const complexity = classifyComplexity(message);

  // User explicitly selected a non-default model → respect it
  if (userSelectedModel !== DEFAULT_TEXT_MODEL) {
    return { model: userSelectedModel, complexity, routed: false };
  }

  // Simple messages → cheapest model
  if (complexity === 'simple') {
    const model = pickAvailable(SIMPLE_MODELS) || userSelectedModel;
    return { model, complexity, routed: model !== userSelectedModel };
  }

  // Task-type routing for moderate + complex
  const taskType = detectTaskType(message);
  const candidates = TASK_ROUTING[taskType];
  const model = pickAvailable(candidates) || userSelectedModel;

  const routed = model !== userSelectedModel;
  if (routed) {
    console.log(`[Model Router] ${taskType}/${complexity} → ${model}`);
  }

  return { model, complexity, routed, taskType };
}
