/**
 * Angelina AI - Agent Core
 * The brain that processes requests and calls tools
 */

// Tool definitions that Angelina can use
export const tools = {
  // Email tools
  check_email: {
    name: 'check_email',
    description: 'Check and summarize emails from inbox',
    parameters: {
      count: { type: 'number', description: 'Number of emails to check', default: 5 },
      filter: { type: 'string', description: 'Filter: unread, important, all', default: 'unread' },
    },
  },
  send_email: {
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  draft_email: {
    name: 'draft_email',
    description: 'Draft an email reply',
    parameters: {
      emailId: { type: 'string', description: 'ID of email to reply to' },
      tone: { type: 'string', description: 'Tone: professional, friendly, brief' },
    },
  },

  // Task tools
  create_task: {
    name: 'create_task',
    description: 'Create a task in ClickUp',
    parameters: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      dueDate: { type: 'string' },
      priority: { type: 'string', description: '1=urgent, 2=high, 3=normal, 4=low' },
    },
  },
  list_tasks: {
    name: 'list_tasks',
    description: 'List tasks from ClickUp',
    parameters: {
      status: { type: 'string', description: 'Filter by status' },
      limit: { type: 'number', default: 10 },
    },
  },

  // Calendar tools
  check_calendar: {
    name: 'check_calendar',
    description: 'Check upcoming calendar events',
    parameters: {
      days: { type: 'number', description: 'Days to look ahead', default: 7 },
    },
  },
  create_event: {
    name: 'create_event',
    description: 'Create a calendar event',
    parameters: {
      title: { type: 'string', required: true },
      date: { type: 'string', required: true },
      time: { type: 'string' },
      duration: { type: 'number', description: 'Duration in minutes', default: 60 },
    },
  },

  // Document tools
  generate_document: {
    name: 'generate_document',
    description: 'Generate a document (PDF, DOCX)',
    parameters: {
      type: { type: 'string', description: 'quotation, invoice, report, letter' },
      data: { type: 'object', description: 'Document data' },
      format: { type: 'string', description: 'pdf, docx', default: 'pdf' },
    },
  },

  // Search tools
  web_search: {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', required: true },
    },
  },

  // Task management
  manage_task: {
    name: 'manage_task',
    description: 'Create, update, bulk-update, or list tasks. Actions: "create", "update", "update_all", "list".',
    parameters: {
      action: { type: 'string', description: 'create, update, update_all, or list', required: true },
      title: { type: 'string', description: 'Task title (for create/update)' },
      description: { type: 'string', description: 'Task description' },
      status: { type: 'string', description: 'pending, in_progress, completed, archived' },
      priority: { type: 'string', description: 'high, medium, low' },
      from_status: { type: 'string', description: 'For update_all: move tasks FROM this status' },
    },
  },

  // Autonomous goals
  goals: {
    name: 'goals',
    description: 'Set, update, or list autonomous goals. When a goal is created, Angelina auto-decomposes it into tasks and executes them every 15 minutes. Use for goals, targets, OKRs. Actions: "set" (new goal), "update" (progress/status), "list" (show all), "queue" (show task queue).',
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

  // Memory
  save_memory: {
    name: 'save_memory',
    description: 'Save important information to memory for later recall.',
    parameters: {
      content: { type: 'string', description: 'What to remember', required: true },
      topic: { type: 'string', description: 'Topic/category' },
      type: { type: 'string', description: 'client, fact, preference, decision, task' },
    },
  },
  recall_memory: {
    name: 'recall_memory',
    description: 'Search memory for previously saved information.',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      type: { type: 'string', description: 'Optional filter: client, fact, preference, decision, task' },
    },
  },

  // Call
  call_dhruv: {
    name: 'call_dhruv',
    description: 'Call Dhruv on his phone. Use when he says "call me", "remind me by call", "phone me".',
    parameters: {
      message: { type: 'string', description: 'What to say on the call', required: true },
      mode: { type: 'string', description: 'vapi (AI conversation) or twilio (quick reminder)', default: 'twilio' },
    },
  },

  // YouTube
  youtube_analytics: {
    name: 'youtube_analytics',
    description: 'Get YouTube channel analytics and video performance data.',
    parameters: {},
  },

  // VPS Control
  vps_execute: {
    name: 'vps_execute',
    description: 'Execute commands on Dhruv\'s VPS via OpenClaw. Can run shell commands, manage Docker, check server health, or delegate to specialized agents.',
    parameters: {
      command: { type: 'string', description: 'The command or instruction to execute on the VPS', required: true },
      agent: { type: 'string', description: 'Which OpenClaw agent to use: arjun, scout, creator, devops. Default: arjun' },
    },
  },

  // Image Generation
  generate_image: {
    name: 'generate_image',
    description: 'Generate AI images using FLUX model. Returns image URL. Use for thumbnails, social media graphics, diagrams.',
    parameters: {
      prompt: { type: 'string', description: 'Detailed image generation prompt', required: true },
      image_size: { type: 'string', description: 'landscape_16_9, square, or portrait_4_3. Default: landscape_16_9' },
    },
  },

  // LinkedIn Posting
  linkedin_post: {
    name: 'linkedin_post',
    description: 'Post content on LinkedIn via Ghost Browser on VPS. Requires approval unless auto-post is enabled.',
    parameters: {
      content: { type: 'string', description: 'The LinkedIn post content', required: true },
      image_url: { type: 'string', description: 'URL of image to attach' },
    },
  },

  // Presentations
  create_presentation: {
    name: 'create_presentation',
    description: 'Create professional presentations and slides using Gamma AI.',
    parameters: {
      topic: { type: 'string', description: 'Topic or title for the presentation', required: true },
      style: { type: 'string', description: 'professional, creative, minimal' },
      num_slides: { type: 'number', description: 'Number of slides, default 8' },
    },
  },
};

// Note: The actual chat handling uses /api/chat/route.ts with ANGELINA_SYSTEM_PROMPT
// from angelina-context.ts. This file only exports tool definitions for reuse
// (e.g., Telegram bot imports `tools` from here).
