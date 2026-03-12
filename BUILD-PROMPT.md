# Angelina AI — Master Build Prompt

> Copy this entire file and give it to Claude Code (or any AI coding assistant) in a new session.
> It has full context of the project, what exists, and exactly what to build.

---

## Project Context

You are working on **Angelina AI** — a personal AI operating system built with Next.js 14, React 18, TypeScript, Supabase PostgreSQL + pgvector, and OpenRouter for multi-model AI routing.

**Path:** `/Volumes/Dhruv_SSD/AIwithDhruv/Claude/angelina-vercel-clean/`
**GitHub:** `aiagentwithdhruv/angelina-vercel-app`

Read `CLAUDE.md` in the project root FIRST — it has the complete architecture, file map, design system, and engineering rules.

### Folder Structure:
```
angelina-vercel-clean/          ← THE app (single source of truth)
├── CLAUDE.md                   ← Project context for AI (read this first)
├── BUILD-PROMPT.md             ← This file
├── README.md                   ← Public documentation
├── src/                        ← All source code
│   ├── app/                    ← Next.js pages + API routes
│   ├── lib/                    ← Core systems (48 files)
│   ├── hooks/                  ← React hooks (voice)
│   └── components/             ← UI components
├── sql/                        ← Database migrations
├── docs/                       ← All documentation
│   ├── planning/               ← Original PRD, design system, screen designs
│   ├── JARVIS-ROADMAP.md       ← Feature roadmap
│   ├── AGENTIC-REFERENCE.md    ← Autonomous execution deep dive
│   ├── SCALABILITY.md          ← Scaling path (100→100K users)
│   └── ...                     ← Other reference docs
├── public/                     ← Static assets
└── [config files]              ← package.json, tailwind, next.config, etc.
```

NOTE: There used to be a separate `Angelina AI System/` folder with early planning docs. It has been archived to `Angelina AI System-ARCHIVED/`. All useful docs were moved into `angelina-vercel-clean/docs/planning/`. **Only work in `angelina-vercel-clean/`.**

---

## What Already Exists (DO NOT rebuild these)

The app already has 127 source files, 51+ API routes, 30+ tools, 5 AI agents, and full deployment on Vercel + VPS. Key existing systems:

1. **Chat UI** — `/` page with conversation sidebar, message bubbles, markdown rendering, voice FAB
2. **Memory System** — 3-tier (ShortTerm → Postgres+pgvector → GitHub). Semantic search via embeddings. Files: `src/lib/memory.ts`, `src/lib/memory-repository.ts`
3. **Conversation Persistence** — Postgres tables (`conversations`, `conversation_messages`). Auto-loads last conversation on refresh. Files: `src/lib/conversations-repository.ts`, `src/app/api/conversations/route.ts`
4. **Conversation Compactor** — Summarizes old messages when context exceeds 3K tokens using Gemini Flash. File: `src/lib/conversation-compactor.ts`
5. **Context Pulse** — Auto-injects time-of-day, pending tasks, daily spend, weekend awareness into every prompt. File: `src/lib/context-pulse.ts`
6. **Preference Tracker** — Auto-learns model preferences, tool usage, active hours. File: `src/lib/preference-tracker.ts`
7. **Autonomous Queue** — Goals decompose into tasks, execute every 15 min via cron. File: `src/lib/autonomous-queue.ts`
8. **Voice** — Gemini Live (free, WebSocket) + OpenAI Realtime (paid, WebRTC). Hooks: `src/hooks/useGeminiLiveVoice.ts`, `src/hooks/useRealtimeVoice.ts`, `src/hooks/useAngelinaVoice.ts`
9. **5 AI Agents** — Prime (orchestrator), Scout (research), Creator (content), Builder (code), Ops (email/calendar). File: `src/lib/agent-router.ts`
10. **Cost Control** — 3-tier model routing, daily caps, budget alerts. Files: `src/lib/pricing.ts`, `src/lib/cost-policy.ts`
11. **30+ Tools** — Email, calendar, tasks, goals, memory, search, GitHub, voice, content, MCP. File: `src/lib/tools-registry.ts`
12. **Dashboard** — `/dashboard` page with usage analytics, cost breakdown, model usage
13. **Tasks** — `/tasks` page with kanban board (TODO, IN PROGRESS, COMPLETED, ARCHIVED)
14. **Safety** — Tool approval gates, prompt injection defense, confidence scoring

### Database Tables (already exist in Supabase):
- `memory_entries` (id, topic, content, type, tags[], importance, embedding vector(1536), created_at)
- `tasks` (id, title, description, status, priority, created_at, updated_at)
- `usage_logs` (id, model, provider, input_tokens, output_tokens, cost, endpoint, created_at)
- `conversations` (id, title, created_at, updated_at)
- `conversation_messages` (id, conversation_id, role, content, model, tool_used, created_at)

### Design System:
- Dark futuristic theme: `deep-space` (#0A0E17) bg, `gunmetal` (#131825) cards, `cyan-glow` (#00C8E8) accents
- Fonts: Orbitron (headers), Inter (body)
- Glass effects with `backdrop-blur`, subtle cyan glow
- TailwindCSS v3 with custom theme in `tailwind.config.ts`
- Mobile-first responsive design

---

## TASK 1: Multi-User Support

**Goal:** Transform from single-user (Dhruv only) to multi-user so anyone can sign up and use Angelina.

### What to do:

1. **Add Supabase Auth** — Email/password + Google OAuth signup/login
   - Use `@supabase/ssr` for Next.js server-side auth
   - Create auth middleware (`src/middleware.ts`) that protects all routes except `/login` and `/api/auth/*`
   - Update `/login` page to use Supabase Auth UI or custom form
   - Store user profile in a new `profiles` table (id, email, display_name, avatar_url, created_at)

2. **Add `user_id` to all tables** — Every table needs user isolation:
   - `memory_entries` — add `user_id uuid REFERENCES auth.users(id)`
   - `tasks` — add `user_id`
   - `conversations` — add `user_id`
   - `conversation_messages` — inherits via conversation_id FK
   - `usage_logs` — add `user_id`
   - Create SQL migration: `sql/004_multi_user.sql`
   - Enable Row Level Security (RLS) on ALL tables: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
   - Add RLS policies: `CREATE POLICY "Users see own data" ON x FOR ALL USING (auth.uid() = user_id)`

3. **Update repositories** — All repository files need to accept `userId` parameter:
   - `memory-repository.ts` — add `userId` to all queries
   - `tasks-repository.ts` — add `userId`
   - `conversations-repository.ts` — add `userId`
   - `usage-repository.ts` — add `userId`

4. **Replace hardcoded Dhruv context** — In `angelina-context.ts`:
   - Remove all Dhruv-specific info from the system prompt
   - Keep Angelina's personality (warm, smart, direct) but make it generic
   - Load user's name, preferences, and context from their `profiles` + `memory_entries`
   - First-time users get a welcome onboarding flow: "Hi! I'm Angelina. What should I call you?"

5. **Per-user API key storage** (optional for BYOK users):
   - New table: `user_api_keys` (user_id, provider, encrypted_key, created_at)
   - Settings page: users can add their own OpenRouter/OpenAI keys
   - If user has own key → use it. If not → use platform key with usage limits

6. **Per-user cost tracking**:
   - Usage tracked per user_id
   - Free tier: 50 messages/day (using platform API key)
   - Pro tier ($19/mo): unlimited messages with platform key
   - BYOK: unlimited, uses their own key

7. **Clean up data files** — Remove Dhruv-specific seed data:
   - `memory-seed.json` → replace with empty `[]` or generic onboarding memories
   - `memory-data.json` → remove (generated at runtime)
   - `usage-data.json` → remove (comes from DB now)
   - `youtube-data.json` → remove (Dhruv-specific)
   - `revenue-data.json` → remove
   - `billing-overrides.json` → remove

---

## TASK 2: Personal Knowledge Graph (The Killer Feature)

**Goal:** Auto-build a visual knowledge graph from conversations. Users see their "AI Brain" growing. This is the #1 differentiator — no other AI does this.

### Database Schema (add to `sql/004_multi_user.sql` or create `sql/005_knowledge_graph.sql`):

```sql
-- Knowledge nodes (entities extracted from conversations)
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL, -- 'person', 'project', 'company', 'decision', 'idea', 'tool', 'goal', 'place'
  title VARCHAR(500) NOT NULL,
  content TEXT, -- detailed description/context
  metadata JSONB DEFAULT '{}', -- flexible: { email, phone, role, url, etc. }
  embedding VECTOR(1536), -- for semantic search
  mention_count INT DEFAULT 1, -- how often mentioned (importance signal)
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge edges (relationships between nodes)
CREATE TABLE knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation VARCHAR(100) NOT NULL, -- 'works_on', 'knows', 'decided', 'mentioned_with', 'part_of', 'depends_on'
  strength FLOAT DEFAULT 1.0, -- increases with co-mentions
  context TEXT, -- why they're linked (conversation excerpt)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_id, target_id, relation)
);

-- Indexes
CREATE INDEX idx_kn_user ON knowledge_nodes(user_id);
CREATE INDEX idx_kn_type ON knowledge_nodes(user_id, type);
CREATE INDEX idx_kn_embedding ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_ke_user ON knowledge_edges(user_id);
CREATE INDEX idx_ke_source ON knowledge_edges(source_id);
CREATE INDEX idx_ke_target ON knowledge_edges(target_id);

-- RLS
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own nodes" ON knowledge_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own edges" ON knowledge_edges FOR ALL USING (auth.uid() = user_id);
```

### Implementation:

1. **Entity Extraction** — `src/lib/knowledge-extractor.ts`
   - After every assistant response, extract entities using a cheap LLM call (Gemini Flash via OpenRouter)
   - Prompt: "Extract entities from this conversation. Return JSON: [{type, title, metadata}]. Types: person, project, company, decision, idea, tool, goal, place. Only extract clearly mentioned entities."
   - Deduplicate: if a node with same title+type exists for this user, update `mention_count` and `last_seen` instead of creating new
   - Create edges between entities that appear in the same message/conversation
   - Cost: ~$0.001 per extraction (Gemini Flash)

2. **Knowledge Repository** — `src/lib/knowledge-repository.ts`
   - `upsertNode(userId, type, title, content, metadata)` — create or update node
   - `addEdge(userId, sourceId, targetId, relation, context)` — create or strengthen edge
   - `getGraph(userId, limit?)` — get all nodes + edges for visualization
   - `getSubgraph(userId, nodeId, depth?)` — get node + connected nodes (1-2 hops)
   - `searchNodes(userId, query)` — semantic search via pgvector
   - `getNodesByType(userId, type)` — filter by entity type
   - `mergeNodes(userId, nodeId1, nodeId2)` — merge duplicate entities

3. **Graph-Powered Memory Recall** — Update `src/lib/memory.ts`
   - When building memory context for a query, ALSO search `knowledge_nodes` for relevant entities
   - If user asks about "Client X", traverse the graph: Client X → linked projects → linked decisions → linked people
   - Inject this graph context alongside flat memory entries
   - This makes Angelina's answers dramatically more contextual

4. **API Routes**:
   - `src/app/api/knowledge/route.ts` — GET (list nodes), POST (manual add), DELETE (remove node)
   - `src/app/api/knowledge/[id]/route.ts` — GET (node + edges), PUT (update), DELETE
   - `src/app/api/knowledge/graph/route.ts` — GET full graph data for visualization
   - `src/app/api/knowledge/merge/route.ts` — POST merge two nodes

5. **Brain Page UI** — `src/app/brain/page.tsx`
   - Use `reactflow` (npm install reactflow) for interactive graph visualization
   - Node types with distinct colors: person (blue), project (green), company (purple), decision (orange), idea (yellow), goal (cyan)
   - Click node → side panel shows: title, content, metadata, connected nodes, conversation excerpts
   - Search bar at top — semantic search across all nodes
   - Filter by type (checkboxes)
   - Stats bar: "Your brain has 47 nodes and 89 connections"
   - Empty state for new users: "Start chatting with Angelina. Your knowledge graph builds automatically."
   - Mobile responsive: on mobile, show as a list grouped by type with expand/collapse, instead of graph
   - Match the existing dark theme (deep-space bg, cyan-glow accents, glass panels)

6. **Add to navigation** — Update `src/components/layout/header.tsx` nav items:
   - Add `{ href: '/brain', label: 'Brain', icon: Brain }` (from lucide-react)
   - Add to `src/components/layout/mobile-nav.tsx` as well

7. **Auto-extraction integration** — In `src/app/api/chat/route.ts`:
   - After streaming the assistant response, fire-and-forget the entity extraction
   - Don't block the chat response — extract asynchronously
   - Use: `extractAndSaveEntities(userId, userMessage, assistantResponse).catch(console.error)`

---

## TASK 3: Morning Brief (Daily Habit = Retention)

**Goal:** Every morning, Angelina proactively generates a personalized daily briefing.

### Implementation:

1. **Morning Brief Generator** — `src/lib/morning-brief.ts`
   - Generates a structured brief with sections:
     - Greeting (time-aware, personalized with user's name)
     - Overnight email summary (if Google connected — top 5 unread, who from, subject, urgency)
     - Today's calendar (events for next 12 hours)
     - Pending tasks (sorted by priority)
     - Goal progress (% complete on active goals)
     - Knowledge graph highlight ("You mentioned [Client X] 5 times this week. Follow up?")
     - One motivational/productivity tip (rotate daily)
   - Returns both text (for chat) and structured data (for dashboard card)

2. **Brief API** — `src/app/api/brief/route.ts`
   - GET — generate today's brief for authenticated user
   - Cached: generate once per day, serve from cache after

3. **Brief UI** — Show in two places:
   - **Chat**: When user opens app for first time today, Angelina's first message IS the morning brief (not "Hi! How can I help?")
   - **Dashboard**: New "Morning Brief" card at top of `/dashboard` page
   - Format: clean markdown with sections, not a wall of text

4. **Daily Cron Update** — In `/api/worker/digest`:
   - Generate briefs for all active users (last login < 7 days)
   - Store in `daily_briefs` table (user_id, date, content_json, created_at)
   - Optional: send via email or Telegram push notification

5. **Detection logic in chat** — In `src/app/page.tsx`:
   - On mount, check `localStorage` for `angelina_last_brief_date`
   - If not today → fetch `/api/brief` → display as first assistant message
   - Set `angelina_last_brief_date = today`

---

## TASK 4: Proactive AI (Not Reactive)

**Goal:** Angelina initiates conversations, not just responds. She notices patterns and suggests actions.

### Implementation:

1. **Proactive Engine** — `src/lib/proactive-engine.ts`
   - Runs on every `/api/worker/tick` (every 15 min) for each active user
   - Checks:
     - Stale follow-ups: "You haven't messaged [Person X] in 12 days. Draft an email?"
     - Overdue tasks: "3 tasks are overdue. Reschedule or complete?"
     - Goal drift: "Your revenue goal is 40% behind pace. Here's what I'd prioritize."
     - Calendar prep: "Meeting with [Person] in 30 min. Here's context from your last conversation."
     - Spending alerts: "You've spent $1.50 today on AI. That's 75% of your daily cap."
   - Each check produces a `ProactiveInsight` object: { type, title, body, action_suggestion, priority }
   - Only surfaces insights above a priority threshold (avoid notification fatigue)

2. **Insight Delivery** — Two channels:
   - **In-app banner**: New component `src/components/ui/proactive-banner.tsx` — shows at top of chat when there are unread insights. Dismissible. Yellow/amber accent for attention.
   - **Push notification**: If user has Telegram connected or email notifications enabled → send via existing `proactive-push.ts`

3. **Insight API** — `src/app/api/insights/route.ts`
   - GET — list unread insights for user
   - POST — mark insight as read/dismissed/acted-on
   - Track which insights users act on vs dismiss (learn what's useful)

4. **Insight Storage**:
   - New table: `proactive_insights` (id, user_id, type, title, body, action, priority, status, created_at, acted_at)
   - RLS enabled

---

## TASK 5: Voice-First Ambient Mode

**Goal:** Make voice the PRIMARY interface, not a feature. Always-listening mode with wake word.

### Implementation:

1. **Ambient Voice Mode** — Update `src/hooks/useAngelinaVoice.ts`
   - New mode: `ambient` (vs current `push-to-talk` and `continuous`)
   - In ambient mode: microphone stays open, VAD (Voice Activity Detection) detects speech
   - Wake word detection: "Hey Angelina" — use local keyword spotting (no cloud VAD for privacy)
   - After wake word: capture speech → transcribe → process → respond by voice → return to listening
   - Visual indicator: subtle pulsing cyan ring on voice FAB when in ambient mode

2. **Voice-First UI** — New layout option:
   - When voice mode is active, minimize the chat UI to a floating orb
   - Show only: waveform visualization + transcript of last exchange
   - Tap orb to expand back to full chat
   - Works great on mobile — like talking to Siri but smarter

3. **Ambient mode toggle** — In settings or voice FAB long-press:
   - Off (default) → Push-to-talk → Ambient (always listening)
   - Permission: request microphone access with clear explanation
   - Battery consideration: show warning on mobile that ambient mode uses more battery

4. **Use Gemini Live API** (free) as default for ambient mode:
   - WebSocket connection stays open
   - Audio frames sent continuously during speech
   - Low latency response
   - Falls back to OpenAI Realtime if Gemini is down

5. **Voice response improvements**:
   - Angelina speaks response AND shows text transcript simultaneously
   - User can interrupt mid-response (barge-in support — already in Gemini Live)
   - Context-aware volume: quieter at night (use context-pulse time data)

---

## TASK 6: Life Dashboard (Not Just Chat)

**Goal:** Make `/dashboard` the best personal productivity dashboard that exists. One glance = full context of your life.

### Implementation:

1. **Redesign `/dashboard` page** — `src/app/dashboard/page.tsx`
   - Current: just usage/cost analytics (boring)
   - New layout (grid of cards):

   ```
   ┌─────────────────────────────────────────┐
   │         Morning Brief (today)           │
   ├──────────────┬──────────────────────────┤
   │  Calendar    │   Tasks Summary          │
   │  (next 5     │   ■■■■░░ 4/6 done       │
   │   events)    │   3 pending, 1 overdue   │
   ├──────────────┼──────────────────────────┤
   │  Goals       │   Knowledge Graph        │
   │  Progress    │   Mini-preview           │
   │  ████░ 60%   │   (47 nodes, +3 today)   │
   ├──────────────┼──────────────────────────┤
   │  AI Usage    │   Proactive Insights     │
   │  $0.45 today │   2 need attention       │
   │  ████░ 23%   │                          │
   ├──────────────┴──────────────────────────┤
   │         Weekly Accomplishments          │
   │   ✓ 12 tasks completed                 │
   │   ✓ 34 conversations                   │
   │   ✓ 8 new knowledge nodes              │
   │   Trend: ↑ 15% more productive         │
   └─────────────────────────────────────────┘
   ```

   - Each card is a separate component in `src/components/dashboard/`
   - Cards: `BriefCard`, `CalendarCard`, `TasksSummaryCard`, `GoalsCard`, `KnowledgePreviewCard`, `UsageCard`, `InsightsCard`, `WeeklyCard`
   - Use CSS Grid with responsive breakpoints (1 col mobile, 2 col tablet, 3 col desktop)
   - Framer Motion for card entrance animations
   - Click any card → navigates to detailed page (/tasks, /brain, etc.)

2. **Weekly Report Generation** — `src/lib/weekly-report.ts`
   - Generated by `/api/worker/reflect` cron (weekly)
   - Summarizes: tasks completed, conversations had, knowledge nodes created, goal progress, AI spend
   - Trend comparison with previous week
   - Stored in `weekly_reports` table (user_id, week_start, data_json, created_at)

3. **Dashboard API** — `src/app/api/dashboard/route.ts`
   - GET — returns all dashboard card data in one call (aggregated)
   - Cached for 5 min (stale-while-revalidate pattern)

---

## TASK 7: Cleanup & Optimization

**Goal:** Remove Dhruv-specific hardcoding, clean unused files, optimize what exists.

### What to clean:

1. **`src/lib/angelina-context.ts`** — THE BIG ONE (549 lines)
   - Remove ALL of Dhruv's personal info (phone, email, clients, pipeline, job hunt, achievements)
   - Keep: Angelina's personality, conversation style, tool descriptions, formatting rules
   - Add: dynamic user profile loading from `profiles` table
   - Add: user's knowledge graph summary injection (top 10 most-mentioned entities)
   - Result should be ~200 lines max (personality + dynamic context)

2. **Remove Dhruv-specific data files:**
   - `memory-seed.json` → replace with minimal generic seed or empty
   - `youtube-data.json` → delete (user-specific, loaded from API)
   - `revenue-data.json` → delete
   - `billing-overrides.json` → delete

3. **Consolidate documentation:**
   - Keep: `CLAUDE.md` (project context for AI), `README.md` (public docs), `.env.example`
   - Archive to `docs/` folder: `JARVIS-ROADMAP.md`, `AGENTIC-REFERENCE.md`, `HOW-I-BUILT-THIS.md`, `REFERENCE-IMPLEMENTATIONS.md`, `PRD-TECH-STACK.md`, `ANGELINA-SYSTEM-PROMPT.md`
   - Delete: `LOADOUT.md`, `SCALABILITY.md` (merged into CLAUDE.md)

4. **Optimize existing features:**
   - `/social` page — if not functional, hide from nav (don't show broken pages to new users)
   - `/activity` page — simplify to just show recent tool executions and insights
   - Model selector — default to auto-routing. Only show manual model picker in settings or advanced mode
   - Remove or hide Dhruv-specific tools from new users: `call_dhruv`, `obsidian_vault`, `thumbnail_prompt`, `handdrawn_diagram`, `n8n_workflow`, `vps_execute`, `linkedin_post`, `twitter_post`
   - Keep these tools available but only show if user connects the integration in settings

---

## Build Order (Recommended)

1. **Task 7 first** — Cleanup. Remove Dhruv-specific stuff. This unblocks everything else.
2. **Task 1** — Multi-user auth. Without this, nothing else matters for end users.
3. **Task 2** — Knowledge Graph. This is the WOW feature that differentiates Angelina.
4. **Task 6** — Life Dashboard. Makes the app feel complete, not just a chat wrapper.
5. **Task 3** — Morning Brief. Creates the daily habit loop for retention.
6. **Task 4** — Proactive AI. Advanced feature, builds on all the above.
7. **Task 5** — Voice Ambient Mode. Polish feature, builds on existing voice hooks.

---

## Critical Rules

1. **DO NOT break existing chat functionality.** The chat page (`/`) must keep working throughout all changes.
2. **Use existing design system.** Dark theme, cyan accents, Orbitron headers, glass effects. Check `tailwind.config.ts`.
3. **Use existing patterns.** Every store has Postgres + file fallback. Every API route follows thin-route pattern. Follow what exists in `src/lib/`.
4. **Mobile-first.** Every new page/component must work on mobile. Test with responsive views.
5. **Cost-aware.** Any new LLM calls (entity extraction, brief generation) should use the cheapest model (Gemini Flash via OpenRouter: `google/gemini-2.0-flash-exp`). Never use GPT-4 for background processing.
6. **Streaming.** Chat responses must continue to stream. Don't break the streaming pipeline.
7. **RLS everywhere.** Every new table must have Row Level Security enabled from day one.
8. **No new dependencies unless necessary.** The app already has Next.js, React, TailwindCSS, Framer Motion, pg, Zustand. Only add: `@supabase/ssr`, `reactflow`. Avoid adding heavy libraries.
9. **Commit after each task.** Don't batch everything into one giant commit.
10. **Test the chat flow** after every major change. Send a message, verify response streams, verify memory saves, verify conversation persists on refresh.

---

## Environment Variables Needed (add to .env.example)

```env
# Supabase Auth (NEW — for multi-user)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Existing (already configured)
POSTGRES_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...  # optional, for embeddings
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TELEGRAM_BOT_TOKEN=...
```

---

## Success Criteria

When all tasks are done, a new user should be able to:
1. Sign up with email or Google
2. Chat with Angelina — she learns their name, preferences, context
3. See their knowledge graph growing at `/brain` as they chat
4. Get a morning brief every day when they open the app
5. See proactive insights ("You haven't followed up with X")
6. See a life dashboard with tasks, goals, calendar, knowledge at a glance
7. Use voice to talk to Angelina hands-free
8. Everything works on mobile
9. Their data is completely isolated from other users
10. They never need to configure anything — it just works out of the box
