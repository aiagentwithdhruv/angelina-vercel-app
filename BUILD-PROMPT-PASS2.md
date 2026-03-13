# Angelina AI — Pass 2 Build Prompt (Polish & Missing Pieces)

> All major features are BUILT. This prompt covers polish, missing integrations, and the remaining items from Dhruv's vision.

---

## Project Context

**Path:** `/Volumes/Dhruv_SSD/AIwithDhruv/Claude/angelina-vercel-clean/`
**Read `CLAUDE.md` FIRST** — full architecture, design system, engineering rules.

---

## What's DONE (DO NOT rebuild)

| Feature | Status | Key Files |
|---------|--------|-----------|
| Multi-user auth (Supabase) | Done | `src/lib/supabase/`, `sql/004_multi_user.sql`, `src/middleware.ts` |
| Knowledge Graph | Done | `knowledge-repository.ts`, `knowledge-extractor.ts`, `/brain` page, `sql/005_knowledge_graph.sql` |
| Morning Brief | Done | `morning-brief.ts`, `/api/brief`, auto-shows in chat on first visit of day |
| Proactive Engine | Done (182 lines) | `proactive-engine.ts` — overdue tasks, stale follow-ups, goal drift, spend alerts, calendar prep |
| Proactive Banner | Done | `proactive-banner.tsx` wired into `page.tsx` |
| Dashboard Redesign | Done (7 cards) | `src/components/dashboard/` — BriefCard, TasksCard, GoalsCard, KnowledgeCard, UsageCard, InsightsCard, WeeklyCard |
| Voice Ambient Mode | Done | `useAngelinaVoice.ts` — wake word "Hey Angelina", auto-reconnect, `isAmbientActive` state |
| Voice FAB | Done | `voice-fab.tsx` — long-press ambient toggle, breathing animation, tooltip |
| Cleanup | Done | `angelina-context.ts` generic, Dhruv-specific data removed, docs organized into `docs/` |
| Conversation persistence | Done | Postgres tables, auto-load last conversation, sidebar |
| Password masking | Done | `maskSensitive()` in chat page |

---

## What Needs Polish / Testing

### 1. Build Verification & TypeScript Fixes
- Run `npm run build` and fix any TypeScript errors
- The proactive engine imports (`getPgPool`, `getTaskRepository`, `getActiveGoals`, `getCostToday`, `getNodesByType`, `getGoogleAccessToken`, `calendar`) — verify these all export correctly from their source files
- If any imports fail, add the missing exports or adjust the import paths

### 2. CalendarCard Missing from Dashboard
- The dashboard has 7 cards but NO `CalendarCard.tsx` — it was in the design but not created
- Create `src/components/dashboard/CalendarCard.tsx`:
  - Fetch from `/api/tools/google_calendar` (action: list_events)
  - Show next 3-5 events with time and title
  - If Google not connected, show "Connect Google Calendar in Settings"
  - Link to Google Calendar
- Add to dashboard grid between BriefCard and TasksCard

### 3. Voice FAB Breathing Animation CSS
- The FAB uses `animate-[breath_3s_ease-in-out_infinite]` but this custom keyframe may not be defined in `tailwind.config.ts`
- Check if it works. If not, add to `tailwind.config.ts`:
  ```js
  keyframes: {
    breath: {
      '0%, 100%': { boxShadow: '0 0 10px rgba(0,200,232,0.2)' },
      '50%': { boxShadow: '0 0 25px rgba(0,200,232,0.4)' },
    }
  },
  animation: {
    breath: 'breath 3s ease-in-out infinite',
  }
  ```

### 4. Proactive Insights Storage (Optional)
- Currently `proactive-engine.ts` generates insights on-the-fly per request
- For better UX, consider adding a `proactive_insights` table:
  ```sql
  CREATE TABLE proactive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    action_suggestion TEXT,
    priority VARCHAR(10) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'unread', -- unread, read, dismissed, acted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acted_at TIMESTAMPTZ
  );
  ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users own insights" ON proactive_insights FOR ALL USING (auth.uid() = user_id);
  ```
- Update `/api/worker/tick` to generate and store insights periodically instead of on every page load
- This is optional but reduces latency on the chat page

### 5. Hide Broken/Unfinished Pages from New Users
- `/social` page — check if it's functional. If not, hide from navigation for non-admin users
- `/activity` page — if incomplete, hide or simplify
- Only show in nav for Dhruv (admin) or when features are complete

### 6. Settings Page — BYOK (Bring Your Own Key)
- The multi-user system supports BYOK but the settings page may not have the UI for it
- Check `src/app/settings/page.tsx` — add a section for:
  - "API Keys" — user can add their own OpenRouter key
  - If key exists → use it for all requests (unlimited)
  - If no key → use platform key with free tier limits
- Store encrypted in `user_api_keys` table (from `sql/004_multi_user.sql`)

### 7. Onboarding Flow for New Users
- When a brand new user signs up, they should get:
  1. Welcome message from Angelina: "Hi! I'm Angelina. What should I call you?"
  2. After they respond, Angelina saves their name to `profiles` table
  3. Quick tour prompt: "Want a quick tour? I can show you what I can do."
  4. If yes → guided walkthrough (tasks, voice, brain, dashboard)
- Check if this exists in `angelina-context.ts`. If not, add first-time detection logic in the chat page.

---

## Build Order

1. **Build verification** — `npm run build`, fix any errors
2. **CalendarCard** — quick win, fills the dashboard gap
3. **Breathing animation CSS** — quick fix if missing
4. **Hide broken pages** — nav cleanup
5. **Onboarding flow** — critical for new user experience
6. **BYOK settings** — important for technical users
7. **Insights storage** — optimization, can wait

---

## Critical Rules

1. **DO NOT touch** working features — chat, brain, voice, proactive engine, dashboard cards
2. **Use existing design system** — `bg-gunmetal/50`, `border-steel-dark`, `text-cyan-glow`, `font-orbitron`
3. **Mobile-first** — everything must work on mobile
4. **Test chat after every change** — send a message, verify streaming works
5. **Build must pass** — `npm run build` with zero errors before calling it done

---

## Success Criteria

1. `npm run build` passes with zero errors
2. Dashboard has 8 cards (7 existing + CalendarCard)
3. Voice FAB breathing animation works in ambient mode
4. New user gets a welcome/onboarding flow
5. Settings page has BYOK API key input
6. Broken pages hidden from nav
7. Everything works on mobile
