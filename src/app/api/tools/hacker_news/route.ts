/**
 * Hacker News API
 * Free - no API key needed. Fetches top/new/best stories.
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, count, query } = await request.json();

    const storyType = type || 'top'; // top, new, best, ask, show
    const limit = Math.min(count || 5, 15);

    // Get story IDs
    const idsRes = await fetch(`https://hacker-news.firebaseio.com/v0/${storyType}stories.json`);
    const allIds: number[] = await idsRes.json();
    const ids = allIds.slice(0, limit);

    // Fetch each story
    const stories = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await res.json();
        return {
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          score: item.score,
          author: item.by,
          comments: item.descendants || 0,
          time: new Date(item.time * 1000).toISOString(),
          hn_link: `https://news.ycombinator.com/item?id=${item.id}`,
        };
      })
    );

    // If query provided, filter by keyword match
    let filtered = stories;
    if (query) {
      const q = query.toLowerCase();
      filtered = stories.filter(
        (s) => s.title.toLowerCase().includes(q)
      );
      if (filtered.length === 0) {
        // Use Algolia HN search as fallback
        const searchRes = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${limit}`
        );
        const searchData = await searchRes.json();
        filtered = (searchData.hits || []).map((h: any) => ({
          title: h.title || h.story_title,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          score: h.points,
          author: h.author,
          comments: h.num_comments || 0,
          time: h.created_at,
          hn_link: `https://news.ycombinator.com/item?id=${h.objectID}`,
        }));
      }
    }

    return NextResponse.json({
      type: storyType,
      count: filtered.length,
      stories: filtered,
    });
  } catch (error) {
    console.error('[Hacker News] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hacker News fetch failed' },
      { status: 500 }
    );
  }
}
