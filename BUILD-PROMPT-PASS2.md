# Angelina AI — Second Pass Build Prompt

> This is a CONTINUATION of previous work. Tasks 1-3 and 7 are DONE. This prompt completes Tasks 4-6 which were left as stubs, plus fixes missing pieces.

---

## Project Context

**Path:** `/Volumes/Dhruv_SSD/AIwithDhruv/Claude/angelina-vercel-clean/`
**Read `CLAUDE.md` FIRST** — full architecture, design system, engineering rules.

### What's Already Done (DO NOT redo):
- Task 7: Cleanup — `angelina-context.ts` is now generic/multi-user, Dhruv-specific data removed
- Task 1: Multi-user — Supabase Auth (`src/lib/supabase/`), middleware, RLS, `sql/004_multi_user.sql`
- Task 2: Knowledge Graph — `knowledge-repository.ts`, `knowledge-extractor.ts`, `/brain` page, `sql/005_knowledge_graph.sql`, entity extraction in chat route
- Task 3: Morning Brief — `morning-brief.ts`, `/api/brief`, basic dashboard card
- Brain page (`src/app/brain/page.tsx`) — list view with search, filter, detail panel (211 lines, working)
- Proactive banner component (`src/components/ui/proactive-banner.tsx`) — UI done, fetches from `/api/insights`
- Insights API (`src/app/api/insights/route.ts`) — wired to `runProactiveChecks()`, working
- Voice hook (`src/hooks/useAngelinaVoice.ts`) — has `ambient` type defined, not implemented

### What's a STUB and needs real implementation:

1. **`src/lib/proactive-engine.ts`** — Only 21 lines. Returns empty array. NO actual checks.
2. **Voice ambient mode** — Just a string type `"ambient"` in the hook. No wake word, no VAD, no always-listening.
3. **Dashboard** — Still the old billing/usage page. Morning Brief card was added at top but the rest wasn't redesigned.

---

## TASK A: Proactive Engine (complete the stub)

**File:** `src/lib/proactive-engine.ts` (currently 21 lines, returns `[]`)

Replace with a real implementation that checks:

### 1. Overdue Tasks
```typescript
// Query tasks where status='pending' and created_at < 3 days ago
// "You have 3 tasks that are overdue. Reschedule or knock them out?"
```
- Use `tasks-repository.ts` pattern (Postgres + file fallback)
- Import `getPgPool` from `@/lib/db` for Postgres, fall back to `tasks-data.json`
- Filter: `status = 'pending'` AND `created_at < NOW() - INTERVAL '3 days'`
- Priority: `high` if >3 overdue, `medium` if 1-3

### 2. Stale Follow-ups (from Knowledge Graph)
```typescript
// Query knowledge_nodes where type='person' and last_seen < 7 days ago and mention_count >= 3
// "You haven't mentioned [Name] in 12 days. Time to follow up?"
```
- Use `knowledge-repository.ts` — call `getNodesByType(userId, 'person')`
- Filter: `last_seen < NOW() - INTERVAL '7 days'` AND `mention_count >= 3` (important people only)
- Priority: `medium`

### 3. Goal Progress
```typescript
// Query active goals, check if progress is behind pace
// "Your goal [X] is 40% behind pace. Here's what to focus on."
```
- Use `goals-store.ts` — check active goals
- If goal has deadline and progress% < expected%, flag it
- Priority: `high` if >30% behind

### 4. Daily Spend Alert
```typescript
// Check usage_store getCostToday()
// "You've spent $1.50 today (75% of your $2 daily cap)"
```
- Use existing `getCostToday()` from `usage-store.ts`
- Alert at 50%, 75%, 90% thresholds
- Priority: `low` at 50%, `medium` at 75%, `high` at 90%

### 5. Calendar Prep (if Google connected)
```typescript
// Check if there's a meeting in next 30 min
// "Meeting with [Person] in 25 min. Context: last discussed [topic] on [date]."
```
- Only if Google OAuth tokens exist (check `google-tokens.json` or cookies)
- Use `google-services.ts` to get upcoming events
- Cross-reference person names with knowledge graph for context
- Priority: `high`

**Important:** Each check should be wrapped in try/catch so one failure doesn't break others. Return all successful insights sorted by priority (high first).

**Signature stays the same:**
```typescript
export async function runProactiveChecks(userId: string): Promise<ProactiveInsight[]>
```

---

## TASK B: Dashboard Redesign

**File:** `src/app/dashboard/page.tsx` (currently ~400 lines of billing/usage analytics)

Redesign into a **Life Dashboard** — one glance = full context of your life.

### New Layout:
```
┌─────────────────────────────────────────┐
│         Morning Brief (today)           │  ← already exists as card, keep it
├──────────────┬──────────────────────────┤
│  Calendar    │   Tasks Summary          │
│  (next 5     │   ■■■■░░ 4/6 done       │
│   events)    │   3 pending, 1 overdue   │
├──────────────┼──────────────────────────┤
│  Goals       │   Knowledge Graph        │
│  Progress    │   Mini-preview           │
│  ████░ 60%   │   (47 nodes, +3 today)   │
├──────────────┼──────────────────────────┤
│  AI Usage    │   Proactive Insights     │
│  $0.45 today │   2 need attention       │
│  ████░ 23%   │                          │
├──────────────┴──────────────────────────┤
│         Weekly Summary                  │
│   ✓ 12 tasks completed this week       │
│   ✓ 34 conversations                   │
│   ✓ 8 new knowledge nodes              │
└─────────────────────────────────────────┘
```

### Implementation:

1. **Create card components** in `src/components/dashboard/`:
   - `BriefCard.tsx` — Fetch `/api/brief`, show greeting + top 2 sections. Link to chat.
   - `TasksCard.tsx` — Fetch `/api/tasks`, show progress bar (done/total), list overdue. Link to `/tasks`.
   - `GoalsCard.tsx` — Fetch goals from `/api/tools/goals` (action=list), show progress bars.
   - `KnowledgeCard.tsx` — Fetch `/api/knowledge?graph=true`, show node count, edge count, top 3 most-mentioned. Link to `/brain`.
   - `UsageCard.tsx` — Fetch `/api/usage`, show today's cost, progress bar vs $2 cap, top model. Keep this from existing dashboard.
   - `InsightsCard.tsx` — Fetch `/api/insights`, show count + top insight. Amber accent.
   - `WeeklyCard.tsx` — Fetch `/api/usage` with weekly range, show tasks completed, conversations, new nodes.

2. **Dashboard page** — Replace current content with CSS Grid:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <div className="md:col-span-2"><BriefCard /></div>
     <TasksCard />
     <GoalsCard />
     <KnowledgeCard />
     <UsageCard />
     <InsightsCard />
     <div className="md:col-span-2"><WeeklyCard /></div>
   </div>
   ```

3. **Each card pattern:**
   ```tsx
   <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
     <div className="flex items-center gap-2 mb-3">
       <Icon className="w-4 h-4 text-cyan-glow" />
       <h3 className="font-orbitron text-sm font-semibold text-text-secondary">TITLE</h3>
     </div>
     {/* content */}
     <Link href="/page" className="text-xs text-cyan-glow/70 hover:text-cyan-glow mt-3 block">
       View all →
     </Link>
   </div>
   ```

4. **Keep old billing/usage as a separate section** — Don't delete it. Move it below the dashboard cards under a "Detailed Analytics" collapsible section, or put it on a sub-route like `/dashboard/usage`.

5. **Mobile:** 1 column, cards stack vertically. Each card should be compact (not tall).

6. **Empty states:** Each card should handle "no data" gracefully. E.g., TasksCard with 0 tasks shows "No tasks yet. Ask Angelina to create one!"

### Design Rules:
- Use existing design tokens: `bg-gunmetal/50`, `border-steel-dark`, `text-cyan-glow`, `font-orbitron`
- Progress bars: `bg-steel-dark` track, `bg-cyan-glow` fill
- Framer Motion `motion.div` with `initial={{ opacity: 0, y: 10 }}` `animate={{ opacity: 1, y: 0 }}` for card entrance
- Click any card → navigates to detailed page

---

## TASK C: Voice Ambient Mode

**File:** `src/hooks/useAngelinaVoice.ts`

The hook already has `mode: "ambient"` type and `isAmbient` variable. Now implement it.

### What to build:

1. **Always-listening with Gemini Live WebSocket:**
   - When `mode === "ambient"`, auto-connect to Gemini Live API on mount
   - Keep WebSocket open continuously (reconnect on drop)
   - Audio frames flow from microphone to Gemini Live
   - Gemini Live handles VAD (voice activity detection) natively — it knows when user is speaking

2. **Wake word detection ("Hey Angelina"):**
   - Simple approach: Use Gemini Live's own transcription. When transcript contains "hey angelina" or "angelina" at the start → activate and process the rest as a command
   - The hook's `useGeminiLiveVoice.ts` already handles audio capture + transcription. In ambient mode, just check if the transcript starts with a wake word before processing it as a real query
   - If no wake word detected → ignore (don't send to chat API)

3. **Visual states:**
   - Ambient idle: subtle breathing cyan ring on voice FAB (CSS animation)
   - Wake word detected: ring brightens, FAB pulses
   - Processing: existing spinner/waveform
   - Speaking response: existing waveform

4. **Ambient UI (floating orb mode):**
   - When ambient mode is active, add an option to minimize chat to a floating orb
   - The orb shows: waveform when speaking, transcript of last exchange on hover/tap
   - Tap orb → expand back to full chat
   - This is optional/stretch — focus on the wake word + always-listening first

5. **Battery/permission warning:**
   - On mobile, show a one-time warning: "Ambient mode keeps your microphone active and uses more battery."
   - Store dismissal in localStorage

### Integration:
- In the existing voice FAB (`src/components/ui/voice-fab.tsx`), add a long-press or settings option to switch to ambient mode
- When ambient mode is off, everything works exactly as before (push-to-talk/continuous)

### Cost: $0 — Gemini Live API is free for audio

---

## TASK D: Wire ProactiveBanner into Chat Page

**File:** `src/app/page.tsx`

The `<ProactiveBanner />` component exists but is NOT rendered anywhere. Add it to the chat page.

```tsx
import { ProactiveBanner } from '@/components/ui/proactive-banner';

// Inside the return, at the top of the main content area (after header, before messages):
<ProactiveBanner />
```

Place it between the Header and the chat messages area. It auto-hides when no insights exist.

---

## TASK E: Morning Brief Auto-Show in Chat

**File:** `src/app/page.tsx`

When a user opens the app for the first time today, Angelina's first message should be the morning brief — not waiting for them to type.

```typescript
// On mount, check if brief was shown today
useEffect(() => {
  const lastBriefDate = localStorage.getItem('angelina_last_brief_date');
  const today = new Date().toISOString().split('T')[0];
  if (lastBriefDate !== today) {
    fetch('/api/brief')
      .then(res => res.json())
      .then(data => {
        if (data.brief) {
          // Add as first assistant message in the conversation
          setMessages(prev => [{
            role: 'assistant',
            content: data.brief
          }, ...prev]);
          localStorage.setItem('angelina_last_brief_date', today);
        }
      })
      .catch(() => {});
  }
}, []);
```

Only show if the user has no active conversation loaded. Don't override an existing conversation.

---

## Build Order

1. **Task A** — Proactive Engine (most impactful, unblocks Tasks D and dashboard InsightsCard)
2. **Task D** — Wire ProactiveBanner into chat page (5 min, just an import + JSX)
3. **Task B** — Dashboard redesign (biggest visual change)
4. **Task E** — Morning brief auto-show (small, high-retention impact)
5. **Task C** — Voice ambient mode (most complex, can be done last)

---

## Critical Rules

1. **DO NOT touch** `angelina-context.ts`, `CLAUDE.md`, `BUILD-PROMPT.md` — these are finalized
2. **DO NOT rebuild** the brain page, knowledge extractor, auth, or conversation system — they work
3. **Use existing design system** — `bg-gunmetal/50`, `border-steel-dark`, `text-cyan-glow`, `font-orbitron`. Check `tailwind.config.ts`.
4. **Use existing patterns** — Postgres + file fallback for data access. Thin API routes. Check `src/lib/tasks-repository.ts` for the pattern.
5. **Mobile-first** — Dashboard cards must stack on mobile. Voice ambient must work on mobile browsers.
6. **Cost-aware** — Proactive engine runs every 15 min per user. Keep it cheap (DB queries only, no LLM calls). Voice ambient uses Gemini Live (free).
7. **Don't break chat** — Test the chat flow after every change. Send a message, verify streaming works.
8. **Commit after each task** — Don't batch into one commit.

---

## Files to Create/Modify

| Action | File | What |
|--------|------|------|
| **Rewrite** | `src/lib/proactive-engine.ts` | Replace 21-line stub with real checks (overdue tasks, stale follow-ups, goal drift, spend alerts, calendar prep) |
| **Create** | `src/components/dashboard/BriefCard.tsx` | Morning brief card |
| **Create** | `src/components/dashboard/TasksCard.tsx` | Tasks progress card |
| **Create** | `src/components/dashboard/GoalsCard.tsx` | Goals progress card |
| **Create** | `src/components/dashboard/KnowledgeCard.tsx` | Knowledge graph summary card |
| **Create** | `src/components/dashboard/UsageCard.tsx` | AI usage/cost card (extracted from current dashboard) |
| **Create** | `src/components/dashboard/InsightsCard.tsx` | Proactive insights card |
| **Create** | `src/components/dashboard/WeeklyCard.tsx` | Weekly accomplishments card |
| **Rewrite** | `src/app/dashboard/page.tsx` | New grid layout with above cards, old content moved to collapsible section |
| **Modify** | `src/app/page.tsx` | Add `<ProactiveBanner />` + morning brief auto-show on first visit of day |
| **Modify** | `src/hooks/useAngelinaVoice.ts` | Implement ambient mode: auto-connect Gemini Live, wake word detection, visual states |
| **Modify** | `src/components/ui/voice-fab.tsx` | Add ambient mode toggle (long-press or settings) + breathing animation |

---

## Success Criteria

After this pass:
1. `/api/insights` returns real insights (overdue tasks, stale contacts, spend alerts)
2. ProactiveBanner shows at top of chat when insights exist
3. `/dashboard` shows a life dashboard with 7 cards (brief, tasks, goals, knowledge, usage, insights, weekly)
4. Morning brief auto-shows as first message when user opens app for the day
5. Voice ambient mode: microphone stays open, wake word "Hey Angelina" triggers processing, visual feedback on FAB
6. Everything works on mobile
7. Build passes with zero errors
