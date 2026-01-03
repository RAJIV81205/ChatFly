import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/middleware/verifyToken';
import prisma from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
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

    // Check if user is member of this conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                profilePicUrl: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages with pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true
          }
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    });

    // Decrypt messages
    const decryptedMessages = await Promise.all(
      messages.map(async (message: any) => {
        try {
          const decryptedContent = decrypt(message.content, message.contentIv);
          return {
            id: message.id,
            content: decryptedContent,
            senderId: message.senderId,
            sender: message.sender,
            createdAt: message.createdAt,
            readReceipts: message.readReceipts
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return {
            id: message.id,
            content: 'Message unavailable',
            senderId: message.senderId,
            sender: message.sender,
            createdAt: message.createdAt,
            readReceipts: message.readReceipts
          };
        }
      })
    );

    // Get other member for private chats
    const otherMember = conversation.members.find(
      (member: any) => member.userId !== user.id
    );

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name || otherMember?.user.fullName || 'Unknown',
        avatar: otherMember?.user.profilePicUrl || null,
        members: conversation.members.map((member: any) => ({
          id: member.user.id,
          name: member.user.fullName,
          username: member.user.username,
          avatar: member.user.profilePicUrl,
          isAdmin: member.isAdmin
        }))
      },
      messages: decryptedMessages, // Already reversed in service
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}