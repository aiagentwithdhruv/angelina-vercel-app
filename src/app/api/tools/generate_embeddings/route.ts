/**
 * Generate Embeddings Tool — Euri API
 *
 * Generates vector embeddings for text input.
 * Useful for semantic search, RAG, and memory similarity.
 * Free through Euron.
 *
 * Env:
 *   EURI_API_KEY — Euron API key
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

const EURI_BASE_URL = 'https://api.euron.one/api/v1/euri';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { input, model } = await request.json();

      if (!input) {
        return NextResponse.json({
          success: false,
          error: 'input is required. Provide text or array of texts to embed.',
        });
      }

      const euriKey = process.env.EURI_API_KEY;
      if (!euriKey) {
        return NextResponse.json({
          success: false,
          error: 'EURI_API_KEY not configured.',
        });
      }

      const texts = Array.isArray(input) ? input : [input];
      const embeddingModel = model || 'text-embedding-3-small';

      console.log(`[Embeddings] Euri | model=${embeddingModel} | inputs=${texts.length}`);

      const response = await fetch(`${EURI_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${euriKey}`,
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: texts,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No details');
        console.error(`[Embeddings] Euri returned ${response.status}:`, errorText);
        return NextResponse.json({
          success: false,
          error: `Euri embeddings returned ${response.status}: ${errorText.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      console.log(`[Embeddings] Success | vectors=${data.data?.length || 0} | dims=${data.data?.[0]?.embedding?.length || 0}`);

      return NextResponse.json({
        success: true,
        embeddings: data.data,
        model: embeddingModel,
        usage: data.usage,
        provider: 'euri',
      });
    } catch (error) {
      console.error('[Embeddings] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Embedding generation failed',
      });
    }
  }, 'generate_embeddings');
}
