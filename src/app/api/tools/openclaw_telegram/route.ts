/**
 * OpenClaw → Telegram Tool
 *
 * Angelina delegates messages through OpenClaw's Telegram bot.
 * Sends to Dhruv's Telegram chat via OpenClaw's bot identity,
 * so the message appears in the OpenClaw channel.
 *
 * Flow: Angelina (decides what to send) → OpenClaw bot (sends to Telegram)
 *
 * Env:
 *   OPENCLAW_BOT_TOKEN — OpenClaw's Telegram bot token (@dclawdbot_bot)
 *   TELEGRAM_CHAT_ID   — Dhruv's Telegram chat ID
 *
 * Optionally also tries VPS execution first if OPENCLAW_VPS_URL is set.
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

async function pushViaOpenClaw(text: string): Promise<boolean> {
  const botToken = process.env.OPENCLAW_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { command, agent, message, notify_message } = await request.json();

      // "message" = direct text to send via OpenClaw bot
      // "command" = instruction for VPS (optional VPS execution + Telegram)
      const textToSend = message || notify_message || command;

      if (!textToSend) {
        return NextResponse.json({
          success: false,
          error: 'Provide "message" (text to send via OpenClaw) or "command" (VPS instruction).',
        });
      }

      if (!process.env.OPENCLAW_BOT_TOKEN) {
        return NextResponse.json({
          success: false,
          error: 'OPENCLAW_BOT_TOKEN not configured. Add OpenClaw Telegram bot token.',
        });
      }

      // ── Step 1: Try VPS execution if command + VPS URL available ──
      let vpsResult: string | null = null;
      const vpsUrl = process.env.OPENCLAW_VPS_URL;
      const workerKey = process.env.WORKER_API_KEY;

      if (command && vpsUrl && workerKey) {
        const agentPrefix = agent ? `[Agent: ${agent}] ` : '';
        const endpoint = `${vpsUrl.replace(/\/$/, '')}/v1/chat/completions`;
        console.log(`[OpenClaw→Telegram] Trying VPS at ${endpoint}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${workerKey}`,
            },
            body: JSON.stringify({
              model: agent || 'default',
              messages: [{ role: 'user', content: `${agentPrefix}${command}` }],
            }),
            signal: controller.signal,
          });

          if (res.ok) {
            const data = await res.json();
            vpsResult =
              data.choices?.[0]?.message?.content ||
              data.response ||
              data.output ||
              JSON.stringify(data);
          }
        } catch {
          // VPS unavailable — proceed with direct Telegram send
        } finally {
          clearTimeout(timeout);
        }
      }

      // ── Step 2: Send via OpenClaw's Telegram bot ──
      let telegramText: string;
      if (vpsResult) {
        // VPS executed — send the result
        telegramText = notify_message
          ? `${notify_message}\n\n${vpsResult.slice(0, 3500)}`
          : `*OpenClaw Report*\n\n*Task:* ${command?.slice(0, 200)}\n*Agent:* ${agent || 'default'}\n\n${vpsResult.slice(0, 3500)}`;
      } else if (message) {
        // Direct message from Angelina via OpenClaw bot
        telegramText = message;
      } else {
        // Command provided but VPS didn't execute — send the instruction as-is
        telegramText = notify_message
          ? notify_message
          : `*From Angelina*\n\n${textToSend.slice(0, 3800)}`;
      }

      const sent = await pushViaOpenClaw(telegramText);

      console.log(`[OpenClaw→Telegram] Telegram ${sent ? 'sent' : 'failed'} | VPS ${vpsResult ? 'executed' : 'skipped'}`);

      return NextResponse.json({
        success: true,
        telegram_sent: sent,
        vps_executed: !!vpsResult,
        agent: agent || 'default',
      });
    } catch (error) {
      console.error('[OpenClaw→Telegram] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'OpenClaw→Telegram failed',
      });
    }
  }, 'openclaw_telegram');
}
