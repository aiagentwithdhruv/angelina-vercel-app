/**
 * Preference Tracker — Auto-learns patterns from usage without being asked.
 *
 * Tracks:
 * - Model preferences (which models user switches to most)
 * - Tool usage frequency (most used tools)
 * - Active hours (when user chats most)
 * - Response patterns (tools vs text)
 *
 * Stores in-memory for current session + periodically saves to memory system.
 * Zero extra API cost.
 */

interface UsageEvent {
  model: string;
  tools: string[];
  hour: number;
  dayOfWeek: number;
  timestamp: number;
}

class PreferenceTracker {
  private events: UsageEvent[] = [];
  private maxEvents = 200;

  record(model: string, tools: string[] = []): void {
    const now = new Date();
    this.events.push({
      model,
      tools,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      timestamp: Date.now(),
    });
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getTopModels(limit = 3): Array<{ model: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      counts[e.model] = (counts[e.model] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([model, count]) => ({ model, count }));
  }

  getTopTools(limit = 5): Array<{ tool: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      for (const t of e.tools) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tool, count]) => ({ tool, count }));
  }

  getActiveHours(): { peakHour: number; peakDay: string } {
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const e of this.events) {
      hourCounts[e.hour] = (hourCounts[e.hour] || 0) + 1;
      dayCounts[e.dayOfWeek] = (dayCounts[e.dayOfWeek] || 0) + 1;
    }

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      peakHour: peakHour ? parseInt(peakHour[0]) : 10,
      peakDay: peakDay ? dayNames[parseInt(peakDay[0])] : 'Monday',
    };
  }

  getToolUsageRate(): number {
    if (this.events.length === 0) return 0;
    const toolEvents = this.events.filter((e) => e.tools.length > 0);
    return toolEvents.length / this.events.length;
  }

  /**
   * Build preference summary for context injection.
   */
  buildPreferenceContext(): string | null {
    if (this.events.length < 5) return null; // Not enough data

    const lines: string[] = ['Learned preferences (from usage patterns):'];

    const topModels = this.getTopModels(2);
    if (topModels.length > 0) {
      lines.push(`  Preferred models: ${topModels.map((m) => m.model).join(', ')}`);
    }

    const topTools = this.getTopTools(3);
    if (topTools.length > 0) {
      lines.push(`  Most used tools: ${topTools.map((t) => t.tool).join(', ')}`);
    }

    const toolRate = this.getToolUsageRate();
    if (toolRate > 0.5) {
      lines.push('  Dhruv uses tools frequently. Proactively suggest tool actions.');
    } else if (toolRate < 0.2) {
      lines.push('  Dhruv prefers text conversations. Only use tools when explicitly asked.');
    }

    const { peakHour } = this.getActiveHours();
    if (peakHour >= 9 && peakHour <= 11) {
      lines.push('  Most active in morning — good time for planning.');
    } else if (peakHour >= 14 && peakHour <= 17) {
      lines.push('  Most active in afternoon — deep work time.');
    } else if (peakHour >= 20) {
      lines.push('  Most active at night — keep it focused and concise.');
    }

    return lines.length > 1 ? lines.join('\n') : null;
  }
}

// Singleton
let tracker: PreferenceTracker | null = null;

export function getPreferenceTracker(): PreferenceTracker {
  if (!tracker) tracker = new PreferenceTracker();
  return tracker;
}
