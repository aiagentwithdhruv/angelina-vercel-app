-- Angelina Autonomous Core — Database Migration
-- Run this against your Supabase/Postgres instance
-- This creates the tables that make Angelina truly autonomous

-- 1. Autonomous Goals (replaces file-based goals-store)
CREATE TABLE IF NOT EXISTS autonomous_goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  deadline TIMESTAMPTZ,
  source TEXT DEFAULT 'user', -- 'user', 'self-initiated', 'cron', 'a2a'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Autonomous Task Queue (the heart of autonomy)
CREATE TABLE IF NOT EXISTS task_queue (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES autonomous_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tool_name TEXT, -- which tool to call (e.g., 'web_search', 'send_email', 'obsidian_vault')
  tool_args JSONB DEFAULT '{}', -- arguments to pass to the tool
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1=highest
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 2,
  depends_on TEXT, -- task_id this depends on (simple chain)
  scheduled_for TIMESTAMPTZ DEFAULT NOW(), -- when to execute (allows future scheduling)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB, -- outcome of execution
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Outcome Log (every autonomous action tracked for learning)
CREATE TABLE IF NOT EXISTS outcome_log (
  id SERIAL PRIMARY KEY,
  task_id TEXT REFERENCES task_queue(id) ON DELETE SET NULL,
  goal_id TEXT REFERENCES autonomous_goals(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- what was done
  tool_name TEXT,
  tool_args JSONB,
  result JSONB,
  success BOOLEAN DEFAULT true,
  duration_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  notes TEXT, -- AI-generated reflection on this outcome
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Self-Reflection Log (weekly analysis)
CREATE TABLE IF NOT EXISTS reflections (
  id SERIAL PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10, 4) DEFAULT 0,
  insights TEXT, -- AI-generated insights
  strategy_adjustments TEXT, -- what to change going forward
  top_successes JSONB, -- [{action, result}]
  top_failures JSONB, -- [{action, error}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event Triggers (self-initiation rules)
CREATE TABLE IF NOT EXISTS event_triggers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('schedule', 'threshold', 'pattern', 'webhook')),
  condition_config JSONB NOT NULL, -- e.g., {"cron": "0 9 * * 1"} or {"metric": "overdue_tasks", "threshold": 3}
  action_type TEXT NOT NULL, -- 'create_task', 'send_notification', 'call_tool'
  action_config JSONB NOT NULL, -- tool_name + args, or notification template
  enabled BOOLEAN DEFAULT true,
  last_fired TIMESTAMPTZ,
  fire_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_task_queue_scheduled ON task_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_task_queue_goal ON task_queue(goal_id);
CREATE INDEX IF NOT EXISTS idx_outcome_log_created ON outcome_log(created_at);
CREATE INDEX IF NOT EXISTS idx_outcome_log_task ON outcome_log(task_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_goals_status ON autonomous_goals(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_event_triggers_enabled ON event_triggers(enabled) WHERE enabled = true;
