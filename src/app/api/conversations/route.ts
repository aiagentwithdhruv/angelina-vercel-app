import { NextRequest, NextResponse } from 'next/server';
import {
  listConversations,
  createConversation,
  getConversation,
  loadMessages,
  saveMessage,
  updateConversationTitle,
  deleteConversation,
  autoTitle,
} from '@/lib/conversations-repository';
import { getSupabaseUserId } from '@/lib/supabase/server';

// GET /api/conversations — list all conversations, or load one by ?id=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = await getSupabaseUserId();
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      const conv = await getConversation(id, userId);
      if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const messages = await loadMessages(id);
      return NextResponse.json({ messages });
    }

    const conversations = await listConversations(50, userId);
    return NextResponse.json({ conversations });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'Failed to load' }, { status: 500 });
  }
}

// POST /api/conversations — create conversation, save message, update title, or delete
export async function POST(req: NextRequest) {
  try {
    const userId = await getSupabaseUserId();
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const conv = await createConversation(body.title || 'New chat', userId);
        return NextResponse.json({ conversation: conv });
      }

      case 'save_message': {
        const { conversationId, role, content, model, toolUsed } = body;
        if (!conversationId || !role || !content) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const msg = await saveMessage(conversationId, role, content, model, toolUsed);
        if (role === 'user' && body.isFirstMessage) await autoTitle(conversationId, content);
        return NextResponse.json({ message: msg });
      }

      case 'rename': {
        const { conversationId, title } = body;
        if (!conversationId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        await updateConversationTitle(conversationId, title, userId);
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const { conversationId } = body;
        if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        await deleteConversation(conversationId, userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'Failed' }, { status: 500 });
  }
}
