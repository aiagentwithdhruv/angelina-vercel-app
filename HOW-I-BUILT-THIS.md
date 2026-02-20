# How I Built a Full AI Operating System Using AI

> A step-by-step breakdown of how I used 6+ AI tools and a modern CI/CD pipeline to go from zero to a production-deployed AI system with 16+ tools, 7 LLM providers, real-time voice, and persistent memory — without writing most of the code by hand.

**Author:** [Dhruv Tomar](https://linkedin.com/in/aiwithdhruv) | AI Educator & Builder

---

## The Complete AI Toolchain

### AI Tools for Building

| Step | AI Tool | What It Did |
|------|---------|-------------|
| Brainstorming & Ideation | **ChatGPT** (OpenAI) | Brainstormed the product concept, explored use cases, refined the storytelling and narrative for what Angelina should be |
| PRD & Architecture | **Claude Code** (Anthropic) | Generated the full product requirements document, tech stack decisions, and system architecture |
| System Prompt | **Claude Code** | Designed Angelina's personality, safety rules, memory behavior, and tool policies |
| UI/UX Design | **UX Pilot** | Generated screen-by-screen design specs, color system, component library, and interaction patterns |
| UI to Code | **UX Pilot** | Converted designs into HTML/CSS prototypes for each screen |
| Full-Stack Code | **Claude Code** | Wrote the entire Next.js application — API routes, components, hooks, database layer, integrations |
| Debugging & Fixes | **Claude Code** | Diagnosed build errors, fixed Edge Runtime issues, rewrote middleware, resolved provider bugs |
| Presentations | **Gamma** | Created demo decks and visual presentations for pitching and teaching |
| Research | **Internet + Docs** | OpenAI docs, Vercel docs, Anthropic docs, Stack Overflow, GitHub repos — fed context to Claude Code to keep it accurate and up-to-date |

### DevOps & Deployment Pipeline

| Tool | Role |
|------|------|
| **GitHub** | Source control, version history, collaboration |
| **Vercel** | Production hosting, serverless functions, edge network |
| **Claude Code + GitHub** | Real-time CI/CD — push to GitHub, Vercel auto-deploys in seconds |
| **Vercel Crons** | Scheduled background jobs (daily digest, notifications) |
| **Supabase PostgreSQL** | Production database with pgvector for semantic search |

### How the CI/CD Works
```
Claude Code writes code
    → git commit + git push (from terminal)
        → GitHub receives the push
            → Vercel detects the push, auto-builds
                → Live in production in ~30 seconds
```
No Jenkins. No Docker. No build scripts. Just push and it's live.

**My role:** Architecture decisions, tool selection, prompt engineering, testing, and quality review. I directed what to build. AI built it.

---

## Phase 0: Brainstorming & Vision (Day 0)

### What I Did
Before writing a single line of code, I spent time with **ChatGPT** just talking through the idea. No structure, no prompts — just a conversation.

### How ChatGPT Helped
- **Concept exploration:** "What would a personal AI OS look like? What's missing from existing assistants?"
- **Storytelling:** Shaped the narrative — Angelina isn't a chatbot, she's an operating system that talks, remembers, acts, and learns
- **Use case mapping:** Brainstormed 30+ use cases, then narrowed to the ones that actually matter
- **Naming & positioning:** Tested different framings until "Personal AI Operating System" clicked
- **Competitive analysis:** "What does Siri/Alexa/Google Assistant NOT do that we can?"

### What I Took Forward
- The core thesis: an AI that doesn't just answer questions but *operates* — checks email, manages tasks, controls costs, remembers everything
- The storytelling angle for teaching: "I built a full production app and AI wrote 95% of the code"
- Clear scope boundaries: voice + memory + tools + cost control = MVP. Everything else is Phase 2+.

### Lesson for Students
> Start messy. ChatGPT is the best brainstorming partner because it never judges your half-formed ideas. Use it to think out loud, explore directions, and find the story. Once you know WHAT to build and WHY, switch to Claude Code for the HOW.

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
After the core app worked, I asked Claude Code to add "intelligence" — features that make the AI smarter, not just functional. This is the layer most people skip, and it's what separates a demo from a product.

### 5.1 Self-Healing & Resilience
| Feature | File | What It Does |
|---------|------|-------------|
| Resilient Provider | [resilient-provider.ts](src/lib/resilient-provider.ts) | Auto-fallback across 7 providers with exponential backoff. If OpenAI is down, it switches to Anthropic, then Google, then OpenRouter — automatically |
| Self-Fix | [self-fix.ts](src/lib/self-fix.ts) | When a tool call fails, the LLM reads the error, diagnoses the problem, and retries with corrected parameters |
| Tool Retry | [tool-retry.ts](src/lib/tool-retry.ts) | Exponential backoff for flaky APIs (rate limits, timeouts) |
| Approval Gate | [approval-gate.ts](src/lib/approval-gate.ts) | Risk scoring before executing dangerous actions — sending emails, deleting data, making calls |

### 5.2 Memory & Context Intelligence
| Feature | File | What It Does |
|---------|------|-------------|
| Conversation Compactor | [conversation-compactor.ts](src/lib/conversation-compactor.ts) | After 15+ turns, summarizes the conversation to stay within context limits — no "lost context" errors |
| Context Pulse | [context-pulse.ts](src/lib/context-pulse.ts) | Injects real-time context (time, date, recent activity, active tasks) into every request |
| Preference Tracker | [preference-tracker.ts](src/lib/preference-tracker.ts) | Learns which models you prefer, which tools you use most, and adapts behavior over time |
| Persistent Memory | [memory.ts](src/lib/memory.ts) | Auto-saves facts, goals, preferences without being asked. Recalls before every major task |

### 5.3 Cost Intelligence
| Feature | File | What It Does |
|---------|------|-------------|
| Smart Upgrade | [smart-upgrade.ts](src/lib/smart-upgrade.ts) | Detects when a question is too complex for the cheap model and auto-escalates — with user approval |
| Cost Policy | [cost-policy.ts](src/lib/cost-policy.ts) | 5-tier routing: simple questions → free/cheap models, complex → premium models |
| Proactive Push | [proactive-push.ts](src/lib/proactive-push.ts) | Sends Telegram alert when you're at 80% of daily budget — before you hit the cap |
| Confidence Scoring | [confidence.ts](src/lib/confidence.ts) | Rates its own confidence per response — low confidence triggers model upgrade |

### 5.4 Heartbeat & Background Intelligence
| Feature | What It Does |
|---------|-------------|
| Daily Digest Cron | Runs every day at 3 AM UTC — summarizes yesterday's activity, costs, and pending tasks, sends to Telegram |
| Scheduler | [src/worker/scheduler.ts](src/worker/scheduler.ts) — Background job runner for notifications, cleanup, and proactive alerts |
| Vercel Crons | Zero-infrastructure scheduled tasks — no server to manage |

### 5.5 Reusable Skills Architecture
Beyond the app itself, I built a **skills library** — 26 reusable automation patterns that Claude Code can draw from:

| Category | Skills |
|----------|--------|
| Lead Generation | Scrape leads, Google Maps leads, classify leads, format names |
| Email & Sales | Gmail management, cold email campaigns, auto-replies, proposals |
| Content | Video editing, YouTube research, title generation |
| Infrastructure | Webhook creation, cloud deployment, local servers |
| Agents | Code reviewer, research agent, QA agent, email classifier |

These skills compound — every automation I build makes the next one faster. Claude Code reads the skill docs and adapts patterns instead of starting from scratch.

### Lesson for Students
> This is where AI-built apps go from "demo" to "product." These features cost $0 in extra API spend but make the system 10x more reliable. The intelligence layer is what your users will never see but always feel. Self-healing, cost awareness, memory, heartbeat — build these into every AI product you ship.

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
| **Total development time** | ~7 days (concept to production) |
| **Lines of code** | ~8,000 TypeScript |
| **Files generated** | 80+ source files |
| **API routes** | 20+ endpoints |
| **Tools integrated** | 16 |
| **AI providers connected** | 7 (OpenAI, Anthropic, Google, Groq, Perplexity, Moonshot, OpenRouter) |
| **Models available** | 25+ |
| **AI tools used to build** | 6 (ChatGPT, Claude Code, UX Pilot, Gamma, Vercel, GitHub) |
| **Reusable skills built** | 26 automation patterns + 4 AI agents |
| **Code I wrote by hand** | <5% (mostly config tweaks and prompt engineering) |
| **Deployment** | Vercel (auto-deploy on git push, ~30s to production) |
| **Monthly infrastructure cost** | ~$0 (Vercel Hobby + free-tier APIs) |

---

## The Workflow (Repeatable Process)

```
Step 0: Brainstorm (ChatGPT)
   "What should this product be? Who is it for? What's the story?"
   → Explore, refine, narrow scope
        ↓
Step 1: PRD (Claude Code)
   "Here's what I want to build. Write the PRD."
   → Review, cut the over-engineering, finalize requirements
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
   "Add resilience, cost control, self-repair, memory, heartbeat."
   → The features that make it production-grade
        ↓
Step 7: Deploy (Claude Code → GitHub → Vercel)
   git push → auto-build → live in 30 seconds
   No Docker. No Jenkins. No build scripts.
        ↓
Step 8: Present (Gamma)
   "Create a deck explaining what we built."
   → Visual presentation for pitching, teaching, demos
        ↓
Step 9: Document & Teach (Claude Code)
   "Write the HOW-I-BUILT-THIS.md."
   → This file. The teaching material writes itself.
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

## Resources & Research That Made This Possible

AI tools alone aren't enough. I fed them context from real documentation and open-source projects to keep the output accurate:

| Resource | How I Used It |
|----------|--------------|
| [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime) | Fed to Claude Code for voice implementation — the API schema changes frequently |
| [Vercel Deployment Docs](https://vercel.com/docs) | Edge Runtime constraints, serverless function limits, cron syntax |
| [Anthropic Claude Docs](https://docs.anthropic.com) | Tool calling format, streaming protocol, system prompt best practices |
| [grammy Telegram Bot Framework](https://grammy.dev) | Bot setup, webhook handling, middleware patterns |
| [pgvector Documentation](https://github.com/pgvector/pgvector) | Semantic search setup for memory system |
| GitHub open-source projects | Studied reference implementations (Project Cyra, various AI assistants) for architecture patterns |
| Stack Overflow + community forums | Edge cases, TypeScript quirks, Next.js App Router gotchas |

### Lesson for Students
> AI doesn't know everything, and its training data has a cutoff. When working with new APIs (OpenAI Realtime launched recently), you MUST feed the current docs to your AI tool. Copy-paste the docs, give it the latest schema, and say "use THIS, not what you remember." That's the difference between code that works and code that almost works.

---

## This Document Is a Living Build Log

This file is designed to grow. As I add features, fix bugs, and learn new patterns, I update this document. If you're reading this in a class or workshop, the version you see reflects the latest state of the project.

### How to Keep Feeding This Doc
If you're building something similar, use this structure:

1. **After each major feature** — Add a new Phase section with "What I Did / What AI Generated / What I Changed / Lesson"
2. **After each bug fix** — Add a row to the bugs table (Phase 6)
3. **After adding a new AI tool** — Add it to "The Complete AI Toolchain" table at the top
4. **After a presentation** — Add notes on what resonated with the audience

The goal: by the time you've shipped your product, this document IS your teaching material. You don't need to create a separate course — the build log is the course.

---

## Repository

- **GitHub:** [github.com/aiagentwithdhruv/angelina-vercel-app](https://github.com/aiagentwithdhruv/angelina-vercel-app)
- **README:** Technical documentation of the deployed system
- **This file:** The story of how it was built
- **Every file linked above** exists in this repository — click through and explore

---

**Questions? Want to learn how to build AI products?**
Reach out on [LinkedIn](https://linkedin.com/in/aiwithdhruv) or [email](mailto:aiwithdhruv@gmail.com).
