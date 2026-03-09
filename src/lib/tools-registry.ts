/**
 * Angelina AI - Tools Registry
 *
 * SINGLE SOURCE OF TRUTH for all Angelina tool definitions.
 * Every tool, its parameters, category, endpoint, and env requirements live here.
 *
 * Consumers:
 *   - /api/chat (OpenAI / Anthropic function calling)
 *   - Telegram bot (tool list for LLM)
 *   - Agent router (toolSubset filtering)
 *   - Worker tick (tool execution by name)
 *
 * TODO: ai-agent.ts should eventually import from this registry
 * instead of maintaining its own `tools` object.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ToolCategory =
  | 'email'
  | 'task'
  | 'calendar'
  | 'search'
  | 'memory'
  | 'content'
  | 'voice'
  | 'infrastructure'
  | 'analytics'
  | 'communication';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object';
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  endpoint: string;
  parameters: Record<string, ToolParameter>;
  category: ToolCategory;
  /** Env var this tool requires at runtime. Undefined = no special env needed. */
  needsEnv?: string;
}

/** OpenAI function-calling schema shape */
export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description?: string; default?: unknown }>;
      required?: string[];
    };
  };
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // ── Email ──────────────────────────────────────────────────────────────
  {
    name: 'check_email',
    description: 'Check and summarize emails from inbox',
    endpoint: '/api/tools/check_email',
    category: 'email',
    parameters: {
      count: { type: 'number', description: 'Number of emails to check', default: 5 },
      filter: { type: 'string', description: 'Filter: unread, important, all', default: 'unread' },
    },
  },
  {
    name: 'send_email',
    description: 'Send an email',
    endpoint: '/api/tools/send_email',
    category: 'email',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  {
    name: 'draft_email',
    description: 'Draft an email reply',
    endpoint: '/api/tools/draft_email',
    category: 'email',
    parameters: {
      emailId: { type: 'string', description: 'ID of email to reply to' },
      tone: { type: 'string', description: 'Tone: professional, friendly, brief' },
    },
  },

  // ── Task ───────────────────────────────────────────────────────────────
  {
    name: 'manage_task',
    description:
      'Create, update, bulk-update, or list tasks. Actions: "create", "update", "update_all", "list".',
    endpoint: '/api/tools/manage_task',
    category: 'task',
    parameters: {
      action: { type: 'string', description: 'create, update, update_all, or list', required: true },
      title: { type: 'string', description: 'Task title (for create/update)' },
      description: { type: 'string', description: 'Task description' },
      status: { type: 'string', description: 'pending, in_progress, completed, archived' },
      priority: { type: 'string', description: 'high, medium, low' },
      from_status: { type: 'string', description: 'For update_all: move tasks FROM this status' },
    },
  },
  {
    name: 'goals',
    description:
      'Set, update, or list autonomous goals. When a goal is created, Angelina auto-decomposes it into tasks and executes them every 15 minutes. Use for goals, targets, OKRs. Actions: "set" (new goal), "update" (progress/status), "list" (show all), "queue" (show task queue).',
    endpoint: '/api/tools/goals',
    category: 'task',
    parameters: {
      action: { type: 'string', description: 'set, update, list, or queue', required: true },
      title: { type: 'string', description: 'Goal title' },
      description: { type: 'string', description: 'Goal details' },
      target: { type: 'string', description: 'Target metric' },
      deadline: { type: 'string', description: 'Deadline (ISO date)' },
      progress: { type: 'number', description: 'Progress 0-100 (for update)' },
      status: { type: 'string', description: 'active, completed, paused, failed (for update)' },
      goal_id: { type: 'string', description: 'Goal ID (for update)' },
      priority: { type: 'string', description: 'critical, high, medium, low' },
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks from ClickUp (legacy)',
    endpoint: '/api/integrations/clickup',
    category: 'task',
    parameters: {
      status: { type: 'string', description: 'Filter by status' },
      limit: { type: 'number', default: 10 },
    },
  },
  {
    name: 'create_task',
    description: 'Create a task in ClickUp (legacy)',
    endpoint: '/api/integrations/clickup',
    category: 'task',
    parameters: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      dueDate: { type: 'string' },
      priority: { type: 'string', description: '1=urgent, 2=high, 3=normal, 4=low' },
    },
  },

  // ── Calendar ───────────────────────────────────────────────────────────
  {
    name: 'check_calendar',
    description: 'Check upcoming calendar events',
    endpoint: '/api/tools/check_calendar',
    category: 'calendar',
    parameters: {
      days: { type: 'number', description: 'Days to look ahead', default: 7 },
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event',
    endpoint: '/api/tools/create_event',
    category: 'calendar',
    parameters: {
      title: { type: 'string', required: true },
      date: { type: 'string', required: true },
      time: { type: 'string' },
      duration: { type: 'number', description: 'Duration in minutes', default: 60 },
    },
  },

  // ── Search ─────────────────────────────────────────────────────────────
  {
    name: 'web_search',
    description: 'Search the web for information',
    endpoint: '/api/tools/web_search',
    category: 'search',
    parameters: {
      query: { type: 'string', required: true },
    },
  },
  {
    name: 'generate_embeddings',
    description: 'Generate vector embeddings for text. Use for semantic search, RAG, memory similarity.',
    endpoint: '/api/tools/generate_embeddings',
    category: 'search',
    needsEnv: 'EURI_API_KEY',
    parameters: {
      input: { type: 'string', description: 'Text or array of texts to embed', required: true },
      model: { type: 'string', description: 'Embedding model. Default: text-embedding-3-small' },
    },
  },

  // ── Memory ─────────────────────────────────────────────────────────────
  {
    name: 'save_memory',
    description: 'Save important information to memory for later recall.',
    endpoint: '/api/tools/save_memory',
    category: 'memory',
    parameters: {
      content: { type: 'string', description: 'What to remember', required: true },
      topic: { type: 'string', description: 'Topic/category' },
      type: { type: 'string', description: 'client, fact, preference, decision, task' },
    },
  },
  {
    name: 'recall_memory',
    description: 'Search memory for previously saved information.',
    endpoint: '/api/tools/recall_memory',
    category: 'memory',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      type: { type: 'string', description: 'Optional filter: client, fact, preference, decision, task' },
    },
  },

  // ── Content ────────────────────────────────────────────────────────────
  {
    name: 'generate_document',
    description: 'Generate a document (PDF, DOCX)',
    endpoint: '/api/tools/generate_document',
    category: 'content',
    parameters: {
      type: { type: 'string', description: 'quotation, invoice, report, letter' },
      data: { type: 'object', description: 'Document data' },
      format: { type: 'string', description: 'pdf, docx', default: 'pdf' },
    },
  },
  {
    name: 'generate_image',
    description:
      'Generate AI images using FLUX model. Returns image URL. Use for thumbnails, social media graphics, diagrams.',
    endpoint: '/api/tools/generate_image',
    category: 'content',
    needsEnv: 'EURI_API_KEY',
    parameters: {
      prompt: { type: 'string', description: 'Detailed image generation prompt', required: true },
      image_size: {
        type: 'string',
        description: 'landscape_16_9, square, or portrait_4_3. Default: landscape_16_9',
      },
    },
  },
  {
    name: 'linkedin_post',
    description:
      'Post content on LinkedIn via Ghost Browser on VPS. Requires approval unless auto-post is enabled.',
    endpoint: '/api/tools/linkedin_post',
    category: 'content',
    needsEnv: 'OPENCLAW_VPS_URL',
    parameters: {
      content: { type: 'string', description: 'The LinkedIn post content', required: true },
      image_url: { type: 'string', description: 'URL of image to attach' },
    },
  },
  {
    name: 'create_presentation',
    description: 'Create professional presentations and slides using Gamma AI.',
    endpoint: '/api/tools/create_presentation',
    category: 'content',
    parameters: {
      topic: { type: 'string', description: 'Topic or title for the presentation', required: true },
      style: { type: 'string', description: 'professional, creative, minimal' },
      num_slides: { type: 'number', description: 'Number of slides, default 8' },
    },
  },

  // ── Communication ──────────────────────────────────────────────────────
  {
    name: 'call_dhruv',
    description:
      'Call Dhruv on his phone. Use when he says "call me", "remind me by call", "phone me".',
    endpoint: '/api/tools/call_dhruv',
    category: 'communication',
    parameters: {
      message: { type: 'string', description: 'What to say on the call', required: true },
      mode: {
        type: 'string',
        description: 'vapi (AI conversation) or twilio (quick reminder)',
        default: 'twilio',
      },
    },
  },

  // ── Voice ──────────────────────────────────────────────────────────────
  {
    name: 'transcribe_audio',
    description:
      'Transcribe audio/voice messages to text. Supports Hindi and English. Use for Telegram voice messages, meeting recordings, or any audio file.',
    endpoint: '/api/tools/transcribe_audio',
    category: 'voice',
    needsEnv: 'EURI_API_KEY',
    parameters: {
      file: {
        type: 'string',
        description: 'Audio file (wav, mp3, flac, ogg, m4a). Max 25MB.',
        required: true,
      },
      language_code: {
        type: 'string',
        description: 'BCP-47 language code: en-IN, hi-IN. Default: en-IN',
      },
      with_timestamps: {
        type: 'boolean',
        description: 'Include word-level timestamps. Default: false',
      },
    },
  },
  {
    name: 'text_to_speech',
    description:
      'Convert text to natural speech audio. Supports Hindi and English voices. Use when Dhruv asks to "say this", "read this aloud", or for voice notifications.',
    endpoint: '/api/tools/text_to_speech',
    category: 'voice',
    needsEnv: 'EURI_API_KEY',
    parameters: {
      input: { type: 'string', description: 'Text to convert to speech', required: true },
      speaker: { type: 'string', description: 'Voice ID. Default: shubh' },
      language: { type: 'string', description: 'Target language: en-IN, hi-IN. Default: en-IN' },
      pace: { type: 'number', description: 'Speech pace (0.5-2.0). Default: 1' },
    },
  },

  // ── Analytics ──────────────────────────────────────────────────────────
  {
    name: 'youtube_analytics',
    description: 'Get YouTube channel analytics and video performance data.',
    endpoint: '/api/tools/youtube_analytics',
    category: 'analytics',
    parameters: {},
  },

  // ── Infrastructure ─────────────────────────────────────────────────────
  {
    name: 'vps_execute',
    description:
      "Execute commands on Dhruv's VPS via OpenClaw. Can run shell commands, manage Docker, check server health, or delegate to specialized agents.",
    endpoint: '/api/tools/vps_execute',
    category: 'infrastructure',
    parameters: {
      command: {
        type: 'string',
        description: 'The command or instruction to execute on the VPS',
        required: true,
      },
      agent: {
        type: 'string',
        description: 'Which OpenClaw agent to use: arjun, scout, creator, devops. Default: arjun',
      },
    },
  },
];

// ─── Lookup Maps (built once at import time) ────────────────────────────────

const _byName = new Map<string, ToolDefinition>();
const _byCategory = new Map<ToolCategory, ToolDefinition[]>();

for (const tool of TOOLS_REGISTRY) {
  _byName.set(tool.name, tool);

  const list = _byCategory.get(tool.category) || [];
  list.push(tool);
  _byCategory.set(tool.category, list);
}

// ─── Public Helpers ─────────────────────────────────────────────────────────

/** Look up a single tool by name. Returns undefined if not found. */
export function getToolByName(name: string): ToolDefinition | undefined {
  return _byName.get(name);
}

/** Return all tools in a given category. Returns empty array if category has no tools. */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return _byCategory.get(category) || [];
}

/** Check whether a tool name exists in the registry. */
export function validateToolName(name: string): boolean {
  return _byName.has(name);
}

/**
 * Convert the registry into OpenAI function-calling schema format.
 * Pass an optional `names` array to return only a subset (e.g., agent toolSubset).
 */
export function getToolsForOpenAI(names?: string[]): OpenAITool[] {
  const source = names
    ? TOOLS_REGISTRY.filter((t) => names.includes(t.name))
    : TOOLS_REGISTRY;

  return source.map((tool) => {
    const properties: Record<string, { type: string; description?: string; default?: unknown }> = {};
    const required: string[] = [];

    for (const [key, param] of Object.entries(tool.parameters)) {
      properties[key] = {
        type: param.type,
        ...(param.description ? { description: param.description } : {}),
        ...(param.default !== undefined ? { default: param.default } : {}),
      };
      if (param.required) {
        required.push(key);
      }
    }

    return {
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object' as const,
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    };
  });
}
