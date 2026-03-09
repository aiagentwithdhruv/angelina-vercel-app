/**
 * Model Router — Smart task-aware routing to optimal model
 *
 * Routes based on BOTH complexity AND task type:
 *   Coding      → Kimi K2.5 (Moonshot, SOTA coding)
 *   Research    → Perplexity Sonar (built-in web search)
 *   Content     → Claude Sonnet (excellent writing)
 *   Quick chat  → Groq Llama (fastest, free)
 *   Analysis    → GPT-4.1 (reasoning)
 *   Default     → Gemini Flash (fast + cheap)
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

const TASK_ROUTING: Record<TaskType, ModelChoice[]> = {
  coding: [
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },           // SOTA coding
    { model: 'claude-sonnet-4-5-20250929', envKey: 'ANTHROPIC_API_KEY' }, // Great at code
    { model: 'gpt-4.1', envKey: 'OPENAI_API_KEY' },               // Strong fallback
    { model: 'or:deepseek/deepseek-v3.2', envKey: 'OPENROUTER_API_KEY' },
  ],
  research: [
    { model: 'sonar-pro', envKey: 'PERPLEXITY_API_KEY' },         // Built-in web search
    { model: 'sonar', envKey: 'PERPLEXITY_API_KEY' },              // Lighter search
    { model: 'or:google/gemini-3-flash-preview', envKey: 'OPENROUTER_API_KEY' },
    { model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY' },
  ],
  content: [
    { model: 'claude-sonnet-4-5-20250929', envKey: 'ANTHROPIC_API_KEY' }, // Best at writing
    { model: 'gpt-4.1', envKey: 'OPENAI_API_KEY' },
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },
    { model: 'or:google/gemini-3-flash-preview', envKey: 'OPENROUTER_API_KEY' },
  ],
  analysis: [
    { model: 'gpt-4.1', envKey: 'OPENAI_API_KEY' },               // Strong reasoning
    { model: 'claude-sonnet-4-5-20250929', envKey: 'ANTHROPIC_API_KEY' },
    { model: 'kimi-k2.5', envKey: 'MOONSHOT_API_KEY' },
    { model: 'gemini-2.5-pro', envKey: 'GEMINI_API_KEY' },
  ],
  chat: [
    { model: 'groq:llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY' }, // Fastest, free
    { model: 'or:google/gemini-3-flash-preview', envKey: 'OPENROUTER_API_KEY' },
    { model: 'gpt-4.1-mini', envKey: 'OPENAI_API_KEY' },
    { model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY' },
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
