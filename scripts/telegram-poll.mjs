/**
 * Local dev: Start Telegram bot in polling mode
 * Run: node --env-file=.env.local scripts/telegram-poll.mjs
 *
 * This polls Telegram for updates instead of requiring a webhook.
 * Use this for local development. For production, use the webhook endpoint.
 */

import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

// Dynamic import grammy
const { Bot } = await import('grammy');
const { autoRetry } = await import('@grammyjs/auto-retry');

const bot = new Bot(token);
bot.api.config.use(autoRetry());

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const allowedRaw = process.env.TELEGRAM_ALLOWED_USERS || '';
const allowedUsers = allowedRaw
  ? new Set(allowedRaw.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean))
  : new Set();

// Auth middleware
bot.use(async (ctx, next) => {
  if (allowedUsers.size > 0 && ctx.from?.id && !allowedUsers.has(ctx.from.id)) {
    await ctx.reply('Sorry, you are not authorized to use this bot.');
    return;
  }
  await next();
});

// /start
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'there';
  await ctx.reply(
    `Hey ${name}! I'm Angelina, Dhruv's AI companion.\n\n` +
    `Just send me a message and I'll help you out!\n\n` +
    `Commands:\n/clear - Clear conversation\n/status - Bot status`
  );
});

// /clear
bot.command('clear', async (ctx) => {
  sessions.delete(ctx.from?.id);
  await ctx.reply('Conversation cleared! Starting fresh.');
});

// /status
bot.command('status', async (ctx) => {
  const session = sessions.get(ctx.from?.id);
  await ctx.reply(
    `Angelina Status:\n` +
    `Messages in session: ${session ? session.length - 1 : 0}\n` +
    `Server: ${BASE_URL}\n` +
    `Mode: Polling (local dev)`
  );
});

// Tools — must match actual /api/tools/* routes AND ai-agent.ts definitions
const TOOLS = [
  // --- Email tools ---
  {
    name: 'check_email',
    description: 'Check and summarize emails from Gmail inbox',
    parameters: {
      count: { type: 'number', description: 'Number of emails to check', default: 5 },
      filter: { type: 'string', description: 'Filter: unread, important, all', default: 'unread' },
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  {
    name: 'draft_email',
    description: 'Draft an email reply',
    parameters: {
      emailId: { type: 'string', description: 'ID of email to reply to' },
      tone: { type: 'string', description: 'Tone: professional, friendly, brief' },
    },
  },

  // --- Task management ---
  {
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

  // --- Autonomous goals ---
  {
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

  // --- Calendar tools ---
  {
    name: 'check_calendar',
    description: 'Check upcoming calendar events from Google Calendar',
    parameters: {
      days: { type: 'number', description: 'Days to look ahead', default: 7 },
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event',
    parameters: {
      title: { type: 'string', description: 'Event title', required: true },
      date: { type: 'string', description: 'Event date', required: true },
      time: { type: 'string', description: 'Event time' },
      duration: { type: 'number', description: 'Duration in minutes', default: 60 },
    },
  },

  // --- Document generation ---
  {
    name: 'generate_document',
    description: 'Generate a document (PDF, DOCX)',
    parameters: {
      type: { type: 'string', description: 'quotation, invoice, report, letter' },
      data: { type: 'object', description: 'Document data' },
      format: { type: 'string', description: 'pdf, docx', default: 'pdf' },
    },
  },

  // --- Web search ---
  {
    name: 'web_search',
    description: 'Search the web in real-time for current events, latest news, prices, weather, live scores, stock prices, or any question needing up-to-date information.',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      search_depth: { type: 'string', description: 'basic or advanced' },
      max_results: { type: 'number', description: 'Max results (default 5)' },
    },
  },

  // --- Memory tools ---
  {
    name: 'save_memory',
    description: 'Save important information to persistent memory. Use when Dhruv tells you about a client, preference, decision, or important detail.',
    parameters: {
      content: { type: 'string', description: 'What to remember', required: true },
      topic: { type: 'string', description: 'Short topic/name' },
      type: { type: 'string', description: 'client, fact, preference, decision, or task' },
      importance: { type: 'string', description: 'low, medium, or high' },
    },
  },
  {
    name: 'recall_memory',
    description: 'Search your memory for previously saved information.',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      type: { type: 'string', description: 'Optional filter: client, fact, preference, decision, task' },
    },
  },

  // --- Call ---
  {
    name: 'call_dhruv',
    description: 'Call Dhruv on his phone. Use when he says "call me", "remind me by call", "phone me".',
    parameters: {
      message: { type: 'string', description: 'What to say on the call', required: true },
      call_type: { type: 'string', description: 'reminder, motivation, task_update, alert, or general' },
      mode: { type: 'string', description: 'vapi (AI conversation) or twilio (quick reminder)', default: 'twilio' },
    },
  },

  // --- YouTube ---
  {
    name: 'youtube_analytics',
    description: 'Get YouTube channel analytics and video performance data.',
    parameters: {},
  },

  // --- VPS Control ---
  {
    name: 'vps_execute',
    description: 'Execute commands on Dhruv\'s VPS via OpenClaw. Can run shell commands, manage Docker, check server health, or delegate to specialized agents.',
    parameters: {
      command: { type: 'string', description: 'The command or instruction to execute on the VPS', required: true },
      agent: { type: 'string', description: 'Which OpenClaw agent to use: arjun, scout, creator, devops. Default: arjun' },
    },
  },

  // --- Image Generation (Euri) ---
  {
    name: 'generate_image',
    description: 'Generate AI images using FLUX model. Returns image URL. Use for thumbnails, social media graphics, diagrams.',
    parameters: {
      prompt: { type: 'string', description: 'Detailed image generation prompt', required: true },
      image_size: { type: 'string', description: 'landscape_16_9, square, or portrait_4_3. Default: landscape_16_9' },
    },
  },

  // --- LinkedIn Posting ---
  {
    name: 'linkedin_post',
    description: 'Post content on LinkedIn via Ghost Browser on VPS. Requires approval unless auto-post is enabled.',
    parameters: {
      content: { type: 'string', description: 'The LinkedIn post content', required: true },
      image_url: { type: 'string', description: 'URL of image to attach' },
    },
  },

  // --- Presentations (Gamma) ---
  {
    name: 'create_presentation',
    description: 'Create professional presentations and slides using Gamma AI.',
    parameters: {
      topic: { type: 'string', description: 'Topic or title for the presentation', required: true },
      style: { type: 'string', description: 'professional, creative, minimal' },
      num_slides: { type: 'number', description: 'Number of slides, default 8' },
    },
  },

  // --- Speech-to-Text (Euri — Sarvam STT) ---
  {
    name: 'transcribe_audio',
    description: 'Transcribe audio/voice messages to text. Supports Hindi and English. Use for Telegram voice messages, meeting recordings, or any audio file.',
    parameters: {
      file: { type: 'string', description: 'Audio file path (wav, mp3, flac, ogg, m4a). Max 25MB.', required: true },
      language_code: { type: 'string', description: 'BCP-47 language code: en-IN, hi-IN. Default: en-IN' },
      with_timestamps: { type: 'boolean', description: 'Include word-level timestamps. Default: false' },
    },
  },

  // --- Text-to-Speech (Euri — Sarvam TTS) ---
  {
    name: 'text_to_speech',
    description: 'Convert text to natural speech audio. Supports Hindi and English voices. Use when Dhruv asks to "say this", "read this aloud", or for voice notifications.',
    parameters: {
      input: { type: 'string', description: 'Text to convert to speech', required: true },
      speaker: { type: 'string', description: 'Voice ID. Default: shubh' },
      language: { type: 'string', description: 'Target language: en-IN, hi-IN. Default: en-IN' },
      pace: { type: 'number', description: 'Speech pace (0.5-2.0). Default: 1' },
    },
  },

  // --- Embeddings (Euri) ---
  {
    name: 'generate_embeddings',
    description: 'Generate vector embeddings for text. Use for semantic search, RAG, memory similarity.',
    parameters: {
      input: { type: 'string', description: 'Text or array of texts to embed', required: true },
      model: { type: 'string', description: 'Embedding model. Default: text-embedding-3-small' },
    },
  },
];

// Per-user sessions
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, [{ role: 'system', content: 'You are Angelina, Dhruv\'s personal AI companion and assistant. Be warm, friendly, and helpful. You have access to tools for email, tasks, calendar, web search, and document generation — use them when the user asks.' }]);
  }
  return sessions.get(userId);
}

/**
 * Execute a tool by calling the Next.js API endpoint
 */
async function executeTool(toolName, args) {
  try {
    console.log(`[Tool] Executing ${toolName} with args:`, JSON.stringify(args));
    const res = await fetch(`${BASE_URL}/api/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    console.log(`[Tool] ${toolName} result:`, JSON.stringify(data).slice(0, 200));
    return data;
  } catch (err) {
    console.error(`[Tool] ${toolName} failed:`, err.message);
    return { error: `Tool ${toolName} failed: ${err.message}` };
  }
}

/**
 * Send message to chat API, handle tool calls recursively, return final text response
 */
async function chatWithTools(session, model) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: session,
      model,
      source: 'telegram',
      tools: TOOLS,
    }),
  });

  const data = await res.json();

  if (data.error) {
    return { error: data.error, _meta: data._meta };
  }

  // If the model wants to call tools, execute them and get a follow-up response
  if (data.toolCalls && data.toolCalls.length > 0) {
    console.log(`[Telegram] Model wants ${data.toolCalls.length} tool(s): ${data.toolCalls.map(t => t.name).join(', ')}`);

    // Execute all tool calls
    const toolResults = [];
    for (const tc of data.toolCalls) {
      const result = await executeTool(tc.name, tc.arguments || {});
      toolResults.push({ tool: tc.name, args: tc.arguments, result });
    }

    // Add tool execution context to session and ask for a final response
    const toolSummary = toolResults.map(tr =>
      `[Tool: ${tr.tool}]\nArgs: ${JSON.stringify(tr.args)}\nResult: ${JSON.stringify(tr.result)}`
    ).join('\n\n');

    session.push({
      role: 'assistant',
      content: `I'm executing tools to help you...\n\n${toolSummary}`,
    });
    session.push({
      role: 'user',
      content: 'Now summarize the tool results above in a helpful, natural response. Don\'t mention "tool" or "function" — just present the information clearly.',
    });

    // Get the final synthesized response (no tools this time to avoid loops)
    const finalRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: session,
        model: model,
        source: 'telegram',
      }),
    });

    const finalData = await finalRes.json();

    // Remove the synthetic messages we added for tool synthesis
    session.pop(); // remove "summarize" prompt
    session.pop(); // remove tool results

    return {
      response: finalData.response || 'I executed the tools but couldn\'t generate a summary.',
      _meta: data._meta,
      toolCalls: toolResults,
    };
  }

  return { response: data.response, _meta: data._meta };
}

/**
 * Split long text into Telegram-safe chunks (4096 char limit)
 */
function splitMessage(text) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4096) {
      chunks.push(remaining);
      break;
    }
    let idx = remaining.lastIndexOf('\n\n', 4096);
    if (idx < 1000) idx = remaining.lastIndexOf('\n', 4096);
    if (idx < 1000) idx = remaining.lastIndexOf(' ', 4096);
    if (idx < 1) idx = 4096;
    chunks.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx).trimStart();
  }
  return chunks;
}

/**
 * Download a Telegram voice file to a temp path, returns the local file path
 */
async function downloadTelegramFile(fileId) {
  // Get file info from Telegram
  const file = await bot.api.getFile(fileId);
  const filePath = file.file_path;
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

  // Determine extension from file_path (e.g. voice/file_123.oga)
  const ext = filePath.split('.').pop() || 'ogg';
  const tmpPath = join(tmpdir(), `tg_voice_${fileId}.${ext}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);

  const ws = createWriteStream(tmpPath);
  await finished(Readable.fromWeb(res.body).pipe(ws));

  return tmpPath;
}

/**
 * Process a text message through the chat pipeline (shared by text and voice handlers)
 */
async function processTextMessage(ctx, text) {
  const userId = ctx.from?.id;
  const session = getSession(userId);
  session.push({ role: 'user', content: text });

  await ctx.replyWithChatAction('typing');
  const typingInterval = setInterval(() => {
    ctx.replyWithChatAction('typing').catch(() => {});
  }, 4000);

  try {
    const data = await chatWithTools(session, 'google/gemini-2.5-flash-preview');
    clearInterval(typingInterval);

    if (data.error) {
      await ctx.reply(`Error: ${data.error}`);
      return;
    }

    const response = data.response || 'No response';
    session.push({ role: 'assistant', content: response });

    // Trim session if too long
    if (session.length > 42) {
      const sys = session[0];
      sessions.set(userId, [sys, ...session.slice(-40)]);
    }

    // Send response chunks
    for (const chunk of splitMessage(response)) {
      await ctx.reply(chunk, { parse_mode: 'Markdown' }).catch(() => ctx.reply(chunk));
    }

    // Log meta info
    if (data._meta) {
      console.log(`[Telegram] ${data._meta.complexity} → ${data._meta.actualModel} (${data._meta.provider})${data._meta.fallback ? ' [FALLBACK]' : ''}${data.toolCalls ? ` [TOOLS: ${data.toolCalls.map(t => t.tool).join(', ')}]` : ''}`);
    }
  } catch (err) {
    clearInterval(typingInterval);
    console.error('[Telegram] Error:', err.message);
    await ctx.reply('Something went wrong. Make sure the dev server is running on ' + BASE_URL);
  }
}

// Text messages
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;
  await processTextMessage(ctx, text);
});

// Voice messages — download, transcribe via STT, then process as text
bot.on('message:voice', async (ctx) => {
  const voice = ctx.message.voice;
  const userId = ctx.from?.id;

  console.log(`[Telegram] Voice message from ${userId} (${voice.duration}s, ${voice.file_size} bytes)`);

  await ctx.replyWithChatAction('typing');

  let tmpPath = null;
  try {
    // 1. Download the voice file from Telegram
    tmpPath = await downloadTelegramFile(voice.file_id);
    console.log(`[Telegram] Voice downloaded to ${tmpPath}`);

    // 2. Send to transcribe_audio API for STT
    const transcribeResult = await executeTool('transcribe_audio', {
      file: tmpPath,
      language_code: 'en-IN',
    });

    if (transcribeResult.error) {
      await ctx.reply(`Could not transcribe voice message: ${transcribeResult.error}`);
      return;
    }

    const transcript = transcribeResult.transcript || transcribeResult.text || transcribeResult.result || '';
    if (!transcript) {
      await ctx.reply('I received your voice message but couldn\'t extract any text from it.');
      return;
    }

    console.log(`[Telegram] Transcribed: "${transcript.slice(0, 100)}${transcript.length > 100 ? '...' : ''}"`);

    // 3. Show the user what was heard
    await ctx.reply(`🎤 _"${transcript}"_`, { parse_mode: 'Markdown' }).catch(() =>
      ctx.reply(`Heard: "${transcript}"`)
    );

    // 4. Process the transcribed text as a normal chat message
    await processTextMessage(ctx, transcript);
  } catch (err) {
    console.error('[Telegram] Voice error:', err.message);
    await ctx.reply('Failed to process voice message. Make sure the dev server is running on ' + BASE_URL);
  } finally {
    // Clean up temp file
    if (tmpPath) {
      unlink(tmpPath).catch(() => {});
    }
  }
});

bot.catch((err) => console.error('[Bot Error]', err));

// Delete any existing webhook before polling
await bot.api.deleteWebhook();

console.log(`\n🤖 Angelina Telegram Bot started (polling mode)`);
console.log(`   Bot: @Aiangelina_bot`);
console.log(`   Server: ${BASE_URL}`);
console.log(`   Tools: ${TOOLS.length} registered`);
console.log(`   Auth: ${allowedUsers.size > 0 ? `${allowedUsers.size} allowed users` : 'open (dev mode)'}`);
console.log(`\n   Send a message or voice note to @Aiangelina_bot on Telegram!\n`);

bot.start();
