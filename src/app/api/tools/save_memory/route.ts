/**
 * Save Memory Tool - Allows Angelina to save important information
 * Persists to memory-data.json (survives restarts)
 */

import { NextResponse } from 'next/server';
import { memory } from '@/lib/memory';

export async function POST(request: Request) {
  try {
    const { topic, content, type, importance } = await request.json();

    if (!topic || !content) {
      return NextResponse.json({ error: 'Topic and content required' }, { status: 400 });
    }

    const memType = type || 'fact';
    const memImportance = importance || 'medium';

    let entry;
    switch (memType) {
      case 'client':
        entry = await memory.rememberClient(topic, content);
        break;
      case 'preference':
        entry = await memory.rememberPreference(topic, content);
        break;
      case 'decision':
        entry = await memory.rememberDecision(topic, content);
        break;
      case 'task':
        entry = await memory.rememberTask(topic, content);
        break;
      default:
        entry = await memory.rememberFact(topic, content, memImportance);
        break;
    }

    console.log(`[Memory] Saved via tool: ${memType} - ${topic}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${memType}: "${topic}"`,
      id: entry.id,
    });
  } catch (error) {
    console.error('[Memory] Save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save memory' },
      { status: 500 }
    );
  }
}
