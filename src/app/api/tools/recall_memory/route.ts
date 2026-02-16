/**
 * Recall Memory Tool - Allows Angelina to search her memory
 * Searches JSON file-backed memory store
 */

import { NextResponse } from 'next/server';
import { memory } from '@/lib/memory';

export async function POST(request: Request) {
  try {
    const { query, type } = await request.json();

    let results;

    if (type) {
      // Filter by specific type
      results = await memory.shortTerm.getByType(type as 'conversation' | 'fact' | 'preference' | 'task' | 'decision' | 'client');
    } else if (query) {
      // Search by query
      results = await memory.shortTerm.search(query);
    } else {
      // Return all recent memories
      results = await memory.shortTerm.getRecent(20);
    }

    const formatted = results.map(entry => ({
      topic: entry.topic,
      content: entry.content,
      type: entry.type,
      importance: entry.importance,
      date: entry.timestamp,
    }));

    return NextResponse.json({
      count: formatted.length,
      memories: formatted,
      query: query || type || 'recent',
    });
  } catch (error) {
    console.error('[Memory] Recall error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recall memory' },
      { status: 500 }
    );
  }
}
