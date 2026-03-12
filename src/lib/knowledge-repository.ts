/**
 * Personal Knowledge Graph — nodes and edges (per user).
 * Requires sql/005_knowledge_graph.sql and Supabase (auth.users).
 */

import { getPgPool } from '@/lib/db';

export type NodeType = 'person' | 'project' | 'company' | 'decision' | 'idea' | 'tool' | 'goal' | 'place' | 'note';

export interface KnowledgeNode {
  id: string;
  user_id: string;
  type: NodeType;
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
  mention_count: number;
  first_seen: string;
  last_seen: string;
  created_at: string;
}

export interface KnowledgeEdge {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relation: string;
  strength: number;
  context: string | null;
  created_at: string;
}

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export async function upsertNode(
  userId: string,
  type: NodeType,
  title: string,
  content?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<KnowledgeNode> {
  const pool = getPgPool();
  const normalizedTitle = title.trim().slice(0, 500);
  const { rows: existing } = await pool.query(
    `UPDATE knowledge_nodes SET mention_count = mention_count + 1, last_seen = NOW(), content = COALESCE($2, content), metadata = metadata || $3::jsonb
     WHERE user_id = $1 AND type = $4 AND LOWER(TRIM(title)) = LOWER(TRIM($5))
     RETURNING *`,
    [userId, content || null, JSON.stringify(metadata), type, normalizedTitle],
  );
  if (existing.length > 0) return mapNode(existing[0]);
  const { rows: insert } = await pool.query(
    `INSERT INTO knowledge_nodes (user_id, type, title, content, metadata) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
    [userId, type, normalizedTitle, content || null, JSON.stringify(metadata)],
  );
  return mapNode(insert[0]);
}

function mapNode(row: Record<string, unknown>): KnowledgeNode {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as NodeType,
    title: row.title as string,
    content: (row.content as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    mention_count: Number(row.mention_count) || 1,
    first_seen: (row.first_seen as Date)?.toISOString?.() ?? (row.first_seen as string),
    last_seen: (row.last_seen as Date)?.toISOString?.() ?? (row.last_seen as string),
    created_at: (row.created_at as Date)?.toISOString?.() ?? (row.created_at as string),
  };
}

function mapEdge(row: Record<string, unknown>): KnowledgeEdge {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    source_id: row.source_id as string,
    target_id: row.target_id as string,
    relation: row.relation as string,
    strength: Number(row.strength) ?? 1,
    context: (row.context as string) ?? null,
    created_at: (row.created_at as Date)?.toISOString?.() ?? (row.created_at as string),
  };
}

export async function addEdge(
  userId: string,
  sourceId: string,
  targetId: string,
  relation: string,
  context?: string | null,
): Promise<KnowledgeEdge> {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `
    INSERT INTO knowledge_edges (user_id, source_id, target_id, relation, strength, context)
    VALUES ($1, $2, $3, $4, 1, $5)
    ON CONFLICT (user_id, source_id, target_id, relation) DO UPDATE SET strength = knowledge_edges.strength + 0.5, context = COALESCE(EXCLUDED.context, knowledge_edges.context)
    RETURNING *
    `,
    [userId, sourceId, targetId, relation, context || null],
  );
  return mapEdge(rows[0]);
}

export async function getGraph(userId: string, limit = 200): Promise<GraphData> {
  const pool = getPgPool();
  const [nodesRes, edgesRes] = await Promise.all([
    pool.query(`SELECT * FROM knowledge_nodes WHERE user_id = $1 ORDER BY last_seen DESC LIMIT $2`, [userId, limit]),
    pool.query(`SELECT * FROM knowledge_edges WHERE user_id = $1`, [userId]),
  ]);
  return {
    nodes: nodesRes.rows.map(mapNode),
    edges: edgesRes.rows.map(mapEdge),
  };
}

export async function getSubgraph(userId: string, nodeId: string, depth = 2): Promise<GraphData> {
  const pool = getPgPool();
  const nodeIds = new Set<string>([nodeId]);
  let current = [nodeId];
  for (let d = 0; d < depth; d++) {
    const { rows } = await pool.query(
      `SELECT source_id, target_id FROM knowledge_edges WHERE user_id = $1 AND (source_id = ANY($2::uuid[]) OR target_id = ANY($2::uuid[]))`,
      [userId, current],
    );
    current = [];
    for (const r of rows) {
      if (!nodeIds.has(r.source_id)) { nodeIds.add(r.source_id); current.push(r.source_id); }
      if (!nodeIds.has(r.target_id)) { nodeIds.add(r.target_id); current.push(r.target_id); }
    }
    if (current.length === 0) break;
  }
  const { rows: nodeRows } = await pool.query(`SELECT * FROM knowledge_nodes WHERE id = ANY($1::uuid[])`, [Array.from(nodeIds)]);
  const { rows: edgeRows } = await pool.query(
    `SELECT * FROM knowledge_edges WHERE user_id = $1 AND source_id = ANY($2::uuid[]) AND target_id = ANY($2::uuid[])`,
    [userId, Array.from(nodeIds)],
  );
  return { nodes: nodeRows.map(mapNode), edges: edgeRows.map(mapEdge) };
}

export async function getNodesByType(userId: string, type: NodeType): Promise<KnowledgeNode[]> {
  const pool = getPgPool();
  const { rows } = await pool.query(`SELECT * FROM knowledge_nodes WHERE user_id = $1 AND type = $2 ORDER BY last_seen DESC`, [userId, type]);
  return rows.map(mapNode);
}

export async function deleteNode(userId: string, nodeId: string): Promise<boolean> {
  const pool = getPgPool();
  const result = await pool.query(`DELETE FROM knowledge_nodes WHERE user_id = $1 AND id = $2`, [userId, nodeId]);
  return (result.rowCount ?? 0) > 0;
}
