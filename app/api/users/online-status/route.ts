import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    
    if (userIds.length === 0) {
      return NextResponse.json({ onlineStatus: {} });
    }

    // Make request to the WebSocket server to get online status
    const websocketUrl = process.env.WEBSOCKET_URL || 'http://localhost:3001';
    const response = await fetch(`${websocketUrl}/api/users/online-status?userIds=${userIds.join(',')}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch online status from WebSocket server');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching online status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online status' },
      { status: 500 }
    );
  }
}