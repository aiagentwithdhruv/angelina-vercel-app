import { getPgPool } from './db';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview?: string; // first user message preview
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tool_used?: string;
  created_at: string;
}

// List all conversations (newest first)
export async function listConversations(limit = 50): Promise<Conversation[]> {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.created_at, c.updated_at,
            (SELECT content FROM conversation_messages
             WHERE conversation_id = c.id AND role = 'user'
             ORDER BY created_at ASC LIMIT 1) AS preview
     FROM conversations c
     ORDER BY c.updated_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

// Create a new conversation
export async function createConversation(title = 'New chat'): Promise<Conversation> {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `INSERT INTO conversations (title) VALUES ($1) RETURNING *`,
    [title]
  );
  return rows[0];
}

// Get a conversation by ID
export async function getConversation(id: string): Promise<Conversation | null> {
  const pool = getPgPool();
  const { rows } = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [id]);
  return rows[0] || null;
}

// Update conversation title
export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2`,
    [title, id]
  );
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<void> {
  const pool = getPgPool();
  await pool.query(`DELETE FROM conversations WHERE id = $1`, [id]);
}

// Load messages for a conversation
export async function loadMessages(conversationId: string): Promise<ConversationMessage[]> {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT * FROM conversation_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return rows;
}

// Save a message to a conversation
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  model?: string,
  toolUsed?: string,
): Promise<ConversationMessage> {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `INSERT INTO conversation_messages (conversation_id, role, content, model, tool_used)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [conversationId, role, content, model || null, toolUsed || null]
  );
  // Touch conversation updated_at
  await pool.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
  return rows[0];
}

// Auto-title a conversation from first user message
export async function autoTitle(conversationId: string, firstMessage: string): Promise<void> {
  const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
  await updateConversationTitle(conversationId, title);
}
