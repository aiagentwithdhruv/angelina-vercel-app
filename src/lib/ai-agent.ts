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

  // Twitter/X Posting
  twitter_post: {
    name: 'twitter_post',
    description: 'Post content on Twitter/X via Ghost Browser on VPS. Requires approval unless auto-post is enabled.',
    parameters: {
      content: { type: 'string', description: 'The tweet/post content (max 280 chars for tweets, longer for threads)', required: true },
      image_url: { type: 'string', description: 'URL of image to attach' },
    },
  },

  // Handwritten Diagram Prompt
  handdrawn_diagram: {
    name: 'handdrawn_diagram',
    description: 'Generate a hand-drawn whiteboard infographic prompt for Google Gemini image generation. Use when Dhruv asks for "hand-drawn visual", "whiteboard diagram", "visual explainer", "handwritten notes", "infographic". Returns a copy-paste prompt for Gemini.',
    parameters: {
      title: { type: 'string', description: 'Main title of the diagram', required: true },
      subtitle: { type: 'string', description: 'Subtitle or description' },
      sections: { type: 'string', description: 'Describe the content sections (left column, center flow, right column, flash cards, stats)' },
      ratio: { type: 'string', description: '16:9 (GitHub/YouTube), 4:5 (LinkedIn), 1:1 (Instagram). Default: 16:9' },
    },
  },

  // Thumbnail Prompt
  thumbnail_prompt: {
    name: 'thumbnail_prompt',
    description: 'Generate a photorealistic AI thumbnail prompt in Dhruv\'s signature style. Use when Dhruv asks for "thumbnail", "YouTube thumbnail", "cover image", "hero image". Style: dark moody workspace, black t-shirt, MacBook, teal/purple neon overlays.',
    parameters: {
      topic: { type: 'string', description: 'Video/post topic for the thumbnail', required: true },
      hook: { type: 'string', description: 'Visual hook: ghost_copies, holographic_command, pipeline_flow, before_after, usb_hub, sleeping_ghosts, floating_logos. Default: holographic_command' },
      platform: { type: 'string', description: 'youtube (16:9), linkedin (4:5), twitter (16:9), instagram (1:1). Default: youtube' },
      text_overlay: { type: 'string', description: 'Max 6 words for text overlay on the thumbnail' },
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

  // Speech-to-Text (Euri — Sarvam STT)
  transcribe_audio: {
    name: 'transcribe_audio',
    description: 'Transcribe audio/voice messages to text. Supports Hindi and English. Use for Telegram voice messages, meeting recordings, or any audio file.',
    parameters: {
      file: { type: 'string', description: 'Audio file (wav, mp3, flac, ogg, m4a). Max 25MB.', required: true },
      language_code: { type: 'string', description: 'BCP-47 language code: en-IN, hi-IN. Default: en-IN' },
      with_timestamps: { type: 'boolean', description: 'Include word-level timestamps. Default: false' },
    },
  },

  // Text-to-Speech (Euri — Sarvam TTS)
  text_to_speech: {
    name: 'text_to_speech',
    description: 'Convert text to natural speech audio. Supports Hindi and English voices. Use when Dhruv asks to "say this", "read this aloud", or for voice notifications.',
    parameters: {
      input: { type: 'string', description: 'Text to convert to speech', required: true },
      speaker: { type: 'string', description: 'Voice ID. Default: shubh' },
      language: { type: 'string', description: 'Target language: en-IN, hi-IN. Default: en-IN' },
      pace: { type: 'number', description: 'Speech pace (0.5-2.0). Default: 1' },
    },
  },

  // Embeddings (Euri)
  generate_embeddings: {
    name: 'generate_embeddings',
    description: 'Generate vector embeddings for text. Use for semantic search, RAG, memory similarity.',
    parameters: {
      input: { type: 'string', description: 'Text or array of texts to embed', required: true },
      model: { type: 'string', description: 'Embedding model. Default: text-embedding-3-small' },
    },
  },
};

// Note: The actual chat handling uses /api/chat/route.ts with ANGELINA_SYSTEM_PROMPT
// from angelina-context.ts. This file only exports tool definitions for reuse
// (e.g., Telegram bot imports `tools` from here).
