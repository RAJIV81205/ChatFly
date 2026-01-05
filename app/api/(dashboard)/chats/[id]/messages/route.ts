import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/middleware/verifyToken';
import prisma from '@/lib/db/prisma';
import { decrypt, decryptFileUrl, decryptFileName } from '@/lib/encryption';

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
      select: {
        id: true,
        type: true, // Include the stored message type
        content: true,
        contentIv: true,
        senderId: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true
          }
        },
        files: {
          where: {
            status: 'ACTIVE'
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


    // Get conversation members to calculate status
    const memberIds = conversation.members.map((member: { userId: any; }) => member.userId);

    // Decrypt messages and calculate status
    const decryptedMessages = await Promise.all(
      messages.map(async (message: any) => {
        try {
          const decryptedContent = message.content && message.contentIv 
            ? decrypt(message.content, message.contentIv)
            : null;
          
          // Decrypt file information
          const decryptedFiles = message.files.map((file: any) => {
            try {
              const decryptedFileName = decryptFileName(file.fileName, file.fileNameIv);
              const decryptedFileUrl = decryptFileUrl(file.fileUrl, file.fileUrlIv);
              
              return {
                id: file.id,
                fileName: decryptedFileName,
                fileUrl: decryptedFileUrl,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                createdAt: file.createdAt
              };
            } catch (error) {
              console.error('Failed to decrypt file:', error);
              return null;
            }
          }).filter(Boolean);
          
           let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT';
          if (decryptedFiles.length > 0) {
            const firstFile = decryptedFiles[0];
            if (firstFile.mimeType?.startsWith('image/')) {
              messageType = 'IMAGE';
            } else if (firstFile.mimeType?.startsWith('video/')) {
              messageType = 'VIDEO';
            } else {
              messageType = 'FILE';
            }
          }
          
          // Calculate message status for sender's messages
          let status: 'sent' | 'read' = 'sent';
          
          if (message.senderId === user.id) {
            // Get other members (excluding sender)
            const otherMembers = memberIds.filter((id: any) => id !== user.id);
            
            if (otherMembers.length > 0) {
              // Check if all other members have read the message
              const allRead = otherMembers.every((memberId: any) =>
                message.readReceipts.some((receipt: any) => receipt.userId === memberId)
              );
              
              if (allRead) {
                status = 'read';
              }
            }
          }
          
          return {
            id: message.id,
            content: decryptedContent,
            senderId: message.senderId,
            sender: message.sender,
            createdAt: message.createdAt,
            type: messageType,
            fileUrl: decryptedFiles[0]?.fileUrl,
            fileName: decryptedFiles[0]?.fileName,
            fileSize: decryptedFiles[0]?.fileSize,
            mimeType: decryptedFiles[0]?.mimeType,
            readReceipts: message.readReceipts,
            status
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return {
            id: message.id,
            content: 'Message unavailable',
            senderId: message.senderId,
            sender: message.sender,
            createdAt: message.createdAt,
            type: 'text' as const,
            readReceipts: message.readReceipts,
            status: 'sent' as const
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
      messages: decryptedMessages.reverse(), // Reverse to show oldest first (newest at bottom)
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