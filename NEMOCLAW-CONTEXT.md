# NemoClaw Integration Context — Angelina AI

> **Status:** Pending integration | **Priority:** Medium | **Effort:** Half-day PoC

## Why NemoClaw for Angelina

Angelina is a 5-agent orchestrator with 30+ tools and pgvector memory. Currently, all agents share the same execution context — any agent can access any tool, any memory, any file.

NemoClaw adds per-agent sandboxing so the Gemini Live voice agent can't accidentally trigger the email agent, and a compromised tool can't access the full memory store.

## Current Architecture (No Isolation)

```
User → Agent Router → 5 Agents (shared context)
                         ├── All 30+ tools accessible by any agent
                         ├── pgvector memory (full read/write)
                         ├── Gemini Live (voice)
                         └── No boundaries between agents
```

## Target Architecture (With NemoClaw)

```
User → Agent Router → NemoClaw Gateway
                         ├── Voice Agent Sandbox (mic/speaker + Gemini only)
                         ├── Research Agent Sandbox (web search + memory read)
                         ├── Action Agent Sandbox (email, calendar, limited tools)
                         ├── Memory Agent Sandbox (pgvector read/write)
                         └── Policy: each agent scoped to its tools only
```

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| Agent isolation | Shared context | Per-agent sandbox |
| Tool access | All 30+ for every agent | Scoped per agent role |
| Memory access | Full pgvector | Scoped (read-only for most agents) |
| Voice agent | Can trigger any tool | Only mic/speaker + Gemini |
| Prompt injection | Full system compromise | Limited to one sandbox |

## Integration Plan

1. Deploy NemoClaw alongside existing Vercel deployment (separate VPS)
2. Create sandbox per agent type (voice, research, action, memory, orchestrator)
3. Configure policies: Gemini API, pgvector, email, calendar, web search
4. Route agent-router through NemoClaw gateway
5. Keep Vercel frontend unchanged — only backend agent execution changes

## Selling Point

Angelina becomes the **secure personal AI** — not just powerful, but trustworthy. Users can grant it access to email, calendar, files knowing each capability is isolated and policy-enforced.

## Live Setup Reference

- **VPS:** 72.61.115.79 (NemoClaw already running)
- **Skill:** `nemoclaw-deploy` in skills library
- **Inference:** Keep existing Gemini + multi-provider, or add Nemotron as fallback
- **Docs:** https://docs.nvidia.com/nemoclaw/latest/
