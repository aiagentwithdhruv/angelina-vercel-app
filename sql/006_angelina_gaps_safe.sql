-- Angelina: fill gaps only (safe to run if you already have some tables)
-- Run this if you already have knowledge_nodes / conversations / etc. but want to ensure
-- knowledge_edges, RLS, user_id columns, and trigger exist. Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- 1. pgvector (required for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. knowledge_edges (often missing when only knowledge_nodes was created)
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

CREATE INDEX IF NOT EXISTS idx_ke_user ON knowledge_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_ke_source ON knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_ke_target ON knowledge_edges(target_id);

-- 3. RLS on knowledge graph (required for multi-user)
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own nodes" ON knowledge_nodes;
CREATE POLICY "Users own nodes" ON knowledge_nodes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own edges" ON knowledge_edges;
CREATE POLICY "Users own edges" ON knowledge_edges FOR ALL USING (auth.uid() = user_id);

-- 4. Index on knowledge_nodes if missing (for embedding search)
CREATE INDEX IF NOT EXISTS idx_kn_user ON knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_kn_type ON knowledge_nodes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_kn_embedding ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. user_id on app tables (if tables exist but columns missing)
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_memory_entries_user ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- 6. profiles + trigger (if not already there)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own profile" ON profiles;
CREATE POLICY "Users own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- RLS on other tables (safe to re-run)
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own memory" ON memory_entries;
CREATE POLICY "Users own memory" ON memory_entries FOR ALL
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own tasks" ON tasks;
CREATE POLICY "Users own tasks" ON tasks FOR ALL
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own usage" ON usage_logs;
CREATE POLICY "Users own usage" ON usage_logs FOR ALL
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own conversations" ON conversations;
CREATE POLICY "Users own conversations" ON conversations FOR ALL
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own conv messages" ON conversation_messages;
CREATE POLICY "Users own conv messages" ON conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_messages.conversation_id
      AND (c.user_id IS NULL OR c.user_id = auth.uid())
    )
  );

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
