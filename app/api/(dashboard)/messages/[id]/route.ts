import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/middleware/verifyToken";
import { prisma } from "@/lib/db/prisma";
import { decryptMessage, decryptFileName, decryptFileUrl } from "@/lib/encryption";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user from token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: messageId } = await params;

    // Fetch the message with all related data
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicUrl: true,
          },
        },
        files: true,
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        conversation: {
          include: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user is a member of the conversation
    const isMember = message.conversation.members.some(
      (member: any) => member.userId === user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Decrypt message content and files
    const decryptedContent = message.content 
      ? decryptMessage(message.content, message.contentIv!)
      : null;

    const decryptedFiles = message.files.map((file: any) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    }));

    // Determine message type
    let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT';
    if (message.files.length > 0) {
      const firstFile = message.files[0];
      if (firstFile.mimeType?.startsWith('image/')) {
        messageType = 'IMAGE';
      } else if (firstFile.mimeType?.startsWith('video/')) {
        messageType = 'VIDEO';
      } else {
        messageType = 'FILE';
      }
    }

    // Calculate message status for sender
    let status: 'sent' | 'read' = 'sent';
    if (message.senderId === user.id) {
      const otherMembers = message.conversation.members.filter(
        (m: any) => m.userId !== user.id
      );
      const allRead = otherMembers.every((member: any) =>
        message.readReceipts.some((receipt: any) => receipt.userId === member.userId)
      );
      status = allRead ? 'read' : 'sent';
    }

    const formattedMessage = {
      id: message.id,
      content: decryptedContent,
      senderId: message.senderId,
      sender: message.sender,
      createdAt: message.createdAt.toISOString(),
      type: messageType,
      fileUrl: decryptedFiles[0]?.fileUrl,
      fileName: decryptedFiles[0]?.fileName,
      fileSize: decryptedFiles[0]?.fileSize,
      mimeType: decryptedFiles[0]?.mimeType,
      files: decryptedFiles,
      readReceipts: message.readReceipts,
      status,
    };

    return NextResponse.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}