# Hybrid Deployment (Vercel + VPS Worker)

This setup keeps the app fast on Vercel while moving stateful/always-on jobs to VPS.

## Split of Responsibilities

- Vercel:
  - Next.js frontend
  - `/api/chat` orchestration
  - Telegram webhook ingress
  - Stateless provider calls
- VPS:
  - Postgres (`pgvector`) and Redis
  - background scheduler/reminders
  - optional worker API for long-running jobs

## 1) Provision Infrastructure

- Postgres 15+ with `pgvector` extension enabled
- Redis instance for future queue workers
- VPS with Node 20+ and PM2/systemd

## 2) Apply Database Schema

Run:

```bash
psql "$POSTGRES_URL" -f sql/001_memory_schema.sql
psql "$POSTGRES_URL" -f sql/002_tasks_usage_schema.sql
```

## 3) Migrate Existing Memory

Set:

- `POSTGRES_URL`
- `OPENAI_API_KEY` (optional but recommended for embedding generation)

Then run:

```bash
npx tsx scripts/migrate-memory-to-postgres.ts
npx tsx scripts/migrate-tasks-usage-to-postgres.ts
```

## 4) Configure Vercel

Add environment variables from `docs/ops-env-vars.md`.

Important:

- `MEMORY_BACKEND=postgres`
- `POSTGRES_URL=...`
- `OPENAI_API_KEY=...`

## 5) Configure VPS Worker

Use `src/worker/scheduler.ts` helpers for cron jobs:

- daily digest generation
- pending task reminders

Example cron cadence:

- Daily digest at `08:00`
- Pending reminders every `3h` during workday

## 6) Validation Checklist

- `/api/chat` returns 200 on Vercel
- memory save/recall returns semantic results
- costs and routing metadata visible in usage logs
- Telegram webhook endpoint healthy
- scheduler job produces digest payload locally

