CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('conversation', 'fact', 'preference', 'task', 'decision', 'client')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries (type);
CREATE INDEX IF NOT EXISTS idx_memory_entries_importance ON memory_entries (importance);
CREATE INDEX IF NOT EXISTS idx_memory_entries_created_at ON memory_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding
  ON memory_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

