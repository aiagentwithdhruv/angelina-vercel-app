/**
 * Model Router — Classifies message complexity and routes to optimal model
 *
 * Simple queries → cheap model (saves 60-80% on costs)
 * Complex queries → powerful model (ensures quality)
 * Only applies when user hasn't manually selected a model (i.e., using default)
 */

import { DEFAULT_TEXT_MODEL } from './models';

export type Complexity = 'simple' | 'moderate' | 'complex';

// Models for each tier (cheapest → most capable)
const TIER_MODELS = {
  simple: 'or:google/gemini-3-flash-preview',   // ~$0.10/1M — greetings, yes/no, short answers
  moderate: 'gpt-4.1-mini',                      // ~$0.40/1M — normal questions, summaries
  complex: 'kimi-k2.5',                            // Direct Moonshot API — code, analysis, multi-step
} as const;

// Simple message patterns
const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|yes|no|ok|okay|sure|good|great|bye|cool|nice|yep|nope|got it|alright)\b/i,
  /^(what time|what day|what date)/i,
  /^(gm|gn|good morning|good night|good evening)\b/i,
];

// Complex message patterns
const COMPLEX_PATTERNS = [
  /```/,                                          // Code blocks
  /\b(function|class|import|export|const|let|var|def|async|await)\s/,  // Code keywords
  /\b(analyze|compare|evaluate|research|strategy|proposal|implement|architect|design|refactor|debug|optimize)\b/i,
  /\b(write me|build|create|develop|code)\s.{20,}/i,  // Long creation requests
  /\b(explain|how does|why does|what happens when)\b.{50,}/i,  // Deep explanations
  /\b(step.by.step|multi.?step|detailed|comprehensive|thorough)\b/i,
  /\b(pros? and cons?|trade.?offs?|advantages|disadvantages)\b/i,
];

/**
 * Classify message complexity based on content and length
 */
export function classifyComplexity(message: string): Complexity {
  const trimmed = message.trim();

  // Short messages that match simple patterns
  if (trimmed.length < 30 && SIMPLE_PATTERNS.some(p => p.test(trimmed))) {
    return 'simple';
  }

  // Very short messages are simple
  if (trimmed.length < 15) {
    return 'simple';
  }

  // Check for complex patterns
  if (COMPLEX_PATTERNS.some(p => p.test(trimmed))) {
    return 'complex';
  }

  // Long messages (500+ chars) are complex
  if (trimmed.length > 500) {
    return 'complex';
  }

  // Everything else is moderate
  return 'moderate';
}

/**
 * Get the optimal model for a message based on complexity.
 * Only routes if user is using the default model — manual selection is always respected.
 */
export function getRoutedModel(userSelectedModel: string, message: string): { model: string; complexity: Complexity; routed: boolean } {
  const complexity = classifyComplexity(message);

  // User explicitly selected a non-default model → respect their choice
  if (userSelectedModel !== DEFAULT_TEXT_MODEL) {
    return { model: userSelectedModel, complexity, routed: false };
  }

  const routedModel = TIER_MODELS[complexity];
  const routed = routedModel !== userSelectedModel;

  return { model: routedModel, complexity, routed };
}
