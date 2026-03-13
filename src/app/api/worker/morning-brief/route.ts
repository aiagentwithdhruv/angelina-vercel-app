/**
 * Morning Brief Worker — Sends a personalized morning summary via Telegram at 8 AM IST.
 * Triggered by Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMorningBrief } from '@/lib/morning-brief';
import { pushToTelegram } from '@/lib/proactive-push';
import { getTaskRepository } from '@/lib/tasks-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  const provided = request.headers.get('x-worker-key');
  if (provided === configured) return true;
  if (request.headers.get('x-vercel-cron')) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasksRepo = getTaskRepository();
    const tasks = await tasksRepo.getAll();
    const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').map((t) => t.title);

    const brief = await generateMorningBrief(null, [], pending, '', '');

    // Format for Telegram
    const parts: string[] = [
      `🌅 *Good Morning!*`,
      '',
      brief.greeting,
      '',
    ];

    for (const section of brief.sections || []) {
      parts.push(`*${section.title}*`);
      if (section.content) parts.push(section.content);
      if (section.items?.length) {
        section.items.forEach((item: string) => parts.push(`  • ${item}`));
      }
      parts.push('');
    }

    parts.push('_Your AI is ready. Just say the word._');

    const message = parts.join('\n');

    const pushed = await pushToTelegram(message);

    return NextResponse.json({
      success: true,
      pushed,
      brief,
      message,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
