import { NextResponse } from 'next/server';
import { getSupabaseUserId } from '@/lib/supabase/server';
import { getGraph } from '@/lib/knowledge-repository';

export async function GET() {
  try {
    const userId = await getSupabaseUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await getGraph(userId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
