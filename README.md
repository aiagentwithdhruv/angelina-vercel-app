# Angelina AI

> Personal AI operating system with voice, memory, 16+ tools, and cost-aware multi-provider routing — deployed on Vercel.

**Built by:** [Dhruv Tomar](https://linkedin.com/in/aiwithdhruv) | [AiwithDhruv](https://github.com/aiagentwithdhruv)

---

## What It Does

Angelina is a full-stack AI assistant that connects to 7 LLM providers, remembers conversations, manages tasks, reads your email, checks your calendar, searches the web, triggers automations, and talks to you in real-time voice — all from a single interface.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + Framer Motion |
| **State** | Zustand (client) + PostgreSQL (server) |
| **Database** | Supabase PostgreSQL + pgvector + JSON file fallback |
| **AI Providers** | OpenAI, Anthropic, Google Gemini, Groq, Perplexity, Moonshot (Kimi), OpenRouter |
| **Voice** | GPT-4o Realtime API (WebRTC) |
| **Bot** | Telegram via grammy |
| **Deployment** | Vercel (serverless + crons) |
| **Mobile** | PWA (service worker + manifest) |

---

## Features

### AI Chat
- Multi-provider routing with automatic fallback (OpenAI -> Anthropic -> OpenRouter -> Google)
- 25+ models across 7 providers with per-model pricing
- Streaming responses with markdown rendering (tables, code, headings)
- Conversation compaction for long sessions
- Model selector dropdown (text + voice separately)

### Voice
- Real-time voice conversation via GPT-4o Realtime API
- Interruption handling (speak over the AI)
- Floating voice action button
- Separate audio/text token pricing

### Memory
- Persistent memory with auto-save (triggered by system prompt)
- Save and recall memories via tool calls
- PostgreSQL + pgvector for semantic search
- JSON file fallback for local dev
- 500-entry cap with importance scoring

### Tools (16+)
| Tool | What It Does |
|------|-------------|
| `web_search` | Tavily-powered internet search |
| `check_email` | Read Gmail inbox |
| `send_email` | Send emails via Gmail |
| `check_calendar` | Google Calendar events |
| `github` | Read/write repos, search code, manage issues |
| `manage_task` | Create, update, complete tasks |
| `save_memory` / `recall_memory` | Persistent AI memory |
| `wikipedia` | Knowledge lookup |
| `hacker_news` | Tech news feed |
| `youtube_analytics` | Channel performance data |
| `call_dhruv` | Vapi/Twilio phone calls |
| `n8n_workflow` | Trigger n8n automations |
| `mcp_call` | Model Context Protocol execution |
| `goals` | Personal goal tracking |

### Cost Control
- 5-tier model routing (simple -> moderate -> complex -> tool_call -> critical)
- Daily budget cap with hard limit enforcement
- Session-level budget tracking
- Smart auto-upgrade on complexity detection
- Proactive Telegram alerts when approaching budget
- Billing overrides for manual adjustments

### Agentic Features
- Approval gate for risky tool calls
- Self-fix on tool failure (LLM diagnoses and retries)
- Resilient provider with exponential backoff
- Preference learning over time
- Conversation compaction (summarize after 15+ turns)
- Confidence scoring per model response

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Chat interface (main UI) |
| `/dashboard` | Usage analytics with charts |
| `/tasks` | Task management |
| `/settings` | API keys and model selection |
| `/activity` | Real-time activity log |
| `/social` | Social media management |
| `/login` | Authentication |

### Integrations
- **Telegram Bot** — push notifications, digest, remote chat
- **Google OAuth** — Gmail, Calendar, Drive access
- **ClickUp** — task management sync
- **n8n** — workflow automation triggers
- **MCP** — Model Context Protocol server
- **Vapi + Twilio** — outbound phone calls

---

## Project Structure

```
angelina-vercel-clean/
├── src/
│   ├── app/                    # Next.js pages + API routes
│   │   ├── page.tsx            # Chat UI
│   │   ├── api/chat/route.ts   # Multi-provider chat endpoint
│   │   ├── api/tools/          # 16+ tool implementations
│   │   ├── api/auth/           # Login + Google OAuth
│   │   ├── api/telegram/       # Telegram webhook
│   │   └── api/worker/         # Cron digest
│   ├── components/             # React components (chat, layout, ui)
│   ├── hooks/                  # useRealtimeVoice, useAngelinaVoice
│   ├── lib/                    # Core logic (34 files)
│   │   ├── models.ts           # 25+ model definitions
│   │   ├── pricing.ts          # Per-model cost calculation
│   │   ├── cost-policy.ts      # Budget enforcement
│   │   ├── memory.ts           # Memory system
│   │   ├── db.ts               # PostgreSQL connection
│   │   └── telegram/bot.ts     # Telegram handler
│   └── worker/scheduler.ts     # Background job runner
├── sql/                        # Database migration schemas
├── scripts/                    # Migration + utility scripts
├── docs/                       # Deployment + env var docs
├── public/                     # PWA assets (sw.js, manifest, icons)
├── cost-policy.json            # Model tier configuration
├── vercel.json                 # Vercel deployment config
└── .env.example                # All environment variables
```

---

## Quick Start

### Local Development

```bash
git clone https://github.com/aiagentwithdhruv/angelina-vercel-app.git
cd angelina-vercel-app
npm install
cp .env.example .env.local      # Fill in your API keys
npm run dev                     # http://localhost:3000
```

### Vercel Deployment

1. Import this repo in Vercel
2. Add environment variables from `.env.example`
3. Required vars:
   - `OPENAI_API_KEY` (or any one AI provider key)
   - `AUTH_EMAIL` + `AUTH_PASSWORD`
   - `POSTGRES_URL` (for persistent storage)
   - `MEMORY_BACKEND=postgres`
4. Deploy from `main`

### Database Migrations

```bash
npm run migrate:memory     # Memory table + pgvector
npm run migrate:phase2     # Tasks + usage tables
```

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key groups:

- **AI Providers** — OpenAI, Anthropic, Gemini, Groq, Perplexity, Moonshot, OpenRouter
- **Google OAuth** — Gmail, Calendar, Drive integration
- **Telegram** — Bot token, chat ID, allowed users
- **Database** — Postgres URL + backend toggles
- **Cost Control** — Daily cap in USD
- **External** — GitHub, Tavily, Vapi, Twilio, ClickUp, n8n, MCP

---

## Documentation

- [Deployment Guide](docs/deploy-hybrid.md) — Vercel + VPS hybrid setup
- [Environment Variables](docs/ops-env-vars.md) — Full env var reference
- [System Prompt](ANGELINA-SYSTEM-PROMPT.md) — Core AI personality
- [PRD & Tech Stack](PRD-TECH-STACK.md) — Product requirements

---

## License

Private repository. All rights reserved.

---

**Contact:** [aiwithdhruv@gmail.com](mailto:aiwithdhruv@gmail.com) | [LinkedIn](https://linkedin.com/in/aiwithdhruv) | [GitHub](https://github.com/aiagentwithdhruv)
