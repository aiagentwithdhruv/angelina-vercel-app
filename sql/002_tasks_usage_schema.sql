CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);

CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(18, 6) NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  tool_used TEXT,
  endpoint TEXT NOT NULL,
  routing_reason TEXT,
  estimated_cost NUMERIC(18, 6)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_ts ON usage_logs (ts DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_provider ON usage_logs (provider);
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint ON usage_logs (endpoint);

