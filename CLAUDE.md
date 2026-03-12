# Angelina AI — Project Context for Claude Code

> Personal AI Operating System. "ChatGPT is an AI you talk to. Angelina is an AI that works for you."

---

## Quick Reference

| Key | Value |
|-----|-------|
| **Path** | `angelina-vercel-clean/` |
| **GitHub** | `aiagentwithdhruv/angelina-vercel-app` |
| **Stack** | Next.js 14, React 18, TypeScript, Supabase PostgreSQL + pgvector, OpenRouter (multi-model), Capacitor (mobile) |
| **Deploy** | Vercel (frontend + API) + Hostinger VPS (crons) |
| **DB** | Supabase PostgreSQL with pgvector extension |
| **Voice** | Gemini Live API (free, WebSocket) + OpenAI Realtime (paid, WebRTC) |
| **Status** | Active development — preparing for multi-user launch |

---

## Architecture Overview

### Core Systems (src/lib/)
| System | Files | What It Does |
|--------|-------|-------------|
| **AI Router** | `agent-router.ts`, `model-router.ts`, `ai-agent.ts` | Routes queries to 5 agents (Prime, Scout, Creator, Builder, Ops). Model selection: cost-aware fallback chain |
| **Memory** | `memory.ts`, `memory-repository.ts`, `embeddings.ts` | 3-tier: ShortTerm (in-process) → Persistent (Postgres+pgvector) → LongTerm (GitHub sync). Semantic search via embeddings |
| **Context** | `angelina-context.ts`, `context-pulse.ts`, `preference-tracker.ts`, `confidence.ts` | System prompt assembly. Injects: time-of-day, tasks, spend, preferences, confidence scoring |
| **Conversation** | `conversation-compactor.ts`, `conversations-repository.ts` | Chat persistence (Postgres). Auto-compaction via Gemini Flash when context exceeds 3K tokens |
| **Tasks & Goals** | `tasks-store.ts`, `tasks-repository.ts`, `goals-store.ts`, `goal-decomposer.ts`, `autonomous-queue.ts` | Task CRUD + autonomous goal execution every 15 min |
| **Tools** | `tools-registry.ts` (462 lines) | 30+ tools: email, calendar, tasks, goals, memory, search, GitHub, voice, content, MCP |
| **Voice** | `voice.ts` | OpenAI Realtime + Gemini Live. Audio encoding/decoding, VAD, session management |
| **Cost Control** | `pricing.ts`, `cost-policy.ts`, `usage-store.ts`, `smart-upgrade.ts` | 3-tier model routing, daily caps ($2), budget alerts |
| **Safety** | `approval-gate.ts`, `prompt-guard.ts`, `activation-guard.ts` | Tool approval for high-risk actions, prompt injection defense |
| **Self-Improvement** | `self-fix.ts`, `resilient-provider.ts` | Error diagnosis + auto-fix suggestions, retry + fallback logic |
| **Proactive** | `proactive-push.ts`, `heartbeat.ts` | Telegram notifications, 5 silent daily checks (email, tasks, calendar, memory, goals) |
| **Integrations** | `integrations.ts`, `google-auth.ts`, `google-services.ts` | Google OAuth (Gmail, Calendar, Drive), ClickUp, Slack |

### Pages (src/app/)
| Page | Purpose |
|------|---------|
| `/` | Main chat UI — conversation sidebar, message history, voice FAB, input |
| `/dashboard` | Usage analytics — cost breakdown, model usage, tool stats, revenue |
| `/tasks` | Kanban board — TODO, IN PROGRESS, COMPLETED, ARCHIVED |
| `/settings` | API keys, Google auth, integrations toggle, cost limits |
| `/social` | Social content calendar (LinkedIn, X, YouTube) |
| `/activity` | Activity log — tool executions, goals, memory saves |
| `/login` | Auth page |

### API Routes (src/app/api/) — 51+ routes
- `/api/chat` — Main chat endpoint with streaming, tool calling, cost tracking
- `/api/conversations` — CRUD conversation history
- `/api/tools/*` — 30+ tool endpoints (email, calendar, tasks, memory, search, etc.)
- `/api/worker/tick` — 15-min cron for autonomous task execution
- `/api/worker/digest` — Daily summary generation
- `/api/worker/reflect` — Weekly self-reflection

### Database (sql/)
| Table | Purpose |
|-------|---------|
| `memory_entries` | Facts, clients, preferences, decisions + pgvector embeddings |
| `tasks` | Task CRUD with status, priority, dates |
| `usage_logs` | API usage tracking (tokens, cost, model, provider) |
| `conversations` | Chat conversation metadata |
| `conversation_messages` | Individual messages per conversation |

### Voice Hooks (src/hooks/)
- `useGeminiLiveVoice.ts` — Gemini Live API (WebSocket, free)
- `useRealtimeVoice.ts` — OpenAI Realtime API (WebRTC, $0.06/min)
- `useAngelinaVoice.ts` — Multi-provider abstraction (auto-switches based on cost)

### UI Components (src/components/)
- `chat/` — message-bubble, conversation-sidebar
- `layout/` — header, mobile-layout, mobile-nav, mobile-sidebar, mobile-header, activity-panel
- `ui/` — button, input, card, badge, avatar, model-selector, voice-fab

---

## Design System

| Token | Value | Use |
|-------|-------|-----|
| `deep-space` | `#0A0E17` | Page background |
| `gunmetal` | `#131825` | Card/panel background |
| `charcoal` | `#1A1F2E` | Elevated surfaces |
| `steel-dark` | `#2A3042` | Borders |
| `steel-mid` | `#3D4459` | Hover states |
| `cyan-glow` | `#00C8E8` | Primary accent, active states |
| `text-primary` | `#F0F2F5` | Main text |
| `text-secondary` | `#A0A8B8` | Secondary text |
| `text-muted` | `#6B7280` | Muted text |
| `font-orbitron` | Orbitron | Headers, logo |
| `font-inter` | Inter | Body text |

**Style:** Dark, futuristic, clean. Glass effects with `backdrop-blur`. Subtle cyan glow accents. No clutter.

---

## Engineering Rules

1. **Thin routes** — API routes call services, services call repositories. No business logic in routes.
2. **Postgres + file fallback** — Every store has `PostgresXxxRepository` + `FileXxxRepository`. Auto-selects based on `POSTGRES_URL`.
3. **Cost-aware** — Every LLM call logs tokens + cost. Daily cap enforced. Use cheapest model that works.
4. **Tool approval** — High-risk tools (send_email, call_dhruv, delete) require explicit user confirmation.
5. **Semantic memory** — Save with pgvector embeddings. Search by meaning, not just keywords.
6. **Multi-provider** — Never depend on one AI provider. Fallback chain always available.
7. **Mobile-first** — All UI works on mobile. Capacitor configured (com.angelina.ai).
8. **No hardcoded secrets** — All API keys via environment variables.
9. **Self-healing** — When tools fail, `self-fix.ts` diagnoses and suggests resolution.
10. **Streaming responses** — Chat API streams via ReadableStream. Never block on full response.

---

## Multi-User Preparation

Currently single-user (Dhruv). To go multi-user:
- Add `user_id` column to: `memory_entries`, `tasks`, `conversations`, `conversation_messages`, `usage_logs`
- Enable Supabase Row Level Security (RLS) on all tables
- Replace hardcoded Dhruv context in `angelina-context.ts` with per-user profile loaded from DB
- Add Supabase Auth (email/password + Google OAuth)
- Per-user API key storage (encrypted)
- Per-user cost caps and usage tracking

---

## Data Files (root)
| File | Purpose |
|------|---------|
| `memory-seed.json` | Initial memory bootstrap (empty `[]` or generic onboarding; multi-user ready) |
| `cost-policy.json` | Model tier configuration (tier1/2/3 thresholds) |
| `.env.example` | All required/optional env vars |

Runtime-generated (not committed): `memory-data.json`, `youtube-data.json`, `usage-data.json` — use DB when available.

---

## Key Docs
| File | What |
|------|------|
| `docs/planning/JARVIS-ROADMAP.md` | Feature roadmap |
| `docs/planning/AGENTIC-REFERENCE.md` | Autonomous execution, tools, cost policy |
| `docs/planning/HOW-I-BUILT-THIS.md` | Engineering decisions and rationale |
| `BUILD-PROMPT.md` | Master build instructions for multi-user and new features |
