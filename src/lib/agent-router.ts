/**
 * Multi-Agent Router — Phase 4 of the Jarvis Roadmap
 *
 * Routes tasks to specialized agents based on keyword matching (zero LLM cost).
 * Each agent is a different system prompt + model preference — no separate processes.
 *
 * Agents:
 *   Angelina Prime — Orchestrator (general, personality, routing)
 *   Scout         — Research (web search, competitors, leads, trends)
 *   Creator       — Content (LinkedIn, blogs, thumbnails, video scripts)
 *   Builder       — Code/DevOps (GitHub, deploys, code review, VPS)
 *   Ops           — Operations (email, calendar, CRM, task management)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentName = 'angelina-prime' | 'scout' | 'creator' | 'builder' | 'ops';

export interface AgentConfig {
  name: AgentName;
  label: string;
  systemPrompt: string;
  preferredModel: string;
  toolSubset: string[];
}

export interface RoutingResult {
  agent: AgentConfig;
  matchedKeywords: string[];
  confidence: number; // 0-1, based on keyword density
}

// ─── Agent Definitions ──────────────────────────────────────────────────────

const AGENTS: Record<AgentName, AgentConfig> = {
  'angelina-prime': {
    name: 'angelina-prime',
    label: 'Angelina Prime',
    preferredModel: 'gpt-4.1-mini',
    toolSubset: [
      'manage_task', 'goals', 'save_memory', 'recall_memory',
      'call_dhruv', 'web_search', 'youtube_analytics',
    ],
    systemPrompt:
      `You are Angelina Prime — Dhruv's central AI companion and orchestrator. ` +
      `You handle general requests, coordinate with other agents, and maintain Dhruv's context. ` +
      `You're warm, strategic, and action-oriented. ` +
      `When a task clearly belongs to Scout, Creator, Builder, or Ops, delegate — don't do it yourself. ` +
      `Your job is to keep Dhruv focused on distribution over features and moving the revenue needle. ` +
      `Always reference the skills library before building anything new. ` +
      `Motto: "Dhruv says it. I make it happen."`,
  },

  scout: {
    name: 'scout',
    label: 'Scout',
    preferredModel: 'kimi-k2.5',
    toolSubset: [
      'web_search', 'save_memory', 'recall_memory',
    ],
    systemPrompt:
      `You are Scout — Dhruv's research agent. ` +
      `You specialize in web search, competitor analysis, market research, lead research, and trend analysis. ` +
      `Be thorough but concise: present findings in tables with sources. ` +
      `Always save key findings to memory. ` +
      `When researching leads, use the scrape-leads and classify-leads skill patterns. ` +
      `Deliver actionable intelligence, not just raw data.`,
  },

  creator: {
    name: 'creator',
    label: 'Creator',
    preferredModel: 'gpt-4.1-mini',
    toolSubset: [
      'web_search', 'save_memory', 'recall_memory',
      'generate_document',
    ],
    systemPrompt:
      `You are Creator — Dhruv's content agent. ` +
      `You draft LinkedIn posts, blog articles, video scripts, captions, carousels, and thumbnail prompts. ` +
      `Match Dhruv's brand voice: technical authority + accessible teaching. ` +
      `Use the content-pipeline skill chain and thumbnail-generator templates. ` +
      `Always structure content with hooks, value, and CTAs. ` +
      `Keep LinkedIn posts punchy. Keep articles SEO-friendly.`,
  },

  builder: {
    name: 'builder',
    label: 'Builder',
    preferredModel: 'gpt-4.1-mini',
    toolSubset: [
      'web_search', 'save_memory', 'recall_memory',
    ],
    systemPrompt:
      `You are Builder — Dhruv's code and DevOps agent. ` +
      `You handle GitHub PRs, code review, bug fixes, deployments, Docker, VPS management, and refactoring. ` +
      `Follow the ai-coding-rules (15 rules): clean architecture, thin routes, typed schemas, no hardcoded secrets. ` +
      `Use modal-deploy and aws-production-deploy skill patterns for infrastructure. ` +
      `Write production-quality code. No toy implementations. Minimal diffs.`,
  },

  ops: {
    name: 'ops',
    label: 'Ops',
    preferredModel: 'gpt-4.1-nano',
    toolSubset: [
      'check_email', 'send_email', 'draft_email',
      'check_calendar', 'create_event',
      'manage_task', 'save_memory', 'recall_memory',
      'call_dhruv',
    ],
    systemPrompt:
      `You are Ops — Dhruv's operations agent. ` +
      `You handle email triage, calendar management, meeting scheduling, CRM updates, invoicing, and follow-ups. ` +
      `Be efficient and structured. Summarize emails in tables. Flag urgent items first. ` +
      `Use gmail-inbox and gmail-label skill patterns for email management. ` +
      `Always confirm before sending emails or making commitments on Dhruv's behalf.`,
  },
};

// ─── Keyword Routing Table ──────────────────────────────────────────────────

const ROUTING_KEYWORDS: Record<Exclude<AgentName, 'angelina-prime'>, string[]> = {
  scout: [
    'research', 'analyze', 'compare', 'find', 'investigate',
    'market', 'competitor', 'lead', 'scrape', 'trend',
    'benchmark', 'survey', 'landscape', 'analysis', 'report on',
    'look into', 'explore', 'discovery', 'intelligence', 'monitor',
  ],
  creator: [
    'write', 'post', 'linkedin', 'content', 'blog',
    'article', 'thumbnail', 'video', 'script', 'caption',
    'carousel', 'draft', 'headline', 'hook', 'copy',
    'newsletter', 'thread', 'tweet', 'youtube', 'title',
  ],
  builder: [
    'code', 'deploy', 'github', 'pr', 'bug',
    'fix', 'refactor', 'server', 'docker', 'build',
    'test', 'review', 'api', 'endpoint', 'database',
    'migration', 'ci/cd', 'pipeline', 'vps', 'debug',
  ],
  ops: [
    'email', 'calendar', 'meeting', 'schedule', 'task',
    'invoice', 'payment', 'crm', 'follow-up', 'reminder',
    'followup', 'agenda', 'appointment', 'booking', 'triage',
    'inbox', 'reply', 'respond', 'reschedule', 'notify',
  ],
};

// ─── Router Logic ───────────────────────────────────────────────────────────

/**
 * Score a text against keyword lists for each agent.
 * Returns matches per agent with keyword hits.
 */
function scoreAgents(text: string): Map<AgentName, string[]> {
  const normalized = text.toLowerCase();
  const scores = new Map<AgentName, string[]>();

  for (const [agent, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    const matched = keywords.filter((kw) => normalized.includes(kw));
    if (matched.length > 0) {
      scores.set(agent as AgentName, matched);
    }
  }

  return scores;
}

/**
 * Route a task to the best agent using zero-cost keyword matching.
 *
 * @param title       - Task title (required, primary signal)
 * @param description - Optional task description (secondary signal)
 * @returns           - The matched agent config with routing metadata
 */
export function getAgentForTask(title: string, description?: string): RoutingResult {
  // Combine title (weighted 2x by repeating) and description for scoring
  const combined = `${title} ${title} ${description || ''}`.trim();

  const scores = scoreAgents(combined);

  if (scores.size === 0) {
    return {
      agent: AGENTS['angelina-prime'],
      matchedKeywords: [],
      confidence: 1, // Default route is always confident
    };
  }

  // Pick the agent with the most keyword matches
  let bestAgent: AgentName = 'angelina-prime';
  let bestCount = 0;
  let bestKeywords: string[] = [];

  scores.forEach((keywords, agent) => {
    if (keywords.length > bestCount) {
      bestAgent = agent;
      bestCount = keywords.length;
      bestKeywords = keywords;
    }
  });

  // Confidence = ratio of matched keywords to total keywords for that agent
  // Capped at 1.0, minimum 0.3 for any match
  const totalKeywords = ROUTING_KEYWORDS[bestAgent as Exclude<AgentName, 'angelina-prime'>]?.length || 1;
  const confidence = Math.min(1, Math.max(0.3, bestCount / (totalKeywords * 0.4)));

  return {
    agent: AGENTS[bestAgent],
    matchedKeywords: bestKeywords,
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/** Get a specific agent by name */
export function getAgent(name: AgentName): AgentConfig {
  return AGENTS[name];
}

/** Get all agents */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENTS);
}

/** Check if a model ID is used by any agent */
export function getAgentsByModel(modelId: string): AgentConfig[] {
  return Object.values(AGENTS).filter((a) => a.preferredModel === modelId);
}
