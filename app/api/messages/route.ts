import { NextRequest, NextResponse } from 'next/server';
import { createMessage, getConversationMessages } from '@/lib/db/services/messageService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, senderId, conversationId, files } = body;

    if (!content || !senderId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create encrypted message
    const message = await createMessage({
      content,
      senderId,
      conversationId,
      files,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: message.id 
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Get and decrypt messages
    const messages = await getConversationMessages(conversationId, limit, cursor);

    return NextResponse.json({ 
      success: true, 
      messages 
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}