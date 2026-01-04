import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Make request to the WebSocket server to get online users for this conversation
    const websocketUrl = process.env.WEBSOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${websocketUrl}/api/conversation/${conversationId}/online-users`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch online users from WebSocket server');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching conversation online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}