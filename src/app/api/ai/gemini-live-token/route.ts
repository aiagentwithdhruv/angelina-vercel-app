/**
 * Angelina AI - Gemini Live Token API
 *
 * Returns Gemini API key + config for Gemini Live (Multimodal Live API).
 * Free tier: 15 RPM, 1500 RPD. Paid: $1/$4 per 1M audio tokens.
 */

import { NextResponse } from "next/server";
import { ANGELINA_VOICE_INSTRUCTIONS } from "@/lib/angelina-context";

const GEMINI_LIVE_MODELS = [
  "gemini-2.0-flash-live-001",
];

// Gemini voices: Zephyr (warm female), Aoede (bright), Kore (firm), Puck (upbeat), Charon (deep)
const GEMINI_VOICES = ["Zephyr", "Aoede", "Kore", "Puck", "Charon", "Fenrir", "Leda", "Orus", "Perseus"];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to env vars." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const voice = GEMINI_VOICES.includes(body.voice) ? body.voice : "Zephyr";
    const model = GEMINI_LIVE_MODELS.includes(body.model)
      ? body.model
      : GEMINI_LIVE_MODELS[0];

    const additionalContext = body.instructions || "";
    const instructions = additionalContext
      ? `${ANGELINA_VOICE_INSTRUCTIONS}\n\n--- ADDITIONAL CONTEXT ---\n${additionalContext}`
      : ANGELINA_VOICE_INSTRUCTIONS;

    // Tool definitions for Gemini function calling
    const tools = [
      {
        name: "check_email",
        description: "Check and summarize emails from Dhruv's Gmail inbox.",
        parameters: {
          type: "object",
          properties: {
            count: { type: "number", description: "Number of emails to check (default 5)" },
            filter: { type: "string", enum: ["unread", "important", "all"] },
          },
        },
      },
      {
        name: "check_calendar",
        description: "Check upcoming events from Dhruv's Google Calendar.",
        parameters: {
          type: "object",
          properties: {
            days: { type: "number", description: "Days to look ahead (default 7)" },
          },
        },
      },
      {
        name: "manage_task",
        description: "Create, update, or list tasks. Call this when Dhruv mentions tasks, to-dos, or work items.",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string", description: "create, update, or list" },
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task details" },
            priority: { type: "string", description: "low, medium, or high" },
            status: { type: "string", description: "pending, in_progress, completed, or archived" },
            task_id: { type: "string", description: "Task ID (optional)" },
          },
        },
      },
      {
        name: "web_search",
        description: "Search the web for information.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
      {
        name: "save_memory",
        description: "Save important information to persistent memory.",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Short identifier" },
            content: { type: "string", description: "Info to remember" },
            type: { type: "string", description: "client, fact, preference, decision, or task" },
          },
          required: ["topic", "content"],
        },
      },
      {
        name: "recall_memory",
        description: "Search memory for previously saved information.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
        },
      },
    ];

    console.log("[Angelina] Gemini Live token request, voice:", voice, "model:", model);

    return NextResponse.json({
      apiKey,
      model: `models/${model}`,
      voice,
      instructions,
      tools,
    });

  } catch (error) {
    console.error("[Angelina] Gemini Live token error:", error);
    return NextResponse.json(
      { error: "Failed to generate Gemini Live config" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }
  return NextResponse.json({ status: "ok", provider: "gemini-live" });
}
