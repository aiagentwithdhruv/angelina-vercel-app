import { NextRequest, NextResponse } from 'next/server';
import {
  listConversations,
  createConversation,
  loadMessages,
  saveMessage,
  updateConversationTitle,
  deleteConversation,
  autoTitle,
} from '@/lib/conversations-repository';

// GET /api/conversations — list all conversations, or load one by ?id=xxx
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      // Load messages for a specific conversation
      const messages = await loadMessages(id);
      return NextResponse.json({ messages });
    }

    // List all conversations
    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load' }, { status: 500 });
  }
}

// POST /api/conversations — create conversation, save message, update title, or delete
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const conv = await createConversation(body.title || 'New chat');
        return NextResponse.json({ conversation: conv });
      }

      case 'save_message': {
        const { conversationId, role, content, model, toolUsed } = body;
        if (!conversationId || !role || !content) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const msg = await saveMessage(conversationId, role, content, model, toolUsed);

        // Auto-title on first user message
        if (role === 'user' && body.isFirstMessage) {
          await autoTitle(conversationId, content);
        }

        return NextResponse.json({ message: msg });
      }

      case 'rename': {
        const { conversationId, title } = body;
        if (!conversationId || !title) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        await updateConversationTitle(conversationId, title);
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const { conversationId } = body;
        if (!conversationId) {
          return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }
        await deleteConversation(conversationId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
