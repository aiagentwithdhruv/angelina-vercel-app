/**
 * Memory API
 * Store and retrieve Angelina's memories
 */

import { NextResponse } from "next/server";
import { memory } from "@/lib/memory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type');

  try {
    if (query) {
      // Search memory
      const context = await memory.getRelevantContext(query);
      return NextResponse.json({ context });
    }

    if (type) {
      // Get by type
      const entries = await memory.shortTerm.getByType(type as 'conversation' | 'fact' | 'preference' | 'task' | 'decision' | 'client');
      return NextResponse.json({ entries });
    }

    // Get recent entries
    const recent = await memory.shortTerm.getRecent(20);
    const important = await memory.shortTerm.getHighImportance();
    
    return NextResponse.json({ recent, important });
  } catch (error) {
    console.error("[Memory API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Memory error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, topic, content, importance, role, message } = await request.json();

    switch (action) {
      case 'remember':
        if (!topic || !content) {
          return NextResponse.json({ error: "topic and content required" }, { status: 400 });
        }
        const entry = await memory.rememberFact(topic, content, importance || 'medium');
        return NextResponse.json({ entry });

      case 'preference':
        if (!topic || !content) {
          return NextResponse.json({ error: "topic and content required" }, { status: 400 });
        }
        const pref = await memory.rememberPreference(topic, content);
        return NextResponse.json({ entry: pref });

      case 'decision':
        if (!topic || !content) {
          return NextResponse.json({ error: "topic and content required" }, { status: 400 });
        }
        const decision = await memory.rememberDecision(topic, content);
        return NextResponse.json({ entry: decision });

      case 'task':
        if (!content) {
          return NextResponse.json({ error: "content required" }, { status: 400 });
        }
        const task = await memory.rememberTask(content, topic || '');
        return NextResponse.json({ entry: task });

      case 'message':
        if (!role || !message) {
          return NextResponse.json({ error: "role and message required" }, { status: 400 });
        }
        memory.addMessage(role, message);
        return NextResponse.json({ success: true });

      case 'sync':
        await memory.syncToLongTerm();
        return NextResponse.json({ success: true, message: "Synced to GitHub" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Memory API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Memory error" },
      { status: 500 }
    );
  }
}
