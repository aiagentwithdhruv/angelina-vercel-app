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

import { withToolRetry } from '@/lib/tool-retry';
import { apiSuccess, apiError } from '@/lib/api-response';

const EURI_BASE_URL = 'https://api.euron.one/api/v1/euri';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { input, model } = await request.json();

      if (!input) {
        return apiError('MISSING_PARAM', 'input is required. Provide text or array of texts to embed.', 400);
      }

      const euriKey = process.env.EURI_API_KEY;
      if (!euriKey) {
        return apiError('MISSING_CONFIG', 'EURI_API_KEY not configured.', 500);
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
        return apiError('PROVIDER_ERROR', `Euri embeddings returned ${response.status}`, response.status, errorText.slice(0, 300));
      }

      const data = await response.json();

      console.log(`[Embeddings] Success | vectors=${data.data?.length || 0} | dims=${data.data?.[0]?.embedding?.length || 0}`);

      return apiSuccess({
        embeddings: data.data,
        model: embeddingModel,
        usage: data.usage,
        provider: 'euri',
      });
    } catch (error) {
      console.error('[Embeddings] Error:', error);
      return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Embedding generation failed');
    }
  }, 'generate_embeddings');
}
