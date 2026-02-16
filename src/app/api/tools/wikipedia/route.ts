/**
 * Wikipedia Search API
 * Free - no API key needed
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, sentences } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Search for matching articles
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    const searchResults = searchData.query?.search || [];

    if (searchResults.length === 0) {
      return NextResponse.json({ summary: `No Wikipedia articles found for "${query}".`, results: [] });
    }

    // Get summary of the top result
    const topTitle = searchResults[0].title;
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`
    );
    const summaryData = await summaryRes.json();

    // Get extracts for top results
    const pageIds = searchResults.map((r: any) => r.pageid).join('|');
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts&exintro=true&explaintext=true&exsentences=${sentences || 4}&format=json&origin=*`
    );
    const extractData = await extractRes.json();
    const pages = extractData.query?.pages || {};

    const results = searchResults.map((r: any) => ({
      title: r.title,
      snippet: pages[r.pageid]?.extract || r.snippet?.replace(/<[^>]*>/g, ''),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
    }));

    return NextResponse.json({
      summary: summaryData.extract || results[0]?.snippet || 'No summary available.',
      thumbnail: summaryData.thumbnail?.source || null,
      url: summaryData.content_urls?.desktop?.page || results[0]?.url,
      results,
      query,
    });
  } catch (error) {
    console.error('[Wikipedia] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Wikipedia search failed' },
      { status: 500 }
    );
  }
}
