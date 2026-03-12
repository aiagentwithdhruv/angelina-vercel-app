import { NextResponse } from 'next/server';
import { getSupabaseUserId } from '@/lib/supabase/server';
import { generateMorningBrief } from '@/lib/morning-brief';
import { getTaskRepository } from '@/lib/tasks-repository';
import { getGraph } from '@/lib/knowledge-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSupabaseUserId();
    const tasksRepo = getTaskRepository();
    const tasks = await tasksRepo.getAll();
    const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').map((t) => t.title);
    let knowledgeHighlight = '';
    if (userId) {
      try {
        const graph = await getGraph(userId, 20);
        if (graph.nodes.length > 0) {
          const recent = graph.nodes.slice(0, 3).map((n) => n.title);
          knowledgeHighlight = `You've been thinking about: ${recent.join(', ')}.`;
        }
      } catch {
        // ignore
      }
    }
    const brief = await generateMorningBrief(
      null,
      [], // Calendar: could be wired to Google Calendar
      pending,
      '', // Goal summary: could be wired to goals
      knowledgeHighlight,
    );
    return NextResponse.json(brief);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
