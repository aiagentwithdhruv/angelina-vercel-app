-- Multi-user support: profiles, user_id on all tables, RLS
-- Run after 001, 002, 003. Supabase Auth uses auth.users(id).

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. Add user_id to existing tables (nullable for migration; backfill then set NOT NULL if desired)
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- conversation_messages inherit via conversation_id

CREATE INDEX IF NOT EXISTS idx_memory_entries_user ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- 3. RLS (when user_id is NULL, allow for backward compat; restrict when set)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own profile" ON profiles;
CREATE POLICY "Users own profile" ON profiles FOR ALL USING (auth.uid() = id);

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

-- conversation_messages: allow via conversation ownership
DROP POLICY IF EXISTS "Users own conv messages" ON conversation_messages;
CREATE POLICY "Users own conv messages" ON conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_messages.conversation_id
      AND (c.user_id IS NULL OR c.user_id = auth.uid())
    )
  );

-- Trigger: create profile on signup (Supabase Auth hook or trigger)
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
