import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/middleware/verifyToken';
import prisma from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
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

    // Get user's conversations with latest message
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
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
                profilePicUrl: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          messages: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ]
    });

    // Format conversations for frontend
    const formattedChats = await Promise.all(
      conversations.map(async (conversation: any) => {
        const otherMember = conversation.members.find(
          (member: any) => member.userId !== user.id
        );

        let lastMessage = null;
        if (conversation.messages.length > 0) {
          const msg = conversation.messages[0];
          try {
            // Only decrypt if both content and contentIv exist
            const decryptedContent = msg.content && msg.contentIv 
              ? decrypt(msg.content, msg.contentIv)
              : 'File message';
            
            lastMessage = {
              id: msg.id,
              content: decryptedContent,
              senderId: msg.senderId,
              senderName: msg.sender.fullName,
              createdAt: msg.createdAt
            };
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            lastMessage = {
              id: msg.id,
              content: 'Message unavailable',
              senderId: msg.senderId,
              senderName: msg.sender.fullName,
              createdAt: msg.createdAt
            };
          }
        }

        return {
          id: conversation.id,
          type: conversation.type,
          name: conversation.name || otherMember?.user.fullName || 'Unknown',
          avatar: otherMember?.user.profilePicUrl || null,
          lastSeen: otherMember?.user.lastSeen || null,
          lastMessage,
          members: conversation.members.map((member: any) => ({
            id: member.user.id,
            name: member.user.fullName,
            username: member.user.username,
            avatar: member.user.profilePicUrl,
            isAdmin: member.isAdmin
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      chats: formattedChats,
      user: {
        id: user.id,
        name: user.fullName,
        username: user.username,
        email: user.email,
        avatar: user.profilePicUrl
      }
    });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}