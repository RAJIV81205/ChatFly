import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/middleware/verifyToken';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
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

    const { participantUsername, type = 'PRIVATE' } = await request.json();

    if (!participantUsername) {
      return NextResponse.json(
        { error: 'Participant username is required' },
        { status: 400 }
      );
    }

    // Find the other user
    const otherUser = await prisma.user.findFirst({
      where: {
        username: participantUsername,
        emailVerified: true
      }
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (otherUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        members: {
          every: {
            userId: {
              in: [user.id, otherUser.id]
            }
          }
        }
      },
      include: {
        members: true
      }
    });

    if (existingConversation && existingConversation.members.length === 2) {
      return NextResponse.json({
        success: true,
        conversation: {
          id: existingConversation.id,
          type: existingConversation.type,
          name: otherUser.fullName
        }
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: type as 'PRIVATE' | 'GROUP',
        name: type === 'GROUP' ? `Chat with ${otherUser.fullName}` : null,
        members: {
          create: [
            {
              userId: user.id,
              isAdmin: true
            },
            {
              userId: otherUser.id,
              isAdmin: false
            }
          ]
        }
      },
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

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        type: conversation.type,
        name: otherUser.fullName,
        members: conversation.members
      }
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}