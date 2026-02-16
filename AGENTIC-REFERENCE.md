# Angelina AI - Agentic System Reference Document

> Research compiled Feb 9, 2026 — covering OpenClaw, Composio Skills, and agentic architecture patterns for Angelina AI enhancement.

---

## Table of Contents
1. [OpenClaw — What It Is & How It Works](#1-openclaw)
2. [Composio Awesome Claude Skills](#2-composio-awesome-claude-skills)
3. [Memory Systems — Patterns & Implementation](#3-memory-systems)
4. [Multi-Agent Orchestration](#4-multi-agent-orchestration)
5. [Tool Use & MCP (Model Context Protocol)](#5-tool-use--mcp)
6. [Cost Optimization Strategies](#6-cost-optimization)
7. [Framework Comparison](#7-framework-comparison)
8. [Implementation Roadmap for Angelina](#8-implementation-roadmap)
9. [Architecture Diagram](#9-architecture-diagram)

---

## 1. OpenClaw

**Repo**: https://github.com/openclaw/openclaw (179k stars, MIT license)
**Website**: https://openclaw.ai | **Docs**: https://docs.openclaw.ai

### What Is It?
OpenClaw is a self-hosted personal AI assistant that runs on your own devices. It connects to channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat) and runs AI agents locally via a single **Gateway** control plane.

### Key Architecture

```
WhatsApp / Telegram / Slack / Discord / iMessage / WebChat
    │
    ▼
┌─────────────────────────┐
│       Gateway            │
│  (WS control plane)     │
│  ws://127.0.0.1:18789   │
└───────────┬─────────────┘
            │
            ├─ Pi agent (RPC) — the AI brain
            ├─ CLI (openclaw …)
            ├─ WebChat UI
            ├─ macOS app
            └─ iOS / Android nodes
```

- **Gateway**: Single long-lived process that owns all messaging surfaces. WebSocket API for clients.
- **Pi Agent Runtime**: The coding agent that handles reasoning, tool use, and streaming.
- **Sessions**: Per-sender isolated sessions. Direct chats collapse into `main`; groups are isolated.
- **Multi-Agent Routing**: Route inbound messages to different agents based on channel, account, or peer.

### How Memory Works (OpenClaw)

**Session Management**:
- Sessions stored at `~/.openclaw/agents/<agentId>/sessions/`
- Each agent has fully isolated sessions — no cross-talk
- Direct chats collapse to agent's `main` session key
- Group chats get isolated sessions

**Memory Compaction**:
- When session transcripts get too long, OpenClaw compresses them
- Uses AI-based summarization to maintain context while reducing token count
- Configurable compaction thresholds

**Embedding-Based Memory**:
- Supports multiple embedding providers: OpenAI, Gemini, Voyage, and **local** (node-llama-cpp)
- Local embeddings use `embeddinggemma-300M-GGUF` — runs entirely on your machine, zero API cost
- Memory extension: `memory-core` and `memory-lancedb` (vector database)
- Embeddings are normalized and sanitized before storage

**Workspace Files**:
- Each agent has workspace files: `AGENTS.md`, `SOUL.md`, `USER.md`
- These define personality, persona rules, and user context
- Workspace files are injected into the system prompt

### How Multi-Tasking Works (OpenClaw)

**Multi-Agent System**:
- Each agent = isolated brain (workspace + state dir + session store)
- Multiple agents can run on a single Gateway
- Routing rules determine which agent handles which message

**Binding Rules (Deterministic Routing)**:
1. Peer match (exact DM/group/channel id) — most specific
2. Guild/Team match
3. Account match
4. Channel match
5. Fallback to default agent

**Agent-to-Agent Communication**:
- Optional, must be explicitly enabled
- `tools.agentToAgent.enabled: true` with allowlist
- Agents can send messages to other agent sessions

**Session Operations**:
- `sessions_spawn`: Start a sub-agent task
- `sessions_send`: Send message to another session
- `sessions_list`: List all active sessions
- `sessions_history`: Inspect transcript history

### Tools & Skills (OpenClaw)

**Built-in Tools**:
| Tool | Function |
|------|----------|
| `exec` | Shell commands in workspace |
| `browser` | Chrome/Chromium with CDP control (snapshots, actions, screenshots) |
| `canvas` | Agent-driven visual workspace (A2UI) |
| `nodes` | Camera, screen record, location, notifications |
| `web_search` | Brave Search API |
| `web_fetch` | URL content extraction (HTML → markdown) |
| `cron` | Scheduled jobs and wakeups |
| `message` | Cross-channel messaging (WhatsApp, Telegram, Slack, Discord, etc.) |
| `sessions_*` | Multi-session management |
| `memory_*` | Memory search and retrieval |
| `image` | Image analysis with vision models |

**Skills System**:
- Skills are markdown files loaded into agent context
- Three sources: bundled, managed (`~/.openclaw/skills`), workspace (`workspace/skills/`)
- Precedence: workspace > managed > bundled > extra
- Skills have YAML frontmatter for metadata + invocation policies

**Tool Profiles** (presets):
- `coding`: All tools enabled
- `minimal`: Restricted to safe tools
- `byProvider`: Per-model tool restrictions

**Tool Groups** (shorthands):
- `group:fs`: read, write, edit, apply_patch
- `group:runtime`: exec, bash, process
- `group:sessions`: sessions_list, sessions_history, etc.
- `group:web`: web_search, web_fetch
- `group:memory`: memory_search, memory_get

### AI Provider Support (OpenClaw)

**Model APIs**:
- `openai-completions` (OpenAI, OpenRouter, Ollama, etc.)
- `openai-responses` (OpenAI Responses API)
- `anthropic-messages` (Anthropic native)
- `google-generative-ai` (Google/Gemini)
- `github-copilot` (GitHub Copilot)
- `bedrock-converse-stream` (AWS Bedrock)

**Subscription Auth (OAuth)**:
- Anthropic Claude Pro/Max subscription
- OpenAI ChatGPT/Codex subscription
- Auth profiles with rotation and failover

**Provider Failover**:
- Configure fallback models
- Automatic retry on failure
- Per-provider rate limiting and cooldown

### Key Takeaways from OpenClaw for Angelina

1. **Gateway pattern** — single control plane managing all channels
2. **Session isolation** — per-sender, per-agent sessions prevent context bleed
3. **Memory compaction** — AI summarization to control context growth
4. **Local embeddings** — zero-cost vector search using small local models
5. **Skill system** — extensible markdown-based skills loaded into context
6. **Tool profiles** — configurable tool access per agent/provider
7. **Multi-agent routing** — different AI personalities for different channels

---

## 2. Composio Awesome Claude Skills

**Repo**: https://github.com/ComposioHQ/awesome-claude-skills
**License**: Apache 2.0

### Overview
Community-curated list of 145+ skills for Claude across 10 categories.

### Skill Categories Summary

| Category | Count | Examples |
|----------|-------|---------|
| Document Processing | 5 | Word, PDF, PPT, Excel, EPUB |
| Development & Code | 22 | MCP Builder, Playwright, TDD, subagent dispatch |
| Data & Analysis | 4 | CSV analysis, Postgres queries, deep research |
| Business & Marketing | 5 | Lead research, competitive ads, brand guidelines |
| Communication & Writing | 7 | Content writer, meeting analysis, article extraction |
| Creative & Media | 7 | Image generation, D3.js visualization, video download |
| Productivity | 8 | File organizer, n8n-skills, invoice organizer |
| Collaboration | 5 | Git pushing, Google Workspace, code review |
| Security | 4 | Forensics, threat hunting, metadata extraction |
| **App Automation (Composio)** | **78** | Gmail, Slack, GitHub, Salesforce, Shopify, etc. |

### Most Relevant Skills for Angelina

**Tier 1 — Critical**:
1. **Connect (Composio)** — Connects to 1000+ apps via MCP. Handles OAuth automatically.
2. **subagent-driven-development** — Dispatches fresh subagents per task with code review gates.
3. **MCP Builder** — Guide for building Model Context Protocol servers.
4. **n8n-skills** — 542 n8n node definitions, compatibility matrices, workflow templates.

**Tier 2 — High Value**:
5. **Skill Creator** — Meta-skill for building new skills.
6. **Webapp Testing (Playwright)** — Automated web app testing.
7. **deep-research** — Multi-step autonomous research via external AI.
8. **Lead Research Assistant** — Full pipeline: ICP → research → scoring → outreach.

### Key Patterns from Composio Skills

**Pattern 1: Progressive Disclosure (Context Management)**
```
Level 1 — Metadata (~100 words)    → Always in context
Level 2 — SKILL.md body (<5k words) → Loaded when triggered
Level 3 — Bundled resources         → On-demand by Claude
```
This is the key pattern for managing context window budgets.

**Pattern 2: Subagent Dispatch**
```
For each task:
  1. Dispatch fresh subagent (clean context)
  2. Subagent executes and reports
  3. Dispatch code-reviewer subagent
  4. Fix critical issues
  5. Mark complete
Final: Full review of entire implementation
```

**Pattern 3: Black-Box Script Execution**
- Bundle scripts in `scripts/` directory
- Execute without reading source (saves context tokens)
- Run with `--help` first to understand usage

**Pattern 4: Composio Tool Router (Session-Based)**
```typescript
const composio = new Composio();
const session = await composio.create('user_123', {
  toolkits: ['gmail', 'slack', 'github'],
  manageConnections: true
});
// session.mcp.url -> Use with any AI framework
```
Per-user isolated sessions with automatic OAuth handling.

---

## 3. Memory Systems

### Current Angelina Memory Architecture
```
Short-term: JSON file (memory-data.json) — 500 entry cap
Long-term: GitHub API (markdown files in repo)
Search: Keyword matching (string.includes)
Injection: Full memory dump into system prompt
```

### Recommended Upgrade Path

#### Phase 1: Optimized Short-Term Memory (Week 1)
**Problem**: Currently injecting ALL memories into every prompt = token waste.
**Solution**: Semantic search with top-K retrieval.

```typescript
// Instead of injecting all 500 memories:
const relevantMemories = memory.search(userQuery).slice(0, 5);
const memoryContext = relevantMemories.map(m => `- ${m.topic}: ${m.content}`).join('\n');
```

#### Phase 2: Vector Memory with Embeddings (Week 3-4)

**Option A: pgvector via Supabase (Recommended for production)**
- Cost: $0/mo (free tier) to $25/mo (Pro)
- 500k vectors on free tier
- Full SQL support for hybrid search

```sql
-- Create memories table with vector column
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  topic TEXT,
  type TEXT,
  tags TEXT[],
  importance TEXT DEFAULT 'medium',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);

-- Semantic search function
CREATE FUNCTION search_memories(query_embedding VECTOR(1536), match_count INT)
RETURNS SETOF memories AS $$
  SELECT * FROM memories
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

**Option B: Local embeddings (Zero cost, like OpenClaw)**
- Use `transformers.js` or `node-llama-cpp` for local embeddings
- No API calls, no cost
- Slightly lower quality than OpenAI embeddings
- Perfect for personal use

**Option C: ChromaDB (Open-source, self-hosted)**
- In-memory vector database
- No external dependencies
- Good for development, limited for production scale

#### Phase 3: Tiered Memory Architecture (Week 5-6)

```
┌─────────────────────────────────────────────┐
│            Working Memory                     │
│  (Current conversation context)               │
│  - Last 10 messages                           │
│  - Active tool results                        │
│  - Current task state                         │
└──────────────┬──────────────────────────────┘
               │ Overflow → Summarize
┌──────────────▼──────────────────────────────┐
│            Short-Term Memory                  │
│  (Vector DB — pgvector/local)                 │
│  - Recent memories (last 30 days)             │
│  - Semantic search retrieval                  │
│  - Top-5 injected per query                   │
└──────────────┬──────────────────────────────┘
               │ Weekly compression
┌──────────────▼──────────────────────────────┐
│            Long-Term Memory                   │
│  (Compressed summaries + GitHub backup)       │
│  - Monthly summaries                          │
│  - Client profiles                            │
│  - Key decisions                              │
│  - Retrieved only when specifically needed    │
└─────────────────────────────────────────────┘
```

### Memory Compaction (from OpenClaw)

When conversation gets too long:
1. Take the first 70% of messages
2. Summarize them with a cheap model (Gemini Flash)
3. Replace the original messages with the summary
4. Keep the last 30% of messages intact
5. Inject summary as a "context" message

```typescript
async function compactConversation(messages: Message[], maxTokens: number) {
  const estimatedTokens = messages.reduce((sum, m) => sum + m.content.length / 4, 0);

  if (estimatedTokens < maxTokens) return messages;

  const cutoff = Math.floor(messages.length * 0.7);
  const toCompress = messages.slice(0, cutoff);
  const toKeep = messages.slice(cutoff);

  const summary = await generateText({
    model: google('gemini-2.0-flash'), // Cheap model for summarization
    prompt: `Summarize this conversation, preserving key facts, decisions, and context:
             ${toCompress.map(m => `${m.role}: ${m.content}`).join('\n')}`,
    maxTokens: 500,
  });

  return [
    { role: 'system', content: `Previous conversation summary: ${summary.text}` },
    ...toKeep,
  ];
}
```

---

## 4. Multi-Agent Orchestration

### Pattern 1: Supervisor Agent (Recommended for Angelina)

```typescript
// Main agent routes to specialized sub-agents
const supervisorTools = {
  delegate_research: tool({
    description: 'Delegate a research task to the research agent',
    parameters: z.object({ query: z.string(), depth: z.enum(['quick', 'deep']) }),
    execute: async ({ query, depth }) => {
      return await runSubAgent('research', query, depth);
    },
  }),
  delegate_writing: tool({
    description: 'Delegate a writing task to the writing agent',
    parameters: z.object({ type: z.string(), brief: z.string() }),
    execute: async ({ type, brief }) => {
      return await runSubAgent('writing', type, brief);
    },
  }),
  delegate_task: tool({
    description: 'Delegate a task management operation',
    parameters: z.object({ action: z.string(), details: z.string() }),
    execute: async ({ action, details }) => {
      return await runSubAgent('tasks', action, details);
    },
  }),
};
```

### Pattern 2: Parallel Execution

```typescript
// Independent tasks can run in parallel
const [researchResult, emailDrafts, taskUpdate] = await Promise.all([
  runSubAgent('research', 'competitor analysis'),
  runSubAgent('writing', 'draft replies to 3 emails'),
  runSubAgent('tasks', 'update ClickUp with meeting notes'),
]);
```

### Pattern 3: n8n Workflow Trigger

For complex multi-step workflows, trigger n8n:

```typescript
const triggerN8nWorkflow = tool({
  description: 'Trigger an n8n workflow for complex automation',
  parameters: z.object({
    workflowId: z.string(),
    data: z.record(z.any()),
  }),
  execute: async ({ workflowId, data }) => {
    const response = await fetch(`http://localhost:5678/webhook/${workflowId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
});
```

---

## 5. Tool Use & MCP

### Model Context Protocol (MCP)

MCP is Anthropic's standard for connecting LLMs to external tools/services. Think of it as a USB port for AI — any tool that speaks MCP can connect to any LLM.

**Key MCP Servers to Consider**:
| Server | Function | Use Case for Angelina |
|--------|----------|----------------------|
| `@modelcontextprotocol/server-filesystem` | File read/write | Local file operations |
| `@modelcontextprotocol/server-github` | GitHub API | Code management |
| `@modelcontextprotocol/server-brave-search` | Web search | Research |
| `@modelcontextprotocol/server-postgres` | Database | Data queries |
| `composio` | 1000+ SaaS apps | Gmail, Slack, ClickUp, etc. |

### Building Custom MCP Tools (Best Practices from MCP Builder Skill)

1. **Build for workflows, not API endpoints** — Consolidate related operations
2. **Optimize for limited context** — Return high-signal data, offer concise vs. detailed modes
3. **Actionable error messages** — Guide agents toward correct tool usage
4. **Tool annotations** — Mark with `readOnlyHint`, `destructiveHint`, `idempotentHint`
5. **Character limits** — Cap responses at 25,000 tokens

### Tool Design for Angelina

```typescript
// Example: Well-designed tool with modes
const webSearch = tool({
  description: 'Search the web. Use mode="quick" for facts, "deep" for research.',
  parameters: z.object({
    query: z.string(),
    mode: z.enum(['quick', 'deep']).default('quick'),
    maxResults: z.number().default(5),
  }),
  execute: async ({ query, mode, maxResults }) => {
    const results = await tavily.search({ query, maxResults });

    if (mode === 'quick') {
      // Return just answers and snippets (fewer tokens)
      return results.results.map(r => ({
        title: r.title,
        snippet: r.content.slice(0, 200),
        url: r.url,
      }));
    }

    // Deep mode: return full content
    return results;
  },
});
```

---

## 6. Cost Optimization

### Strategy 1: Model Routing (Biggest Impact — saves 60-80%)

Route simple queries to cheap models, complex ones to expensive models.

```typescript
type ModelTier = 'cheap' | 'mid' | 'premium';

function classifyComplexity(message: string): ModelTier {
  const len = message.length;
  const hasCode = /```|function |class |import /.test(message);
  const hasAnalysis = /analyze|compare|evaluate|research|strategy/i.test(message);
  const isSimple = /^(hi|hello|thanks|yes|no|ok|what time|weather)/i.test(message);

  if (isSimple || len < 50) return 'cheap';
  if (hasCode || hasAnalysis || len > 500) return 'premium';
  return 'mid';
}

function getModelForTier(tier: ModelTier): string {
  switch (tier) {
    case 'cheap': return 'google/gemini-2.0-flash'; // ~$0.10/1M tokens
    case 'mid': return 'openai/gpt-4o-mini';        // ~$0.15/1M tokens
    case 'premium': return 'anthropic/claude-sonnet-4-5'; // ~$3/1M tokens
  }
}
```

### Strategy 2: Prompt Caching (saves 90% on system prompt)

**Anthropic**: Native prompt caching — first call costs 1.25x, subsequent calls 0.1x
**OpenAI**: Automatic for prompts >1024 tokens — 50% discount

Since Angelina sends system prompt + memory context (~2000 tokens) with EVERY message, caching this saves significantly.

### Strategy 3: Selective Memory Injection

**Current**: Inject ALL memories (~500 entries) = massive token cost
**Better**: Inject only top-5 relevant memories per query

```typescript
// Before: ~2000 tokens of memory injected every call
const allMemory = memory.getMemoryContext(); // All 500 entries

// After: ~200 tokens of relevant memory
const relevant = await memory.semanticSearch(userMessage, 5);
const context = relevant.map(m => `- ${m.topic}: ${m.content}`).join('\n');
```

### Strategy 4: Message Trimming

```typescript
function trimConversation(messages: Message[], maxTokens: number = 4000) {
  // Always keep: system prompt + last 3 exchanges
  const system = messages.filter(m => m.role === 'system');
  const recent = messages.slice(-6); // Last 3 user-assistant pairs
  const middle = messages.slice(system.length, -6);

  let tokens = 0;
  const kept = [];
  for (const msg of middle) {
    const est = msg.content.length / 4;
    if (tokens + est > maxTokens * 0.5) break;
    kept.push(msg);
    tokens += est;
  }

  return [...system, ...kept, ...recent];
}
```

### Strategy 5: Tool Result Compression

```typescript
// Compress large tool results with a cheap model
async function compressToolResult(result: string, query: string): Promise<string> {
  if (result.length < 1000) return result; // Small enough, no compression

  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: `Extract only relevant info answering: "${query}"\n\nData: ${result.slice(0, 10000)}`,
    maxTokens: 500,
  });
  return text;
}
```

### Strategy 6: Batch Processing (50% discount)

Use OpenAI Batch API for non-urgent tasks:
- Weekly LinkedIn content generation
- Bulk email draft replies
- Memory summarization
- Report generation

### Cost Estimates

| Component | Angelina (Personal) | Smart AI Chat (SaaS) |
|-----------|-------------------|---------------------|
| LLM Calls | $5-20/mo (with routing) | $100-800/mo |
| Embeddings | $0-2/mo | $10-50/mo |
| Vector DB | $0 (local/Supabase free) | $0-70/mo |
| **Total** | **$5-22/mo** | **$110-920/mo** |

---

## 7. Framework Comparison

### What to Use When

| Use Case | Framework | Why |
|----------|-----------|-----|
| Angelina chat + tools | **Vercel AI SDK** (already using) | Native Next.js, multi-provider |
| Complex multi-step workflows | **n8n** (already have 199 workflows) | Visual, schedulable, webhooks |
| RAG / Document processing | **LangChain.js** for ingestion | Best RAG tooling |
| Multi-agent reasoning | **LangGraph.js** | Graph-based state management |
| Team-of-agents | **CrewAI** (Python FastAPI) | Role-based agent collaboration |
| Browser automation | **Playwright** | Full browser control |
| Tool integration standard | **MCP** (Model Context Protocol) | Universal tool interface |

### Vercel AI SDK (Keep as Core)

**Strengths**:
- Native TypeScript/Next.js
- Unified API across 20+ providers
- Built-in streaming, tool calling, Zod schemas
- `maxSteps` for multi-step agents
- Active development

**What's Missing** (layer on top):
- No built-in multi-agent orchestration → build with supervisor pattern
- No built-in memory management → implement with pgvector
- No built-in workflow engine → use n8n

### Don't Rewrite — Extend

Your current Vercel AI SDK setup is solid. Layer capabilities:
- Add model routing for cost optimization
- Add pgvector for semantic memory
- Add MCP for tool extensibility
- Use n8n for complex workflows
- Add LangGraph only if you need stateful multi-agent loops

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Model Router** — Route simple→Gemini Flash, complex→Claude Sonnet
2. **Conversation Compaction** — Summarize old messages with cheap model
3. **Error Resilience** — Auto-fallback between providers
4. **Tool Result Compression** — Compress large results before sending to LLM

### Phase 2: Enhanced Memory (Week 3-4)
1. **Semantic Search** — Replace keyword search with embedding-based
2. **Selective Injection** — Top-5 relevant memories per query (not all 500)
3. **Memory Summarization** — Weekly batch job via n8n
4. **Prompt Caching** — Enable Anthropic/OpenAI prompt caching

### Phase 3: Multi-Agent (Week 5-6)
1. **Supervisor Agent** — Route to specialized sub-agents
2. **Parallel Execution** — `Promise.all` for independent tasks
3. **n8n Integration** — Trigger workflows for complex automation

### Phase 4: Advanced (Week 7-8)
1. **MCP Servers** — Filesystem, GitHub, database tools
2. **Browser Automation** — Playwright for web research
3. **Dynamic Tool Loading** — Load tools based on configured integrations
4. **Observability** — Langfuse for LLM call tracing

---

## 9. Architecture Diagram

```
                    ┌────────────────────────┐
                    │    User Interface       │
                    │  (Next.js Frontend)     │
                    │  Chat | Voice | Mobile  │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │   API Route Layer       │
                    │  (Next.js API Routes)   │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │   Agent Orchestrator    │
                    │  (Vercel AI SDK)        │
                    │                         │
                    │  ┌─ Model Router ─────┐ │
                    │  │ simple → Flash     │ │
                    │  │ medium → GPT-4o    │ │
                    │  │ complex → Claude   │ │
                    │  └───────────────────┘ │
                    │                         │
                    │  ┌─ Tool Registry ────┐ │
                    │  │ Built-in tools     │ │
                    │  │ MCP servers        │ │
                    │  │ n8n webhooks       │ │
                    │  └───────────────────┘ │
                    │                         │
                    │  ┌─ Memory Manager ───┐ │
                    │  │ Semantic search    │ │
                    │  │ Top-K retrieval    │ │
                    │  │ Auto-compaction    │ │
                    │  └───────────────────┘ │
                    └──────────┬─────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
   ┌───────▼──────┐   ┌───────▼──────┐   ┌───────▼──────┐
   │  Sub-Agents   │   │    Tools     │   │   Memory     │
   │               │   │              │   │              │
   │ • Research    │   │ • Web Search │   │ • Working    │
   │ • Writing     │   │ • Email/Cal  │   │   (context)  │
   │ • Tasks       │   │ • Browser    │   │ • Short-term │
   │ • Analysis    │   │ • ClickUp    │   │   (pgvector) │
   │               │   │ • MCP Tools  │   │ • Long-term  │
   └───────────────┘   └───────────────┘   │   (GitHub)   │
                                           └──────────────┘
           │                   │                   │
   ┌───────▼───────────────────▼───────────────────▼───────┐
   │               External Services                        │
   │                                                        │
   │ LLMs: OpenAI, Anthropic, Google, OpenRouter            │
   │ Data: Supabase (pgvector), Redis                       │
   │ Automation: n8n (199 workflows), GitHub, ClickUp       │
   │ Search: Tavily, Brave                                  │
   │ Channels: WhatsApp, Telegram (future via OpenClaw)     │
   └────────────────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Core framework | Keep Vercel AI SDK | Already working, excellent Next.js integration |
| Memory DB | pgvector (Supabase) | Free tier, SQL support, production-ready |
| Workflow engine | Keep n8n | Already have 199 workflows, visual builder |
| Cost optimization | Model routing + prompt caching | Biggest bang for buck, 70%+ savings |
| Multi-agent | Supervisor pattern (not CrewAI) | Stays in TypeScript, no Python service needed |
| Tool standard | MCP | Industry standard, future-proof |
| Channel expansion | Consider OpenClaw patterns | WhatsApp/Telegram integration patterns |
| Observability | Langfuse (self-hosted) | Free, open-source, Vercel AI SDK compatible |

---

*This document is a living reference. Update as implementation progresses.*
*Last updated: Feb 9, 2026*
