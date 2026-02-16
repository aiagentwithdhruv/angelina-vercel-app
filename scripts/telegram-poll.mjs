/**
 * Local dev: Start Telegram bot in polling mode
 * Run: node --env-file=.env.local scripts/telegram-poll.mjs
 *
 * This polls Telegram for updates instead of requiring a webhook.
 * Use this for local development. For production, use the webhook endpoint.
 */

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

// Tools — must match actual /api/tools/* routes
const TOOLS = [
  {
    name: 'check_email',
    description: 'Check and summarize emails from Gmail inbox',
    parameters: { count: { type: 'number', description: 'Number of emails to check' }, filter: { type: 'string', description: 'Filter: unread, important, all' } },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    parameters: { to: { type: 'string', description: 'Recipient email' }, subject: { type: 'string', description: 'Email subject' }, body: { type: 'string', description: 'Email body' } },
  },
  {
    name: 'check_calendar',
    description: 'Check upcoming calendar events from Google Calendar',
    parameters: { days: { type: 'number', description: 'Days to look ahead (default 7)' } },
  },
  {
    name: 'web_search',
    description: 'Search the web in real-time for current events, latest news, prices, weather, live scores, stock prices, or any question needing up-to-date information.',
    parameters: { query: { type: 'string', description: 'Search query' }, search_depth: { type: 'string', description: 'basic or advanced' }, max_results: { type: 'number', description: 'Max results (default 5)' } },
  },
  {
    name: 'wikipedia',
    description: 'Search Wikipedia for detailed information about a topic, person, place, concept, or historical event.',
    parameters: { query: { type: 'string', description: 'Topic to search' }, sentences: { type: 'number', description: 'Sentences in summary (default 4)' } },
  },
  {
    name: 'hacker_news',
    description: 'Get top/trending stories from Hacker News. Use for tech news, startup news, or tech discussions.',
    parameters: { type: { type: 'string', description: 'top, new, best, ask, show' }, count: { type: 'number', description: 'Number of stories (default 5)' } },
  },
  {
    name: 'save_memory',
    description: 'Save important information to persistent memory. Use when Dhruv tells you about a client, preference, decision, or important detail.',
    parameters: { topic: { type: 'string', description: 'Short topic/name' }, content: { type: 'string', description: 'Detailed info to remember' }, type: { type: 'string', description: 'client, fact, preference, decision, or task' }, importance: { type: 'string', description: 'low, medium, or high' } },
  },
  {
    name: 'recall_memory',
    description: 'Search your memory for previously saved information.',
    parameters: { query: { type: 'string', description: 'Search query' }, type: { type: 'string', description: 'Optional filter: client, fact, preference, decision, task' } },
  },
  {
    name: 'manage_task',
    description: 'Create, update, or list tasks. Use when Dhruv mentions tasks, to-dos, or work items.',
    parameters: { action: { type: 'string', description: 'create, update, or list' }, title: { type: 'string', description: 'Task title' }, description: { type: 'string', description: 'Task details' }, priority: { type: 'string', description: 'low, medium, or high' }, status: { type: 'string', description: 'pending, in_progress, completed, or archived' } },
  },
  {
    name: 'call_dhruv',
    description: 'Call Dhruv on his phone. Default mode is "remind" (one-way TTS call).',
    parameters: { message: { type: 'string', description: 'Message to speak on the call' }, call_type: { type: 'string', description: 'reminder, motivation, task_update, alert, or general' }, mode: { type: 'string', description: 'remind (default) or talk (2-way AI)' } },
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

// Text messages
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

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
});

bot.catch((err) => console.error('[Bot Error]', err));

// Delete any existing webhook before polling
await bot.api.deleteWebhook();

console.log(`\n🤖 Angelina Telegram Bot started (polling mode)`);
console.log(`   Bot: @Aiangelina_bot`);
console.log(`   Server: ${BASE_URL}`);
console.log(`   Auth: ${allowedUsers.size > 0 ? `${allowedUsers.size} allowed users` : 'open (dev mode)'}`);
console.log(`\n   Send a message to @Aiangelina_bot on Telegram!\n`);

bot.start();
