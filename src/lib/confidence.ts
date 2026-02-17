/**
 * Confidence Scoring — Heuristic confidence rating before tool execution.
 *
 * Angelina rates her confidence and adjusts behavior:
 * - High (>0.8): Act immediately, no hesitation
 * - Medium (0.5-0.8): Act but mention uncertainty
 * - Low (<0.5): Ask user before proceeding
 *
 * Zero API cost — pure regex/heuristic scoring.
 */

export interface ConfidenceScore {
  score: number;
  level: 'high' | 'medium' | 'low';
  reason: string;
  hint: string; // Injected into system prompt
}

// Tools that have predictable behavior (high base confidence)
const RELIABLE_TOOLS: Record<string, number> = {
  check_email: 0.9,
  check_calendar: 0.9,
  manage_task: 0.85,
  save_memory: 0.9,
  recall_memory: 0.85,
  web_search: 0.8,
  wikipedia: 0.9,
  hacker_news: 0.9,
  youtube_analytics: 0.85,
};

// Tools that need more caution
const SENSITIVE_TOOLS: Record<string, number> = {
  send_email: 0.5,
  call_dhruv: 0.4,
  github: 0.6,
  n8n_workflow: 0.5,
  mcp_call: 0.4,
};

// Patterns that increase confidence (clear, specific requests)
const CLEAR_PATTERNS = [
  /\b(check|show|list|get|read|how many)\b/i,           // Read-only queries
  /\b(what|when|where|who)\b.{0,20}\b(my|the|our)\b/i, // Specific questions
  /\b(create|add|make)\b.{0,20}\b(task|todo|note)\b/i,  // Simple creation
];

// Patterns that decrease confidence (vague, risky, multi-step)
const VAGUE_PATTERNS = [
  /\b(everything|all of|do it all|handle it|figure it out|whatever)\b/i,
  /\b(maybe|probably|not sure|I think|might)\b/i,
  /\b(delete|remove|cancel|undo|revert)\b/i,
  /\b(send to everyone|blast|mass|bulk)\b/i,
];

export function scoreConfidence(
  userMessage: string,
  toolName?: string,
  hasApiKey?: boolean,
): ConfidenceScore {
  let score = 0.7; // Base confidence
  const reasons: string[] = [];

  // Tool-based scoring
  if (toolName) {
    if (RELIABLE_TOOLS[toolName] !== undefined) {
      score = RELIABLE_TOOLS[toolName];
      reasons.push(`${toolName} is reliable`);
    } else if (SENSITIVE_TOOLS[toolName] !== undefined) {
      score = SENSITIVE_TOOLS[toolName];
      reasons.push(`${toolName} needs caution`);
    }
  }

  // API key availability
  if (hasApiKey === false) {
    score *= 0.3;
    reasons.push('API key missing');
  }

  // Message clarity adjustments
  if (CLEAR_PATTERNS.some((p) => p.test(userMessage))) {
    score = Math.min(1.0, score + 0.1);
    reasons.push('clear request');
  }
  if (VAGUE_PATTERNS.some((p) => p.test(userMessage))) {
    score = Math.max(0.1, score - 0.2);
    reasons.push('vague/risky request');
  }

  // Short messages are less clear
  if (userMessage.trim().length < 10) {
    score = Math.max(0.3, score - 0.1);
    reasons.push('very short message');
  }

  // Clamp
  score = Math.max(0, Math.min(1, score));

  const level: 'high' | 'medium' | 'low' =
    score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low';

  const hint =
    level === 'high'
      ? 'You are confident about this request. Act decisively.'
      : level === 'medium'
        ? 'You are moderately confident. Proceed but briefly mention if you are making assumptions.'
        : 'You have low confidence about this request. Ask Dhruv to clarify before taking action. Do NOT guess.';

  return {
    score,
    level,
    reason: reasons.join(', '),
    hint,
  };
}

/**
 * Build a one-line confidence context for system prompt injection.
 */
export function buildConfidenceContext(userMessage: string): string {
  const { level, hint } = scoreConfidence(userMessage);
  return `\nConfidence: ${level}. ${hint}`;
}
