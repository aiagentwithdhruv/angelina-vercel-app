# Setup: Record (Keep this record) + Sign-in

## 1. OpenAI key (transcription)

- **One key for everything:** The app uses a single `OPENAI_API_KEY` for chat, Realtime voice, and **Whisper transcription**.
- **Where:** Add in `.env.local` in the project root:
  ```env
  OPENAI_API_KEY=sk-your-key-here
  ```
- **For "Keep this record" with Whisper:** Also set:
  ```env
  RECORD_TRANSCRIPTION_PROVIDER=whisper
  ```
  If you omit this, the app uses Euri (set `EURI_API_KEY` instead). No separate "record" API key is needed.

---

## 2. SQL tables to run

You already have some schemas in Supabase (e.g. Personal Knowledge Graph, Multi-user Profiles, Chat Conversations, Task and Usage Tracking, Semantic memory). The app expects these **tables** with compatible columns:

| Table | Purpose |
|-------|---------|
| `memory_entries` | Semantic memory (001) |
| `tasks`, `usage_logs` | Tasks and cost tracking (002) |
| `conversations`, `conversation_messages` | Chat history (003) |
| `profiles` + `user_id` on above | Multi-user (004) |
| `knowledge_nodes`, `knowledge_edges` | Brain / "Keep this record" (005) |

**If you already have most of these:** run **one** file in Supabase SQL Editor:

- **`sql/006_angelina_gaps_safe.sql`** — Adds only what's missing: `knowledge_edges`, RLS policies, `user_id` columns, indexes, and the `handle_new_user` trigger. Safe to run multiple times. If you get "relation X does not exist", create that table first (run the matching 001/002/003 below).

**If you're starting from scratch or tables differ:** run in order in SQL Editor:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `sql/001_memory_schema.sql` | memory_entries + pgvector |
| 2 | `sql/002_tasks_usage_schema.sql` | tasks, usage_logs |
| 3 | `sql/003_conversations_schema.sql` | conversations, conversation_messages |
| 4 | `sql/004_multi_user.sql` | profiles, user_id, RLS, trigger |
| 5 | `sql/005_knowledge_graph.sql` | knowledge_nodes, knowledge_edges |

- Enable **pgvector** in Supabase (Database → Extensions → `vector`) before running 001 or 005.

**Pushing via Supabase CLI (from your machine):** Link once with `npx supabase link --project-ref YOUR_REF`, then run the SQL files in the SQL Editor (or put them in `supabase/migrations/` and use `npx supabase db push`). The repo cannot push to your project from here; you run the SQL or CLI locally with your Supabase access.

---

## 3. Sign-in (so you can log in)

The app supports two auth modes. **You need to be signed in for "Keep this record" to save to your graph** (Supabase mode).

### Option A: Supabase (recommended for "Keep this record")

1. **Env in `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
2. **Supabase Dashboard → Authentication → URL Configuration:**
   - Site URL: `http://localhost:3000` (dev) or your production URL.
   - Redirect URLs: add `http://localhost:3000/api/auth/callback` and `https://your-domain.com/api/auth/callback`.
3. **Restart dev server** after changing env (`npm run dev`).
4. **Sign up:** Open `/login`, click "Sign up", enter email and password. Confirm email if Supabase requires it (check inbox or disable "Confirm email" in Supabase Auth settings for testing).
5. **Sign in:** Use the same email/password (or "Sign in with Google" if you configured Google OAuth in Supabase).

If sign-in fails:

- **"Invalid login credentials"** → Wrong password or email not confirmed.
- **Redirect to login again after Google** → Add the exact redirect URL (`/api/auth/callback`) in Supabase Redirect URLs.
- **"Sign-in was cancelled or failed"** → Usually OAuth redirect/code exchange; check Redirect URLs and try email/password.

### Option B: Legacy (single user, no Supabase)

1. **Do not set** `NEXT_PUBLIC_SUPABASE_URL` (and anon key). The app will show the simple "Sign in to continue" form.
2. **Env in `.env.local`:**
   ```env
   AUTH_EMAIL=your@email.com
   AUTH_PASSWORD=your-password
   ```
3. **Sign in:** Open `/login`, enter that exact email and password.

**Note:** With legacy auth there is no Supabase user id, so **"Keep this record" will return "Sign in to save context"** (401). To save recordings to the graph, use Option A (Supabase).

---

## Quick checklist

- [ ] `OPENAI_API_KEY` in `.env.local` (and `RECORD_TRANSCRIPTION_PROVIDER=whisper` if you want Whisper for record).
- [ ] SQL run in order: 001 → 002 → 003 → 004 → 005 (Supabase/Postgres).
- [ ] Supabase: URL + anon key in `.env.local`, Redirect URLs include `/api/auth/callback`, then Sign up on `/login` and Sign in.
