# Angelina → Jarvis: Master Roadmap

> Making Angelina compete with Manus, Devin, OpenClaw, Lindy — a true autonomous AI operating system.

**Started:** March 9, 2026
**Owner:** Dhruv (AiwithDhruv)

---

## Current State (v1.0 — "Smart Chatbot with Cron")

- 18 tools (email, calendar, search, memory, goals, tasks, YouTube, GitHub, etc.)
- Autonomous tick every 15 min (VPS cron → Vercel)
- Goal decomposition (AI breaks goals into executable tasks)
- 5-tier model cost routing (Moonshot free → GPT-4.1 premium)
- Weekly self-reflection (analyze performance → adjust strategy)
- Telegram interface
- Postgres-backed task queue with retry + dependencies

**What's missing:** Computer control, proactive intelligence, multi-agent, voice, content creation, IoT.

---

## Phase 1: Proactive Heartbeat (THE JARVIS UPGRADE)

**Impact:** Highest. This is what makes Jarvis feel like Jarvis — interrupting with relevant info.
**Effort:** 1-2 days

### What it does:
Every 15 min tick, BEFORE executing tasks, Angelina silently checks:

| Check | Source | Alert Only If |
|-------|--------|---------------|
| Urgent email | Gmail API | Subject has: urgent, invoice, payment, deadline, interview |
| Meeting soon | Google Calendar | Event in next 30 min |
| GitHub activity | GitHub API | New PR, issue, or mention |
| Revenue pulse | Stripe/Zoho (via n8n) | New payment or lead |
| VPS health | SSH to 72.61.115.79 | CPU >90%, disk >85%, OpenClaw down |

**DEFAULT: SILENCE.** Only pushes to Telegram when something needs attention.
**Cost: $0** — all checks are API calls, no LLM needed.

### Implementation:
- Add `runHeartbeat()` function to tick/route.ts
- Runs before task execution
- Each check is a simple fetch + condition
- Results pushed via `pushToTelegram()` only when alerting
- New table: `heartbeat_log` (tracks what was checked, when)

---

## Phase 2: OpenClaw Bridge (COMPUTER CONTROL)

**Impact:** High. Gives Angelina hands — she can now DO things on the computer.
**Effort:** 2-3 days

### Architecture:
```
Angelina (Vercel) → HTTP → OpenClaw (VPS:18789) → Execute
                                    ↓
                              Ghost Browser / Shell / File System
```

### New tool endpoints:
- `vps_execute` — Run shell commands on VPS via OpenClaw
- `linkedin_post` — Ghost Browser posts on LinkedIn
- `linkedin_engage` — Ghost Browser likes/comments
- `web_scrape` — Ghost Browser scrapes any URL
- `file_manage` — Read/write files on VPS

### Security:
- WORKER_API_KEY shared between Angelina and OpenClaw
- Allowlist of safe commands
- High-risk actions require Telegram approval

---

## Phase 3: Ghost Browser Deployment

**Impact:** Medium-High. LinkedIn automation, web scraping, form filling.
**Effort:** 2-3 days

### Tasks:
1. Deploy ghost-browser to VPS (Docker)
2. Configure LinkedIn cookies/session
3. Create API wrapper for Angelina to call
4. Add to tick's tool routing

### Capabilities unlocked:
- Auto-post LinkedIn content
- Auto-engage with network (like/comment)
- Apply to Upwork/LinkedIn jobs
- Scrape competitor data
- Fill web forms

---

## Phase 4: Multi-Agent System

**Impact:** High. Specialized agents = better results per task.
**Effort:** 3-5 days

### Agent Registry:
| Agent | Role | Model | Tools |
|-------|------|-------|-------|
| **Angelina Prime** | Orchestrator, personality, routing | GPT-4.1-mini | All (delegates) |
| **Scout** | Research, web search, lead gen | Kimi K2.5 (free) | web_search, web_scrape, wikipedia |
| **Creator** | Content, LinkedIn, thumbnails | GPT-4.1-mini | linkedin_post, image_generate, video_edit |
| **Builder** | Code, GitHub, deployments | GPT-4.1-mini | github, vps_execute, code_review |
| **Ops** | Email, calendar, CRM, health | GPT-4.1-nano | check_email, check_calendar, vps_health |

### How it works:
1. Goal decomposes into tasks
2. Each task tagged with `agent_type` based on title/description
3. Tick routes task to the right agent (different system prompt + tools)
4. Agents share the same Postgres queue but operate independently

---

## Phase 5: Voice Interface (TALK TO JARVIS)

**Impact:** Very High. Voice = the Jarvis experience.
**Effort:** 3-5 days

### Architecture:
```
Microphone → Gemini Live (WebSocket) → Angelina Tools → Response → Speaker
```

### Options:
1. **Mac App** (immediate) — Electron/Swift app with always-listening mic
   - Uses WhisperKit for wake word ("Hey Angelina")
   - Sends to Gemini Live API with Angelina's context
   - Can trigger any Angelina tool via voice

2. **Raspberry Pi 5** (buy ~$80) — Dedicated always-on device
   - ReSpeaker mic array + speaker
   - Runs lightweight voice client
   - Calls Angelina's API for processing
   - LED ring shows status (listening/thinking/speaking)

3. **Phone App** (later) — Capacitor already in Angelina's stack
   - Push-to-talk or wake word
   - Background listening mode

### Hardware to buy:
- **Raspberry Pi 5 8GB** (~$80) — brain
- **ReSpeaker 2-Mic Pi HAT** (~$15) — microphone array
- **3.5" Speaker** (~$10) — audio output
- **Case + power supply** (~$20)
- **Total: ~$125**

---

## Phase 6: Content Creation Tools

**Impact:** Medium. Automates content pipeline end-to-end.
**Effort:** 3-5 days

### New tools:
| Tool | Skill Source | What It Does |
|------|-------------|-------------|
| `generate_image` | nano-banana / fal.ai | AI image generation |
| `generate_thumbnail` | thumbnail-generator | YouTube thumbnail prompts |
| `edit_video` | video-edit | Silence removal, captions, crop |
| `create_presentation` | Gamma MCP | Slides from topic |
| `generate_diagram` | handdrawn-diagram | Whiteboard infographic prompts |

### Content pipeline (fully autonomous):
```
Goal: "Post 3 LinkedIn posts about AI agents this week"
  ↓
Task 1: Scout researches trending AI agent topics (web_search)
Task 2: Creator writes post #1 (AI reasoning)
Task 3: Creator generates image for post #1 (generate_image)
Task 4: Ghost Browser posts on LinkedIn (linkedin_post)
Task 5-8: Repeat for posts #2, #3
Task 9: Angelina reports results to Dhruv (Telegram)
```

---

## Phase 7: IoT + Smart Home

**Impact:** Cool factor. Physical world Jarvis.
**Effort:** 5-7 days

### What:
- Mac Control MCP (already built) → control apps, windows, volume
- HomeKit integration → lights, AC, locks
- Raspberry Pi sensors → temperature, motion, presence detection

### Voice + IoT combined:
"Angelina, I'm going to sleep" →
  1. Dim lights (HomeKit)
  2. Set alarm for 7 AM (calendar)
  3. Show tomorrow's schedule (Telegram)
  4. Turn off Mac display (Mac Control)

---

## Priority Order

| # | Phase | Impact | Effort | Start |
|---|-------|--------|--------|-------|
| 1 | Proactive Heartbeat | Highest | 1-2 days | NOW |
| 2 | OpenClaw Bridge | High | 2-3 days | After Phase 1 |
| 3 | Ghost Browser Deploy | Medium-High | 2-3 days | After Phase 2 |
| 4 | Multi-Agent System | High | 3-5 days | After Phase 3 |
| 5 | Voice Interface | Very High | 3-5 days | After Phase 4 |
| 6 | Content Creation | Medium | 3-5 days | Parallel with 5 |
| 7 | IoT + Smart Home | Cool | 5-7 days | After Phase 5 |

**Total: ~4-6 weeks to full Jarvis**

---

## Model Strategy

| Tier | Model | Cost | Use For |
|------|-------|------|---------|
| FREE | Kimi K2.5 (Moonshot) | $0 | Research, simple tasks |
| FREE | Groq Llama 4 Scout | $0 | Formatting, summaries |
| CHEAP | GPT-4.1-nano | ~$0.00005/task | Simple completions |
| CHEAP | Gemini 2.5 Flash | ~$0.0001/task | Content, analysis |
| MID | GPT-4.1-mini | ~$0.001/task | Tool calling, orchestration |
| PREMIUM | GPT-4.1 / Claude Sonnet | ~$0.01/task | Critical decisions only |

**Add to Vercel env:** GEMINI_API_KEY, GROQ_API_KEY (both free tier)
**Estimated monthly cost:** $2-5/month for full autonomous operation

---

## Success Metrics

- [ ] Angelina proactively alerts 5+ times/day without being asked
- [ ] Posts on LinkedIn autonomously 3x/week
- [ ] Handles email triage without manual checking
- [ ] Voice conversation works hands-free
- [ ] Executes 20+ autonomous tasks/day
- [ ] Weekly cost stays under $5
- [ ] Zero manual intervention needed for routine tasks
