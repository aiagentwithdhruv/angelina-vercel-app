# How I Built a Full AI Operating System Using AI

> A step-by-step breakdown of how I used Claude Code, UX Pilot, and other AI tools to go from zero to a production-deployed AI system with 16+ tools, 7 LLM providers, real-time voice, and persistent memory — without writing most of the code by hand.

**Author:** [Dhruv Tomar](https://linkedin.com/in/aiwithdhruv) | AI Educator & Builder

---

## The AI Tools I Used

| Step | AI Tool | What It Did |
|------|---------|-------------|
| PRD & Architecture | **Claude Code** (Anthropic) | Generated the full product requirements document, tech stack decisions, and system architecture |
| System Prompt | **Claude Code** | Designed Angelina's personality, safety rules, memory behavior, and tool policies |
| UI/UX Design | **UX Pilot** | Generated screen-by-screen design specs, color system, component library, and interaction patterns |
| UI to Code | **UX Pilot** | Converted designs into HTML/CSS prototypes for each screen |
| Full-Stack Code | **Claude Code** | Wrote the entire Next.js application — API routes, components, hooks, database layer, integrations |
| Debugging & Fixes | **Claude Code** | Diagnosed build errors, fixed Edge Runtime issues, rewrote middleware, resolved provider bugs |
| Deployment | **Claude Code** + Vercel | Configured vercel.json, set up crons, managed environment variables |
| Documentation | **Claude Code** | Generated README, deployment guides, env var docs |

**My role:** Architecture decisions, tool selection, prompt engineering, testing, and quality review. I directed what to build. AI built it.

---

## Phase 1: PRD & Architecture (Day 1)

### What I Did
Told Claude Code: "Build me a PRD for a personal AI operating system that can talk, remember, plan, and execute tasks."

### What AI Generated
- **[PRD-TECH-STACK.md](PRD-TECH-STACK.md)** — Full product requirements with vision, goals, non-goals, core capabilities, architecture overview, and tech stack recommendations
- Defined 8 architectural layers: Interfaces, Agent Orchestration, Tooling/MCP, Model Layer, Memory, Data/Storage, Observability, Security
- Tech stack comparison across multiple options

### What I Changed
- Simplified the architecture (dropped LangGraph, Temporal, Kafka — overkill for MVP)
- Chose Next.js full-stack instead of FastAPI + Node.js split
- Went with PostgreSQL + pgvector instead of a separate vector DB

### Lesson for Students
> AI will over-engineer if you let it. The PRD suggested enterprise-grade infrastructure. I cut it down to what ships. Your job is to know what to keep and what to cut.

---

## Phase 2: System Prompt Design (Day 1)

### What I Did
Asked Claude Code to design the AI personality and behavioral rules.

### What AI Generated
- **[ANGELINA-SYSTEM-PROMPT.md](ANGELINA-SYSTEM-PROMPT.md)** — Core personality (professional, calm, proactive), safety rules, memory policies, tool usage policies, output style
- Defined how Angelina should handle uncertainty, risky actions, and memory

### What I Changed
- Added formatting rules (markdown tables, bullet points) for clean output
- Added auto-save memory instructions so Angelina remembers without being asked
- Added cost-awareness rules so she picks cheap models for simple tasks

### Lesson for Students
> System prompts are the soul of your AI product. This is where you differentiate. Anyone can call the OpenAI API — your system prompt decides if the result is generic or genuinely useful.

---

## Phase 3: UI/UX Design (Day 2)

### What I Did
Used **UX Pilot** to generate the complete design system and screen designs.

### What AI Generated
- **Screen-by-Screen Design Specification** — 7 full screen designs:
  1. Command Center (main chat interface)
  2. Activity Feed panel
  3. Dashboard with analytics
  4. Settings page
  5. Memory Management
  6. Integrations hub
  7. Design System Foundation (colors, typography, spacing, components)

- **Design System:**
  - Colors: Deep Space Black (#0a0a0f), Gunmetal (#1e1e24), Cyan Glow (#00c8e8)
  - Typography: Orbitron (headings), Inter (body), JetBrains Mono (code)
  - Component specs: buttons, cards, inputs, badges, FABs
  - Animation specs: transitions, hover states, glow effects

- **HTML Prototypes** — UX Pilot exported each screen as a standalone HTML file I could open in a browser

### What I Changed
- Simplified the Integrations screen (too many cards)
- Made the mobile layout more practical (bottom nav instead of sidebar)
- Adjusted the cyan glow — UX Pilot made it too intense, I toned it down

### Lesson for Students
> UX Pilot gives you a design spec that's specific enough to hand directly to a code generator. The key step is: Design Doc -> AI Code Generator. The design doc is the bridge.

---

## Phase 4: Full-Stack Code (Days 2-5)

This is where the bulk of the work happened. I used Claude Code for everything.

### 4.1 Project Setup
**Prompt:** "Create a Next.js 14 App Router project with TypeScript, Tailwind CSS, and this design system."

**AI Generated:**
- `package.json` with 27 dependencies
- `tailwind.config.ts` with the Gunmetal/Cyan color system from UX Pilot
- `tsconfig.json`, `next.config.js`, `postcss.config.js`
- Project structure: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`

### 4.2 Chat Interface (Core Feature)
**Prompt:** "Build the main chat page based on the Command Center design. Multi-provider AI with streaming responses."

**AI Generated:**
- [src/app/page.tsx](src/app/page.tsx) — Chat UI with model selector, voice button, message history
- [src/app/api/chat/route.ts](src/app/api/chat/route.ts) — The big one. Multi-provider chat endpoint supporting OpenAI, Anthropic, Perplexity, Google Gemini, and OpenRouter
- [src/lib/models.ts](src/lib/models.ts) — 25+ model definitions with provider routing
- [src/lib/pricing.ts](src/lib/pricing.ts) — Per-model token pricing
- [src/components/chat/message-bubble.tsx](src/components/chat/message-bubble.tsx) — Markdown rendering with react-markdown + remark-gfm

### 4.3 Memory System
**Prompt:** "Build a persistent memory system. AI should auto-save important facts and recall them before tasks."

**AI Generated:**
- [src/lib/memory.ts](src/lib/memory.ts) — JSON file-based memory with lazy loading, 500-entry cap
- [src/lib/memory-repository.ts](src/lib/memory-repository.ts) — PostgreSQL persistence layer
- [src/app/api/tools/save_memory/route.ts](src/app/api/tools/save_memory/route.ts) — Save memory tool
- [src/app/api/tools/recall_memory/route.ts](src/app/api/tools/recall_memory/route.ts) — Recall memory tool
- Memory injection into every chat call (loaded before response generation)

### 4.4 Voice (Real-Time)
**Prompt:** "Add real-time voice conversation using GPT-4o Realtime API with WebRTC."

**AI Generated:**
- [src/hooks/useRealtimeVoice.ts](src/hooks/useRealtimeVoice.ts) — WebRTC connection to OpenAI Realtime API
- [src/app/api/ai/realtime-token/route.ts](src/app/api/ai/realtime-token/route.ts) — Ephemeral token generation
- [src/components/ui/voice-fab.tsx](src/components/ui/voice-fab.tsx) — Floating action button for voice
- [src/lib/voice.ts](src/lib/voice.ts) — Audio encoding/decoding utilities

### 4.5 Tools (16+ Integrations)
Each tool was a separate prompt. Example:

**Prompt:** "Add a web search tool using Tavily API."

**AI Generated:** [src/app/api/tools/web_search/route.ts](src/app/api/tools/web_search/route.ts)

Repeated for: Gmail, Calendar, GitHub, Wikipedia, Hacker News, YouTube, ClickUp, n8n, MCP, Vapi/Twilio, task management, goals, and more.

### 4.6 Cost-Aware Routing
**Prompt:** "Build a cost control system. Route simple questions to cheap models, complex ones to expensive models. Enforce daily budget."

**AI Generated:**
- [src/lib/cost-policy.ts](src/lib/cost-policy.ts) — 5-tier model routing (simple -> critical)
- [cost-policy.json](cost-policy.json) — Configuration file mapping tiers to models
- [src/lib/smart-upgrade.ts](src/lib/smart-upgrade.ts) — Auto-escalate on complexity
- [src/lib/usage-store.ts](src/lib/usage-store.ts) — Track every token spent
- Daily budget cap enforcement with Telegram alerts

### 4.7 Authentication
**Prompt:** "Add login. Simple email/password plus Google OAuth for Gmail access."

**AI Generated:**
- [src/middleware.ts](src/middleware.ts) — Edge Runtime auth middleware (Web Crypto, not Node.js)
- [src/app/login/page.tsx](src/app/login/page.tsx) — Login page
- [src/lib/google-auth.ts](src/lib/google-auth.ts) — Full OAuth 2.0 flow
- Auth bypass for Telegram bot and API auth routes

### 4.8 Telegram Bot
**Prompt:** "Add a Telegram bot so I can chat with Angelina from my phone."

**AI Generated:**
- [src/lib/telegram/bot.ts](src/lib/telegram/bot.ts) — grammy-based bot handler
- [src/app/api/telegram/route.ts](src/app/api/telegram/route.ts) — Webhook endpoint
- Push notifications, daily digest, model selection via /model command

### Lesson for Students
> I didn't write a single API route by hand. Every file in `src/` was generated by Claude Code. But — and this is critical — I reviewed every file, tested it, caught bugs, and directed fixes. AI is the coder. You are the architect and QA team.

---

## Phase 5: Agentic Superpowers (Days 5-7)

### What I Did
After the core app worked, I asked Claude Code to add "intelligence" — features that make the AI smarter, not just functional.

### What AI Generated
- [src/lib/resilient-provider.ts](src/lib/resilient-provider.ts) — Automatic fallback across providers with exponential backoff
- [src/lib/self-fix.ts](src/lib/self-fix.ts) — On tool failure, LLM diagnoses the error and retries
- [src/lib/approval-gate.ts](src/lib/approval-gate.ts) — Risk assessment before executing dangerous tools
- [src/lib/conversation-compactor.ts](src/lib/conversation-compactor.ts) — Summarize conversations after 15+ turns
- [src/lib/confidence.ts](src/lib/confidence.ts) — Confidence scoring per response
- [src/lib/preference-tracker.ts](src/lib/preference-tracker.ts) — Learn user preferences over time
- [src/lib/proactive-push.ts](src/lib/proactive-push.ts) — Telegram alerts when approaching budget
- [src/lib/context-pulse.ts](src/lib/context-pulse.ts) — Real-time context injection

### Lesson for Students
> This is where AI-built apps go from "demo" to "product." Resilience, self-repair, cost control — these features cost $0 in API calls but make the system 10x more reliable. Always add the intelligence layer.

---

## Phase 6: Debugging & Deployment (Ongoing)

### Real Bugs AI Introduced (and Fixed)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Middleware crashed on Vercel | Used Node.js `crypto` in Edge Runtime | Rewrote with Web Crypto API |
| Google OAuth blocked | Auth middleware intercepted `/api/auth/*` routes | Added route exceptions |
| Voice session failed | Wrong `session.update` payload format | Updated to current OpenAI schema |
| Telegram bot couldn't chat | Auth middleware blocked webhook | Added internal key header bypass |
| `ArrayBufferLike` type error | TypeScript strict mode incompatibility | Cast to `ArrayBuffer` |
| Token counting wrong | Each provider returns usage data differently | Built per-provider extraction |

### Deployment Setup
**Prompt:** "Configure for Vercel deployment with crons and serverless functions."

**AI Generated:**
- [vercel.json](vercel.json) — 3 functions with 60s timeout, daily cron for digest
- [.env.example](.env.example) — All 30+ environment variables documented
- [docs/deploy-hybrid.md](docs/deploy-hybrid.md) — Vercel + VPS hybrid deployment guide
- SQL migration scripts for PostgreSQL schema

### Lesson for Students
> AI introduces bugs. That's normal. The skill is reading error messages, understanding what went wrong, and giving AI the right context to fix it. Debugging with AI is a conversation: "Here's the error. Here's the log. Fix it."

---

## The Numbers

| Metric | Value |
|--------|-------|
| **Total development time** | ~7 days |
| **Lines of code** | ~8,000 TypeScript |
| **Files generated** | 80+ source files |
| **API routes** | 20+ endpoints |
| **Tools integrated** | 16 |
| **AI providers** | 7 |
| **Models available** | 25+ |
| **Code I wrote by hand** | <5% (mostly config tweaks and prompt engineering) |
| **Deployed** | Vercel (production) |

---

## The Workflow (Repeatable Process)

```
Step 1: PRD (Claude Code)
   "Here's what I want to build. Write the PRD."
   → Review, cut scope, finalize requirements
        ↓
Step 2: System Prompt (Claude Code)
   "Design the AI personality and rules."
   → Customize voice, safety, memory behavior
        ↓
Step 3: UI Design (UX Pilot)
   "Design these screens with this aesthetic."
   → Get design spec + HTML prototypes
        ↓
Step 4: Code Generation (Claude Code)
   "Build [feature] based on [design spec]."
   → Review, test, fix bugs (iterate)
        ↓
Step 5: Integration (Claude Code)
   "Connect [external service] as a tool."
   → Test API calls, handle errors
        ↓
Step 6: Intelligence Layer (Claude Code)
   "Add resilience, cost control, self-repair."
   → The features that make it production-grade
        ↓
Step 7: Deploy (Vercel + Claude Code)
   "Configure deployment, migrations, env vars."
   → Push to GitHub → auto-deploy
```

---

## What AI Can't Do (What You Still Need)

1. **Architecture decisions** — AI suggests everything. You decide what's right for your scale.
2. **Scope control** — AI will happily build forever. You say "stop, ship it."
3. **Security review** — AI misses auth edge cases. You catch them.
4. **Integration testing** — AI writes code that compiles. You verify it works end-to-end.
5. **Product taste** — AI doesn't know what feels good. You do.
6. **Debugging judgment** — AI can fix bugs, but knowing WHICH bug matters is your job.

---

## For Educators: How to Teach This

### Live Class Structure (Recommended)

1. **Show the final product** (5 min) — Demo the live app, voice, tools
2. **Show this document** (5 min) — Walk through the phases
3. **Open the PRD** — Show what AI generated vs what you changed
4. **Open UX Pilot output** — Show design spec, then show the actual running UI
5. **Open Claude Code** — Live-demo generating a new feature or fixing a bug
6. **Show the git log** — Every commit tells the story of iterative AI-assisted development
7. **Key takeaway:** You are the architect. AI is the builder. Neither works alone.

### Student Exercise
Give students a mini version of this workflow:
1. Write a PRD for a simple app (AI-generated, they review and edit)
2. Generate UI design with UX Pilot
3. Build the app with Claude Code
4. Deploy to Vercel
5. Present: "What did AI do? What did you do? What did you fix?"

---

## Repository

- **GitHub:** [github.com/aiagentwithdhruv/angelina-vercel-app](https://github.com/aiagentwithdhruv/angelina-vercel-app)
- **README:** Accurate technical documentation of the deployed system
- **All files referenced above** are in this repository

---

**Questions?** Reach out on [LinkedIn](https://linkedin.com/in/aiwithdhruv) or [email](mailto:aiwithdhruv@gmail.com).
