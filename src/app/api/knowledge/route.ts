import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserId } from '@/lib/supabase/server';
import { getGraph, getNodesByType, upsertNode } from '@/lib/knowledge-repository';
import type { NodeType } from '@/lib/knowledge-repository';

export async function GET(req: NextRequest) {
  try {
    const userId = await getSupabaseUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const type = req.nextUrl.searchParams.get('type') as NodeType | null;
    const graph = req.nextUrl.searchParams.get('graph') === 'true';

    if (graph) {
      const data = await getGraph(userId);
      return NextResponse.json(data);
    }
    if (type) {
      const nodes = await getNodesByType(userId, type);
      return NextResponse.json({ nodes });
    }
    const data = await getGraph(userId);
    return NextResponse.json({ nodes: data.nodes, edges: data.edges });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSupabaseUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, title, content, metadata } = body;
    if (!type || !title) return NextResponse.json({ error: 'type and title required' }, { status: 400 });

    const node = await upsertNode(userId, type, title, content ?? null, metadata ?? {});
    return NextResponse.json({ node });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
