-- Personal Knowledge Graph: nodes and edges (per user)
-- Requires 004_multi_user (user_id, auth.users). Enable pgvector.

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  mention_count INT DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation VARCHAR(100) NOT NULL,
  strength FLOAT DEFAULT 1.0,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_id, target_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_kn_user ON knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_kn_type ON knowledge_nodes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_kn_embedding ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_ke_user ON knowledge_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_ke_source ON knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_ke_target ON knowledge_edges(target_id);

ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own nodes" ON knowledge_nodes;
CREATE POLICY "Users own nodes" ON knowledge_nodes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own edges" ON knowledge_edges;
CREATE POLICY "Users own edges" ON knowledge_edges FOR ALL USING (auth.uid() = user_id);
