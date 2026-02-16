/**
 * Perplexity Search API
 * Real-time web search for Angelina
 */

import { NextResponse } from "next/server";
import { perplexity } from "@/lib/integrations";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const result = await perplexity.search(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
