/**
 * Proactive Heartbeat — Makes Angelina feel like Jarvis.
 *
 * Runs every 15 minutes (before task execution in tick).
 * Silently checks email, calendar, GitHub, and VPS health.
 * Only alerts Dhruv when something actually needs attention.
 *
 * COST: $0 — all checks are direct API calls, no LLM needed.
 * DEFAULT: SILENCE. Only pushes when an alert condition is met.
 */

import { getGoogleAccessToken } from './google-auth';
import { pushToTelegram } from './proactive-push';
import { getPgPool } from './db';

export interface HeartbeatAlert {
  source: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
}

// ── Urgent Email Check ──
// Scans unread emails for urgent keywords — no LLM needed.

const URGENT_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'deadline', 'invoice',
  'payment', 'interview', 'offer letter', 'final notice',
  'action required', 'expiring', 'critical', 'emergency',
  'time sensitive', 'respond', 'overdue',
];

async function checkUrgentEmails(): Promise<HeartbeatAlert[]> {
  const alerts: HeartbeatAlert[] = [];

  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return alerts;

    // Fetch last 10 unread emails
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is%3Aunread',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!listRes.ok) return alerts;

    const listData = await listRes.json();
    const messageIds: string[] = (listData.messages || []).map((m: any) => m.id);
    if (messageIds.length === 0) return alerts;

    // Fetch headers for each (batch-friendly — only Subject + From)
    const urgentEmails: Array<{ from: string; subject: string }> = [];

    for (const msgId of messageIds.slice(0, 10)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!msgRes.ok) continue;

      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';

      const textToCheck = `${subject} ${from}`.toLowerCase();
      if (URGENT_KEYWORDS.some((kw) => textToCheck.includes(kw))) {
        urgentEmails.push({ from: from.split('<')[0].trim(), subject });
      }
    }

    if (urgentEmails.length > 0) {
      alerts.push({
        source: 'email',
        message: [
          `*Urgent Email${urgentEmails.length > 1 ? 's' : ''}*`,
          ...urgentEmails.map((e) => `  From: ${e.from}\n  Subject: ${e.subject}`),
        ].join('\n'),
        priority: 'urgent',
      });
    }
  } catch (err) {
    console.warn('[Heartbeat:email] Check failed:', (err as Error).message);
  }

  return alerts;
}

// ── Upcoming Meeting Check ──
// Alerts if there's a meeting in the next 30 minutes.

async function checkUpcomingMeetings(): Promise<HeartbeatAlert[]> {
  const alerts: HeartbeatAlert[] = [];

  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return alerts;

    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000); // 30 min ahead

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${soon.toISOString()}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!calRes.ok) return alerts;

    const calData = await calRes.json();
    const events = calData.items || [];

    for (const event of events) {
      const summary = event.summary || 'Untitled';
      const start = event.start?.dateTime || event.start?.date;
      const startTime = start ? new Date(start) : null;
      const minsUntil = startTime ? Math.round((startTime.getTime() - now.getTime()) / 60000) : null;

      const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || '';

      alerts.push({
        source: 'calendar',
        message: [
          `*Meeting in ${minsUntil} min*`,
          `  ${summary}`,
          meetLink ? `  Link: ${meetLink}` : '',
        ].filter(Boolean).join('\n'),
        priority: minsUntil !== null && minsUntil <= 10 ? 'urgent' : 'warning',
      });
    }
  } catch (err) {
    console.warn('[Heartbeat:calendar] Check failed:', (err as Error).message);
  }

  return alerts;
}

// ── GitHub Activity Check ──
// Checks for new notifications (PRs, issues, mentions).

async function checkGitHubActivity(): Promise<HeartbeatAlert[]> {
  const alerts: HeartbeatAlert[] = [];

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return alerts;

    const res = await fetch('https://api.github.com/notifications?participating=true&per_page=5', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) return alerts;

    const notifications = await res.json();
    if (!Array.isArray(notifications) || notifications.length === 0) return alerts;

    const items = notifications.slice(0, 5).map((n: any) => {
      const repo = n.repository?.full_name || '';
      const title = n.subject?.title || '';
      const type = n.subject?.type || '';
      return `  [${type}] ${repo}: ${title}`;
    });

    alerts.push({
      source: 'github',
      message: [`*GitHub (${notifications.length} new)*`, ...items].join('\n'),
      priority: 'info',
    });
  } catch (err) {
    console.warn('[Heartbeat:github] Check failed:', (err as Error).message);
  }

  return alerts;
}

// ── OpenClaw VPS Health Check ──
// Pings OpenClaw on the VPS to make sure it's alive.

async function checkVPSHealth(): Promise<HeartbeatAlert[]> {
  const alerts: HeartbeatAlert[] = [];

  try {
    // Check if OpenClaw gateway is responding
    const vpsUrl = process.env.OPENCLAW_VPS_URL; // e.g., http://72.61.115.79:18789
    if (!vpsUrl) return alerts;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const res = await fetch(`${vpsUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        alerts.push({
          source: 'vps',
          message: `*VPS Alert*: OpenClaw returned ${res.status}. May need restart.`,
          priority: 'warning',
        });
      }
    } catch {
      clearTimeout(timeout);
      alerts.push({
        source: 'vps',
        message: '*VPS Alert*: OpenClaw not responding. Check server.',
        priority: 'urgent',
      });
    }
  } catch (err) {
    console.warn('[Heartbeat:vps] Check failed:', (err as Error).message);
  }

  return alerts;
}

// ── Stale Goals Check ──
// Checks if any goals have been active for 7+ days with low progress.

async function checkStaleGoals(): Promise<HeartbeatAlert[]> {
  const alerts: HeartbeatAlert[] = [];

  try {
    const pool = getPgPool();
    const res = await pool.query(
      `SELECT title, progress, created_at FROM autonomous_goals
       WHERE status = 'active' AND progress < 50
       AND created_at < NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC LIMIT 3`,
    );

    if (res.rows.length > 0) {
      const items = res.rows.map((g: any) => {
        const days = Math.round((Date.now() - new Date(g.created_at).getTime()) / 86400000);
        return `  ${g.title} (${g.progress}%, ${days}d old)`;
      });
      alerts.push({
        source: 'goals',
        message: [`*Stale Goals*`, ...items].join('\n'),
        priority: 'warning',
      });
    }
  } catch {
    // DB unavailable — skip silently
  }

  return alerts;
}

// ── Main Heartbeat Runner ──
// Returns all alerts. Caller decides whether to push to Telegram.

export async function runHeartbeat(): Promise<{
  alerts: HeartbeatAlert[];
  checksRun: number;
  duration_ms: number;
}> {
  const start = Date.now();
  const allAlerts: HeartbeatAlert[] = [];
  let checksRun = 0;

  // Run all checks in parallel for speed
  const checks = await Promise.allSettled([
    checkUrgentEmails(),
    checkUpcomingMeetings(),
    checkGitHubActivity(),
    checkVPSHealth(),
    checkStaleGoals(),
  ]);

  for (const check of checks) {
    checksRun++;
    if (check.status === 'fulfilled') {
      allAlerts.push(...check.value);
    }
  }

  return {
    alerts: allAlerts,
    checksRun,
    duration_ms: Date.now() - start,
  };
}

// ── Push Heartbeat Alerts to Telegram ──

export async function pushHeartbeatAlerts(alerts: HeartbeatAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  // Group by priority
  const urgent = alerts.filter((a) => a.priority === 'urgent');
  const warning = alerts.filter((a) => a.priority === 'warning');
  const info = alerts.filter((a) => a.priority === 'info');

  const sections: string[] = [];

  if (urgent.length > 0) {
    sections.push(urgent.map((a) => a.message).join('\n\n'));
  }
  if (warning.length > 0) {
    sections.push(warning.map((a) => a.message).join('\n\n'));
  }
  if (info.length > 0) {
    sections.push(info.map((a) => a.message).join('\n\n'));
  }

  const msg = sections.join('\n\n---\n\n');
  await pushToTelegram(msg);
}
