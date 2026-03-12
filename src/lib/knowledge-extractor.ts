/**
 * Extract entities from conversation and save to knowledge graph.
 * Uses Gemini Flash via OpenRouter for cheap extraction (~$0.001/call).
 */

import type { NodeType } from '@/lib/knowledge-repository';
import { upsertNode, addEdge } from '@/lib/knowledge-repository';

const EXTRACT_MODEL = 'google/gemini-2.0-flash-exp';

interface ExtractedEntity {
  type: NodeType;
  title: string;
  metadata?: Record<string, unknown>;
}

export async function extractAndSaveEntities(
  userId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !userId) return;

  const text = `User: ${userMessage}\n\nAssistant: ${assistantResponse}`.slice(0, 4000);
  const prompt = `Extract entities from this conversation. Return a JSON array of objects. Each object: {"type": "...", "title": "..."}. Types must be exactly one of: person, project, company, decision, idea, tool, goal, place. Only extract clearly mentioned, specific entities (names, projects, companies, decisions). Return only the JSON array, no other text.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        messages: [{ role: 'user', content: prompt + '\n\n' + text }],
        max_tokens: 500,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return;
    const jsonStr = content.replace(/^```json?\s*|\s*```$/g, '').trim();
    const entities = JSON.parse(jsonStr) as ExtractedEntity[];
    if (!Array.isArray(entities) || entities.length === 0) return;

    const validTypes: NodeType[] = ['person', 'project', 'company', 'decision', 'idea', 'tool', 'goal', 'place'];
    const nodes: { id: string; type: NodeType; title: string }[] = [];
    for (const e of entities) {
      if (!e.title || typeof e.title !== 'string') continue;
      const type = validTypes.includes(e.type as NodeType) ? (e.type as NodeType) : 'idea';
      const node = await upsertNode(userId, type, e.title.slice(0, 500), null, e.metadata || {});
      nodes.push({ id: node.id, type, title: node.title });
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].id !== nodes[j].id) {
          await addEdge(userId, nodes[i].id, nodes[j].id, 'mentioned_with', null).catch(() => {});
        }
      }
    }
  } catch {
    // Fire-and-forget; do not throw
  }
}

const ENTITY_TYPES = ['person', 'project', 'company', 'decision', 'idea', 'tool', 'goal', 'place'] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

interface ExtractFromTranscriptResult {
  summary: string;
  entities: { type: EntityType; title: string }[];
}

/**
 * Extract entities and a 1–2 sentence summary from a single transcript (e.g. voice recording).
 * Used by "keep this record" flow. Saves to knowledge graph and returns summary + entity list.
 */
export async function extractFromTranscript(
  userId: string,
  transcript: string,
): Promise<ExtractFromTranscriptResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !userId || !transcript?.trim()) return null;

  const text = transcript.trim().slice(0, 8000);
  const prompt = `From this transcript (monologue or conversation), extract:
1. A JSON array of entities. Each object: {"type": "...", "title": "..."}. Types must be exactly one of: person, project, company, decision, idea, tool, goal, place. Only clearly mentioned, specific items.
2. A single "summary" string: one or two short sentences summarizing what was said.

Return valid JSON only, in this exact shape: {"entities": [...], "summary": "..."}. No other text.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        messages: [{ role: 'user', content: prompt + '\n\nTranscript:\n' + text }],
        max_tokens: 600,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    const jsonStr = content.replace(/^```json?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(jsonStr) as { entities?: { type: string; title: string }[]; summary?: string };
    const entities = Array.isArray(parsed.entities) ? parsed.entities : [];
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : 'Voice recording summarized.';

    const validTypes: EntityType[] = [...ENTITY_TYPES];
    const nodes: { id: string; type: EntityType; title: string }[] = [];

    for (const e of entities) {
      if (!e?.title || typeof e.title !== 'string') continue;
      const type = validTypes.includes(e.type as EntityType) ? (e.type as EntityType) : 'idea';
      const node = await upsertNode(userId, type, e.title.slice(0, 500), null, {});
      nodes.push({ id: node.id, type, title: node.title });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].id !== nodes[j].id) {
          await addEdge(userId, nodes[i].id, nodes[j].id, 'mentioned_with', null).catch(() => {});
        }
      }
    }

    await upsertNode(userId, 'note', 'Voice record', summary, { source: 'voice_record' });

    return {
      summary,
      entities: nodes.map((n) => ({ type: n.type, title: n.title })),
    };
  } catch {
    return null;
  }
}

/**
 * Extract summary + entities from transcript without saving to the knowledge graph.
 * Used when user is not signed in — they still get a preview.
 */
export async function extractOnlyFromTranscript(
  transcript: string,
): Promise<ExtractFromTranscriptResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !transcript?.trim()) return null;

  const text = transcript.trim().slice(0, 8000);
  const prompt = `From this transcript (monologue or conversation), extract:
1. A JSON array of entities. Each object: {"type": "...", "title": "..."}. Types must be exactly one of: person, project, company, decision, idea, tool, goal, place. Only clearly mentioned, specific items.
2. A single "summary" string: one or two short sentences summarizing what was said.

Return valid JSON only, in this exact shape: {"entities": [...], "summary": "..."}. No other text.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        messages: [{ role: 'user', content: prompt + '\n\nTranscript:\n' + text }],
        max_tokens: 600,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    const jsonStr = content.replace(/^```json?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(jsonStr) as { entities?: { type: string; title: string }[]; summary?: string };
    const entities = Array.isArray(parsed.entities) ? parsed.entities : [];
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : 'Voice recording summarized.';

    const validTypes: EntityType[] = [...ENTITY_TYPES];
    const result: { type: EntityType; title: string }[] = [];
    for (const e of entities) {
      if (!e?.title || typeof e.title !== 'string') continue;
      const type = validTypes.includes(e.type as EntityType) ? (e.type as EntityType) : 'idea';
      result.push({ type, title: e.title.slice(0, 500) });
    }
    return { summary, entities: result };
  } catch {
    return null;
  }
}
