/**
 * Tavily Web Search API
 * Real-time web search with AI-optimized results
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, search_depth, max_results } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: search_depth || 'basic',
        max_results: max_results || 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Format results for the AI
    const results = (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300),
    }));

    return NextResponse.json({
      answer: data.answer || null,
      results,
      query,
    });
  } catch (error) {
    console.error('[Web Search] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Web search failed' },
      { status: 500 }
    );
  }
}
