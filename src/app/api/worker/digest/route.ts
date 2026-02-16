import { NextRequest, NextResponse } from 'next/server';
import { buildDailyDigest, buildPendingReminderMessage } from '@/worker/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const configured = process.env.WORKER_API_KEY;
  if (!configured) return true;
  const provided = request.headers.get('x-worker-key');
  return provided === configured;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const digest = await buildDailyDigest();
  const reminder = await buildPendingReminderMessage();

  return NextResponse.json({
    digest,
    reminder,
  });
}

