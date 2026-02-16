export interface EmbeddingOptions {
  model?: string;
}

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(
  input: string,
  options: EmbeddingOptions = {},
): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !input.trim()) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Embedding request failed: ${response.status} ${message}`);
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding as number[] | undefined;
  return Array.isArray(embedding) ? embedding : null;
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

