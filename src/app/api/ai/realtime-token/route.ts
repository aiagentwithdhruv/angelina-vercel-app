/**
 * Angelina AI - Realtime Token API
 * 
 * Generates ephemeral tokens for OpenAI Realtime API connections.
 * Includes Angelina's full personality and context about Dhruv.
 */

import { NextResponse } from "next/server";
import { ANGELINA_SYSTEM_PROMPT } from "@/lib/angelina-context";

// Default + allowed voice models
const DEFAULT_REALTIME_MODEL = "gpt-4o-mini-realtime-preview-2024-12-17";
const ALLOWED_VOICE_MODELS = [
  "gpt-4o-realtime-preview-2024-12-17",
  "gpt-4o-mini-realtime-preview-2024-12-17",
];

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  if (apiKey.startsWith('sk-ant-')) {
    return NextResponse.json(
      { error: "Invalid OpenAI API key. You're using a Claude API key." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    // Voice options: shimmer (warm female), coral (friendly)
    const voice = body.voice || "shimmer";

    // Validate requested model against allowlist
    const REALTIME_MODEL = ALLOWED_VOICE_MODELS.includes(body.model)
      ? body.model
      : DEFAULT_REALTIME_MODEL;

    // Use Angelina's full personality + any additional context
    const additionalContext = body.instructions || "";
    const instructions = additionalContext 
      ? `${ANGELINA_SYSTEM_PROMPT}\n\n--- ADDITIONAL CONTEXT ---\n${additionalContext}`
      : ANGELINA_SYSTEM_PROMPT;

    // Tool definitions for Realtime API function calling
    // IMPORTANT: Must match the tools defined in page.tsx for text chat
    const realtimeTools = [
      {
        type: "function",
        name: "check_email",
        description: "Check and summarize emails from Dhruv's Gmail inbox. Use when he asks about emails, inbox, or messages.",
        parameters: {
          type: "object",
          properties: {
            count: { type: "number", description: "Number of emails to check (default 5)" },
            filter: { type: "string", enum: ["unread", "important", "all"], description: "Filter type" },
          },
        },
      },
      {
        type: "function",
        name: "check_calendar",
        description: "Check upcoming events from Dhruv's Google Calendar. Use when he asks about calendar, schedule, meetings, or events.",
        parameters: {
          type: "object",
          properties: {
            days: { type: "number", description: "Days to look ahead (default 7)" },
          },
        },
      },
      {
        type: "function",
        name: "send_email",
        description: "Send an email via Dhruv's Gmail. Use when he asks to send, compose, or write an email.",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        type: "function",
        name: "manage_task",
        description: "Create, update, or list tasks. You MUST call this tool whenever Dhruv mentions anything about tasks, to-dos, or work items. Trigger words: add task, create task, new task, to-do, mark as done, complete, show tasks, pending tasks, start working on, build X, need to X. NEVER just respond in text about tasks - ALWAYS call this tool first.",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string", description: "create, update, or list" },
            title: { type: "string", description: "Task title (for create/update)" },
            description: { type: "string", description: "Task details (for create)" },
            priority: { type: "string", description: "low, medium, or high (for create). Client work = high, internal = medium, ideas = low" },
            status: { type: "string", description: "pending, in_progress, completed, or archived (for update)" },
            task_id: { type: "string", description: "Task ID (optional, can use title instead)" },
          },
        },
      },
      {
        type: "function",
        name: "web_search",
        description: "Search the web for information. Use when Dhruv asks to look up, search, or find something online.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
      {
        type: "function",
        name: "save_memory",
        description: "Save important information to persistent memory. Auto-save client details, decisions, preferences, and research findings.",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Short identifier (e.g., Client: John)" },
            content: { type: "string", description: "Detailed info to remember" },
            type: { type: "string", description: "client, fact, preference, decision, or task" },
            importance: { type: "string", description: "high, medium, or low" },
          },
          required: ["topic", "content"],
        },
      },
      {
        type: "function",
        name: "recall_memory",
        description: "Search memory for previously saved information. Use when Dhruv asks 'do you remember', 'what do you know about', or when you need past context.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query (name, topic, keyword)" },
            type: { type: "string", description: "Optional filter: client, fact, preference, decision, task" },
          },
        },
      },
      {
        type: "function",
        name: "call_dhruv",
        description: "Call Dhruv on his phone. Use when he says 'call me', 'remind me', 'phone me', or wants a voice reminder.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Message to speak on the call (under 30 seconds)" },
            call_type: { type: "string", description: "reminder, motivation, task_update, alert, or general" },
            mode: { type: "string", description: "remind (default, one-way) or talk (2-way AI conversation)" },
          },
        },
      },
      {
        type: "function",
        name: "youtube_analytics",
        description: "Get YouTube channel analytics and video performance. Use when Dhruv asks about his YouTube, video stats, subscribers, or content strategy.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    ];

    // Session configuration for OpenAI Realtime API (flat format)
    const sessionConfig = {
      model: REALTIME_MODEL,
      modalities: ["audio", "text"],
      instructions,
      voice,
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
        language: "en"
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 800,
        create_response: true
      },
      tools: realtimeTools,
    };
    
    console.log("[Angelina] Creating session with full Dhruv context, voice:", voice);
    
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: sessionConfig }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Angelina] OpenAI client_secrets error:", response.status, errorData);

      // Fall back to direct API key
      console.log("[Angelina] Falling back to direct API key");
      return NextResponse.json({
        token: apiKey,
        type: "api_key",
        model: REALTIME_MODEL,
        instructions,
        tools: realtimeTools,
      });
    }

    const data = await response.json();
    console.log("[Angelina] ✅ Session created with full personality");

    return NextResponse.json({
      token: data.value || apiKey,
      type: data.value ? "ephemeral" : "api_key",
      expiresAt: data.expires_at,
      model: REALTIME_MODEL,
      sessionConfigured: true,
      voice,
      tools: realtimeTools,
      instructions,
    });

  } catch (error) {
    console.error("[Angelina] Error:", error);
    return NextResponse.json({
      token: apiKey,
      type: "api_key",
      model: DEFAULT_REALTIME_MODEL
    });
  }
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  return NextResponse.json({ status: "ok", model: DEFAULT_REALTIME_MODEL });
}
