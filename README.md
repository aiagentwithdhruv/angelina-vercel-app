# Angelina AI System

> A world-class, future-proof AI operating system that can talk, see, remember, plan, and execute tasks end-to-end.

**Built by:** [Dhruv Tomar](https://linkedin.com/in/aiwithdhruv) | **Brand:** [AiwithDhruv](https://agenticaisolutonshub.com/)

> Deploy-ready: Postgres + Supabase, cost-aware routing, hybrid Vercel/VPS.

---

## 🎯 Vision

Build a personal and business AI operating system with:
- **Voice-first interaction** with real-time conversation and interruption handling
- **Video avatar** for human-like presence
- **Persistent memory** (short-term + long-term + knowledge graph)
- **Agentic automation** across tools and apps (MCP, n8n, APIs)
- **Multi-modal inputs** (voice, text, vision)

---

## 📁 Repository Structure

```
Angelina/
├── README.md                    # This file
├── ANGELINA-SYSTEM-PROMPT.md    # Core system prompt (v0.1)
├── PRD-TECH-STACK.md           # Product requirements + tech stack
├── REFERENCE-IMPLEMENTATIONS.md # Research and patterns
├── Social Media Agent/          # Automated content posting
│   ├── OVERVIEW.md
│   ├── PROMPTS.md
│   ├── SCHEDULE.md
│   └── TOOLS.md
├── Automation/                  # n8n workflows
│   └── n8n/
└── docs/                       # Additional documentation
```

---

## 🛠 Tech Stack (Recommended)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js + Tailwind + WebRTC |
| **Backend** | FastAPI (Python) + Node.js |
| **Agent Framework** | LangGraph |
| **Automation** | n8n |
| **Vector DB** | pgvector → Qdrant |
| **Voice ASR** | Deepgram / Whisper |
| **Voice TTS** | ElevenLabs / PlayHT / Azure |
| **Realtime Voice** | OpenAI Realtime API |
| **Avatar** | HeyGen / D-ID / MuseTalk |

---

## 🎤 Core Capabilities

### Voice & Avatar
- Real-time voice conversation with interruption handling
- Video avatar interaction (Phase 2+)
- Speech-to-speech with tool calling

### Memory & Context
- Short-term memory (session context)
- Long-term memory (vector DB + metadata)
- Knowledge graph (entities, relationships)
- Retrieval before every major task

### Task Execution
- Tool usage via MCP and workflow automation
- Research, summarize, and draft content
- Execute tasks and update task boards
- Resume screening, candidate ranking, AI-led interviews

---

## 🗓 Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 0** | PRD, architecture, tech decisions | ✅ Complete |
| **Phase 1** | Web UI + chat + basic tools + memory | 🔄 In Progress |
| **Phase 2** | Voice + streaming + automation at scale | ⏳ Planned |
| **Phase 3** | Avatar + multi-agent + mobile app | ⏳ Planned |
| **Phase 4** | Marketplace + enterprise features | ⏳ Future |

---

## 📱 Social Media Agent

Automated content creation and posting for:

| Platform | Content Type | Frequency |
|----------|--------------|-----------|
| LinkedIn | Post + Image | 1/day |
| Twitter/X | Tweet + Image | 2-3/day |
| Instagram | Video (avatar) | 3/week |
| YouTube | Shorts + Long | 2/week |

**Tech:** fal.ai (images) + Groq (LLM) + Edge TTS + n8n (posting)

---

## 💰 Pricing (Future SaaS)

| Tier | Price | Features |
|------|-------|----------|
| **Personal** | $29-79/mo | AI operator for daily work |
| **Pro/Agency** | $149-499/mo | Team workflows, client-specific assistants |
| **Enterprise** | $2,000+/mo | Custom deployment, security, compliance |

---

## 🔗 Links

- **Demo:** [End-to-end AI Product](https://youtu.be/N1btQ3VaKQQ)
- **Agentic AI:** [Self-hosted Demo](https://www.youtube.com/live/jQqFbps-Z0k)
- **Voice Agents:** [Real-time AI Voice](https://youtu.be/3hzoRwTRuTU)
- **Calendly:** [Book a Call](https://calendly.com/aiwithdhruv/makeaiworkforyou)

---

## Hybrid Production Notes

- Memory now supports Postgres + `pgvector` (recommended for Vercel deployments).
- Cost routing policy is defined in `cost-policy.json`.
- Deployment runbook: `docs/deploy-hybrid.md`
- Environment contracts: `docs/ops-env-vars.md`

## Vercel Quick Deploy

1. Import this repository in Vercel.
2. Add environment variables from `.env.example` (use real secrets in Vercel UI).
3. Ensure these are set:
   - `POSTGRES_URL`
   - `MEMORY_BACKEND=postgres`
   - `TASKS_BACKEND=postgres`
   - `USAGE_BACKEND=postgres`
   - `OPENAI_API_KEY`
4. Deploy from `main`.
5. Verify endpoints:
   - `/api/tasks`
   - `/api/usage`
   - `/api/worker/digest` (include `x-worker-key` if `WORKER_API_KEY` is set)

---

## 📄 License

Private repository. All rights reserved.

---

**Contact:** [aiwithdhruv@gmail.com](mailto:aiwithdhruv@gmail.com) | [LinkedIn](https://linkedin.com/in/aiwithdhruv)
