import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/middleware/verifyToken';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;

    // Verify user is a member of this conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId: chatId,
        userId: user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this conversation' },
        { status: 403 }
      );
    }

    // Get all unread messages in this conversation (not sent by the user)
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: chatId,
        senderId: { not: user.id },
        readReceipts: {
          none: {
            userId: user.id
          }
        }
      },
      select: {
        id: true
      }
    });

    // Create read receipts for all unread messages
    if (unreadMessages.length > 0) {
      await prisma.readReceipt.createMany({
        data: unreadMessages.map((message: { id: string }) => ({
          messageId: message.id,
          userId: user.id
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({
      success: true,
      markedAsRead: unreadMessages.length
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}