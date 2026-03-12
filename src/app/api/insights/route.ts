import { NextResponse } from 'next/server';
import { getSupabaseUserId } from '@/lib/supabase/server';
import { runProactiveChecks } from '@/lib/proactive-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSupabaseUserId();
    if (!userId) return NextResponse.json({ insights: [] });
    const insights = await runProactiveChecks(userId);
    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json({ insights: [] });
  }
}
