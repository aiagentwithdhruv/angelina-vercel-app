# Environment Contracts

## Vercel (Web/API)

- `MEMORY_BACKEND=postgres`
- `TASKS_BACKEND=postgres`
- `USAGE_BACKEND=postgres`
- `DATA_BACKEND=postgres` (optional umbrella default)
- `POSTGRES_URL=postgres://...`
- `POSTGRES_SSL=disable` (optional for trusted private networks)
- `OPENAI_API_KEY=...` (chat + embeddings)
- `ANTHROPIC_API_KEY=...`
- `GEMINI_API_KEY=...`
- `PERPLEXITY_API_KEY=...`
- `OPENROUTER_API_KEY=...`
- `MOONSHOT_API_KEY=...`
- `TELEGRAM_BOT_TOKEN=...` (if Telegram webhook is enabled)
- `GITHUB_TOKEN=...` (optional long-term memory sync)
- `NEXT_PUBLIC_APP_URL=https://your-domain`

## VPS (Worker + Data Plane)

- `POSTGRES_URL=postgres://...`
- `POSTGRES_SSL=disable` (or leave unset for SSL)
- `REDIS_URL=redis://...`
- `OPENAI_API_KEY=...` (if worker runs embedding jobs)
- `WORKER_API_KEY=...` (if exposing worker endpoints)
- `TZ=Asia/Kolkata` (or your timezone)

## Optional Cost Policy Tuning

Policy file:

- `cost-policy.json`

Tune these values:

- `dailyBudgetUsd`
- `sessionBudgetUsd`
- tier model order in `tiers`

