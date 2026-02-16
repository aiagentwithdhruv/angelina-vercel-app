/**
 * Angelina AI - Telegram Bot (grammY)
 *
 * Connects Angelina to Telegram so Dhruv can chat from his phone.
 * Uses the same /api/chat backend as the web UI.
 *
 * Features:
 * - Text messages → AI response
 * - Voice messages → Whisper transcription → AI response
 * - /start, /clear, /model commands
 * - Per-user conversation history (in-memory)
 * - Typing indicator while processing
 * - Message splitting for long responses (4096 char Telegram limit)
 * - User allowlist for security
 */

import { Bot, Context, webhookCallback } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';
import { ANGELINA_SYSTEM_PROMPT } from '@/lib/angelina-context';
import { tools } from '@/lib/ai-agent';
import { DEFAULT_TEXT_MODEL, TEXT_MODELS } from '@/lib/models';

// ── Types ──

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UserSession {
  messages: ConversationMessage[];
  model: string;
  lastActivity: number;
}

// ── Config ──

const TELEGRAM_MAX_MSG = 4096;
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Allowed user IDs (comma-separated in env var)
function getAllowedUsers(): Set<number> {
  const raw = process.env.TELEGRAM_ALLOWED_USERS || '';
  if (!raw) return new Set(); // Empty = allow all (for dev)
  return new Set(raw.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean));
}

// ── Per-user session store (in-memory) ──

const sessions = new Map<number, UserSession>();

function getSession(userId: number): UserSession {
  let session = sessions.get(userId);
  if (!session || Date.now() - session.lastActivity > SESSION_TTL) {
    session = {
      messages: [{ role: 'system', content: ANGELINA_SYSTEM_PROMPT }],
      model: DEFAULT_TEXT_MODEL,
      lastActivity: Date.now(),
    };
    sessions.set(userId, session);
  }
  session.lastActivity = Date.now();
  return session;
}

function clearSession(userId: number): void {
  sessions.delete(userId);
}

// ── Telegram message splitting ──

function splitMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_MSG) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= TELEGRAM_MAX_MSG) {
      chunks.push(remaining);
      break;
    }

    // Try to split at paragraph boundary
    let splitIdx = remaining.lastIndexOf('\n\n', TELEGRAM_MAX_MSG);
    if (splitIdx < TELEGRAM_MAX_MSG * 0.3) {
      // If no good paragraph break, try single newline
      splitIdx = remaining.lastIndexOf('\n', TELEGRAM_MAX_MSG);
    }
    if (splitIdx < TELEGRAM_MAX_MSG * 0.3) {
      // Last resort: split at space
      splitIdx = remaining.lastIndexOf(' ', TELEGRAM_MAX_MSG);
    }
    if (splitIdx < 1) {
      splitIdx = TELEGRAM_MAX_MSG;
    }

    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return chunks;
}

// ── Call internal chat API ──

async function callAngelinaChat(
  messages: ConversationMessage[],
  model: string,
  source: string = 'telegram',
): Promise<{ response?: string; toolCalls?: any[]; model?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        tools: Object.values(tools),
        model,
        source,
      }),
    });

    const data = await res.json();
    if (data.error) return { error: data.error };
    return data;
  } catch (err: any) {
    console.error('[Telegram] Chat API call failed:', err?.message);
    return { error: err?.message || 'Failed to reach Angelina' };
  }
}

// ── Execute tool and get follow-up response ──

async function executeTool(toolName: string, args: any): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/api/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    return await res.json();
  } catch (err: any) {
    return { error: err?.message || 'Tool execution failed' };
  }
}

// ── Transcribe voice with Whisper ──

async function transcribeVoice(fileUrl: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    // Download the voice file from Telegram
    const fileRes = await fetch(fileUrl);
    const fileBuffer = await fileRes.arrayBuffer();

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: 'audio/ogg' }), 'voice.ogg');
    formData.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    return data.text || null;
  } catch (err: any) {
    console.error('[Telegram] Whisper transcription failed:', err?.message);
    return null;
  }
}

// ── Process a user message through Angelina ──

async function processMessage(ctx: Context, text: string): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);
  session.messages.push({ role: 'user', content: text });

  // Show typing indicator
  await ctx.replyWithChatAction('typing');
  const typingInterval = setInterval(() => {
    ctx.replyWithChatAction('typing').catch(() => {});
  }, 4000);

  try {
    const result = await callAngelinaChat(session.messages, session.model);

    if (result.error) {
      clearInterval(typingInterval);
      await ctx.reply(`Something went wrong: ${result.error}`);
      return;
    }

    // Handle tool calls
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolResults = [];
      for (const tc of result.toolCalls) {
        const toolResult = await executeTool(tc.name, tc.arguments);
        toolResults.push({ tool: tc.name, args: tc.arguments, result: toolResult });
      }

      // Get follow-up response with tool results
      session.messages.push({
        role: 'assistant',
        content: `[Used tools: ${toolResults.map(t => t.tool).join(', ')}]`,
      });
      session.messages.push({
        role: 'user',
        content: `Tool results: ${JSON.stringify(toolResults)}. Summarize these results naturally.`,
      });

      const followUp = await callAngelinaChat(session.messages, session.model);
      const responseText = followUp.response || 'Done!';

      session.messages.push({ role: 'assistant', content: responseText });

      clearInterval(typingInterval);
      const chunks = splitMessage(responseText);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'Markdown' }).catch(() => {
          // Fallback: send without markdown if parsing fails
          ctx.reply(chunk);
        });
      }
      return;
    }

    // Regular text response
    const responseText = result.response || "I'm not sure how to respond to that.";
    session.messages.push({ role: 'assistant', content: responseText });

    clearInterval(typingInterval);
    const chunks = splitMessage(responseText);
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: 'Markdown' }).catch(() => {
        ctx.reply(chunk);
      });
    }

    // Trim conversation if it gets too long (keep system + last 40 messages)
    if (session.messages.length > 42) {
      session.messages = [
        session.messages[0], // system prompt
        ...session.messages.slice(-40),
      ];
    }
  } catch (err: any) {
    clearInterval(typingInterval);
    console.error('[Telegram] Error processing message:', err);
    await ctx.reply('Something went wrong. Please try again.');
  }
}

// ── Bot factory ──

let bot: Bot | null = null;

export function getBot(): Bot {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  bot = new Bot(token);

  // Auto-retry on Telegram API rate limits
  bot.api.config.use(autoRetry());

  // ── Auth middleware: check allowed users ──
  bot.use(async (ctx, next) => {
    const allowedUsers = getAllowedUsers();
    const userId = ctx.from?.id;

    // If allowlist is empty, allow all (dev mode)
    if (allowedUsers.size > 0 && userId && !allowedUsers.has(userId)) {
      console.log(`[Telegram] Unauthorized user: ${userId} (${ctx.from?.username})`);
      await ctx.reply('Sorry, you are not authorized to use this bot.');
      return;
    }

    await next();
  });

  // ── Commands ──

  bot.command('start', async (ctx) => {
    const name = ctx.from?.first_name || 'there';
    await ctx.reply(
      `Hey ${name}! I'm Angelina, Dhruv's AI companion.\n\n` +
      `Just send me a message and I'll help you out!\n\n` +
      `Commands:\n` +
      `/clear - Clear conversation history\n` +
      `/model - Show or switch AI model\n` +
      `/status - Check bot status`
    );
  });

  bot.command('clear', async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) clearSession(userId);
    await ctx.reply('Conversation cleared! Starting fresh.');
  });

  bot.command('model', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = getSession(userId);
    const args = ctx.match?.trim();

    if (!args) {
      const currentModel = TEXT_MODELS.find(m => m.id === session.model);
      const groups: Record<string, typeof TEXT_MODELS> = {};
      for (const m of TEXT_MODELS) {
        const g = m.provider;
        if (!groups[g]) groups[g] = [];
        groups[g].push(m);
      }
      const labels: Record<string, string> = {
        openai: '🟢 OpenAI', anthropic: '🟣 Claude', google: '🔵 Gemini',
        openrouter: '🌐 OpenRouter', moonshot: '🌙 Moonshot/Kimi',
        groq: '⚡ Groq', perplexity: '🔍 Perplexity',
      };
      const lines: string[] = [`Current: ${currentModel?.label || session.model}\n`];
      for (const [provider, models] of Object.entries(groups)) {
        lines.push(`${labels[provider] || provider}:`);
        for (const m of models) {
          const marker = m.id === session.model ? '▸ ' : '  ';
          lines.push(`${marker}${m.id} — ${m.label}`);
        }
        lines.push('');
      }
      lines.push('Switch: /model <model-id>');
      lines.push('Example: /model kimi-k2.5');

      await ctx.reply(lines.join('\n'));
      return;
    }

    // Find matching model
    const match = TEXT_MODELS.find(m =>
      m.id === args || m.label.toLowerCase() === args.toLowerCase()
    );

    if (match) {
      session.model = match.id;
      await ctx.reply(`Switched to ${match.label} (${match.description})`);
    } else {
      await ctx.reply(`Model "${args}" not found. Use /model to see available options.`);
    }
  });

  bot.command('status', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = getSession(userId);
    const currentModel = TEXT_MODELS.find(m => m.id === session.model);
    const msgCount = session.messages.length - 1; // Minus system prompt

    await ctx.reply(
      `Angelina Status:\n` +
      `Model: ${currentModel?.label || session.model}\n` +
      `Messages in session: ${msgCount}\n` +
      `Session active: Yes\n` +
      `Connected tools: ${Object.keys(tools).length}`
    );
  });

  // ── Voice messages ──

  bot.on('message:voice', async (ctx) => {
    const voice = ctx.message.voice;
    if (!voice) return;

    await ctx.replyWithChatAction('typing');

    try {
      const file = await ctx.api.getFile(voice.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const transcription = await transcribeVoice(fileUrl);

      if (!transcription) {
        await ctx.reply('Could not transcribe voice message. Please type your message instead.');
        return;
      }

      // Show what was transcribed
      await ctx.reply(`[Voice]: "${transcription}"`, { parse_mode: 'Markdown' }).catch(() => {
        ctx.reply(`[Voice]: "${transcription}"`);
      });

      // Process the transcribed text
      await processMessage(ctx, transcription);
    } catch (err: any) {
      console.error('[Telegram] Voice processing error:', err);
      await ctx.reply('Failed to process voice message.');
    }
  });

  // ── Text messages ──

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (!text || text.startsWith('/')) return; // Skip commands
    await processMessage(ctx, text);
  });

  // ── Error handler ──

  bot.catch((err) => {
    console.error('[Telegram Bot Error]', err);
  });

  console.log('[Telegram] Bot initialized');
  return bot;
}

// Export webhook handler for Next.js
export function getWebhookHandler() {
  return webhookCallback(getBot(), 'std/http');
}
