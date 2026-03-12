/**
 * Morning Brief — personalized daily briefing.
 * Sections: greeting, calendar, tasks, goals, knowledge highlight, tip.
 */

export interface MorningBriefSection {
  title: string;
  content: string;
  items?: string[];
}

export interface MorningBrief {
  greeting: string;
  sections: MorningBriefSection[];
  generatedAt: string;
}

export async function generateMorningBrief(
  userName?: string | null,
  calendarEvents: string[] = [],
  pendingTasks: string[] = [],
  goalSummary: string = '',
  knowledgeHighlight: string = '',
): Promise<MorningBrief> {
  const name = userName || 'there';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greeting = `${timeOfDay}, ${name}! Here's your brief for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`;

  const sections: MorningBriefSection[] = [];

  if (calendarEvents.length > 0) {
    sections.push({
      title: 'Today\'s calendar',
      content: 'Upcoming events:',
      items: calendarEvents.slice(0, 5),
    });
  } else {
    sections.push({
      title: 'Today\'s calendar',
      content: 'No events scheduled for today.',
    });
  }

  if (pendingTasks.length > 0) {
    sections.push({
      title: 'Pending tasks',
      content: `${pendingTasks.length} task(s) need your attention:`,
      items: pendingTasks.slice(0, 6),
    });
  } else {
    sections.push({
      title: 'Pending tasks',
      content: 'All caught up — no pending tasks.',
    });
  }

  if (goalSummary) {
    sections.push({
      title: 'Goal progress',
      content: goalSummary,
    });
  }

  if (knowledgeHighlight) {
    sections.push({
      title: 'From your brain',
      content: knowledgeHighlight,
    });
  }

  sections.push({
    title: 'Quick tip',
    content: 'Start with the most important task first. If you need to prioritize, just ask Angelina.',
  });

  return {
    greeting,
    sections,
    generatedAt: new Date().toISOString(),
  };
}
