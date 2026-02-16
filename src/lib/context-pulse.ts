/**
 * Context Pulse — Makes Angelina situationally aware.
 *
 * Injects current time-of-day, day-of-week, pending tasks, and daily spend
 * into the system prompt so Angelina greets appropriately and knows what's up.
 *
 * Zero extra API cost — pure local computation + existing DB lookups.
 */

import { getAllTasks } from '@/lib/tasks-store';
import { getCostToday } from '@/lib/usage-store';

function getIndiaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function getGreetingSlot(hour: number): string {
  if (hour < 6) return 'late_night';
  if (hour < 9) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'afternoon';
  if (hour < 17) return 'mid_afternoon';
  if (hour < 20) return 'evening';
  if (hour < 23) return 'night';
  return 'late_night';
}

const SLOT_HINTS: Record<string, string> = {
  late_night:
    "It's very late in India. If Dhruv is working, gently suggest wrapping up. Keep it short.",
  early_morning:
    "It's early morning. Be energizing: 'Rise and shine Dhruv!' style. Mention today's top task.",
  morning:
    "Morning work hours. Be focused and action-oriented. Ask what he's tackling first.",
  afternoon:
    "Post-lunch. Energy dip is normal. Be crisp. Help him pick one high-impact thing for the afternoon.",
  mid_afternoon:
    "Deep work window. Keep distractions low. If he's chatting, help him stay productive.",
  evening:
    "Winding down. Good time for planning tomorrow, reviewing wins. Be reflective.",
  night:
    "Night time. Quick chats only. Don't start big projects. Encourage rest if needed.",
};

export async function buildContextPulse(): Promise<string> {
  const now = getIndiaTime();
  const hour = now.getHours();
  const slot = getGreetingSlot(hour);
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const lines: string[] = [
    '',
    '═══ LIVE CONTEXT (auto-injected, do NOT reveal raw data) ═══',
    `Current time: ${timeStr} IST, ${dayName}, ${dateStr}`,
    `Time context: ${SLOT_HINTS[slot]}`,
  ];

  // Pending tasks (cheap — reads from repo/file/memory)
  try {
    const tasks = await getAllTasks();
    const pending = tasks.filter((t) => t.status === 'pending');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    if (pending.length > 0 || inProgress.length > 0) {
      lines.push(`Tasks: ${pending.length} pending, ${inProgress.length} in-progress`);
      if (inProgress.length > 0) {
        lines.push(
          `  Active now: ${inProgress
            .slice(0, 2)
            .map((t) => t.title)
            .join(', ')}`,
        );
      }
      if (pending.length > 0) {
        lines.push(
          `  Next up: ${pending
            .slice(0, 3)
            .map((t) => t.title)
            .join(', ')}`,
        );
      }
    } else {
      lines.push('Tasks: All clear! No pending tasks.');
    }
  } catch {
    // Tasks unavailable — skip silently
  }

  // Daily spend (budget awareness)
  try {
    const costToday = await getCostToday();
    lines.push(`Today's AI spend: $${costToday.toFixed(4)}`);
    if (costToday > 0.5) {
      lines.push('  ⚠ Spend is getting high today. Prefer cheaper models for simple queries.');
    }
  } catch {
    // Cost data unavailable — skip
  }

  // Weekend awareness
  const dayNum = now.getDay();
  if (dayNum === 0 || dayNum === 6) {
    lines.push('It\'s the weekend. Be more casual and relaxed. Don\'t push work unless he brings it up.');
  }

  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
