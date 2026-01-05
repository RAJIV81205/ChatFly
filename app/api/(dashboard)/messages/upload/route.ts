import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createMessage } from "@/lib/db/services/messageService";
import prisma from "@/lib/db/prisma";
import { decryptMessage, decryptFileName, decryptFileUrl } from "@/lib/encryption";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* =========================
   POST /api/messages/upload
========================= */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const senderId = formData.get("senderId") as string | null;
    const conversationId = formData.get("conversationId") as string | null;
    const content = formData.get("content") as string | null; // optional caption

    if (!file || !senderId || !conversationId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    /* =========================
       Upload to Cloudinary
    ========================= */

    let uploadResult: { url: string; publicId: string };
    let mimeType = file.type;
    let fileSize = file.size;

    if (file.type.startsWith("image/")) {
      uploadResult = await uploadToCloudinary(
        file,
        `chat-files/${conversationId}`
      );
      mimeType = "image/webp";
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());

      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `chat-files/${conversationId}`,
              resource_type: "raw"

            },
            (error, result) => {
              if (error || !result) reject(error);
              else
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
            }
          )
          .end(buffer);
      });
    }

    /* =========================
       Delegate EVERYTHING
       to message service
    ========================= */

    const message = await createMessage({
      senderId,
      conversationId,
      content: content ?? undefined,
      files: [
        {
          fileName: file.name,
          fileUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
          fileSize,
          mimeType,
        },
      ],
    });

    // Fetch the message with all related data
    const messageToSend = await prisma.message.findUnique({
      where: { id: message.id },
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

    if (!messageToSend) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Decrypt message content and files
    const decryptedContent = messageToSend.content
      ? decryptMessage(messageToSend.content, messageToSend.contentIv!)
      : null;

    const decryptedFiles = messageToSend.files.map((file: any) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    }));

    // Determine message type
    let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT';
    if (messageToSend.files.length > 0) {
      const firstFile = messageToSend.files[0];
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
    if (messageToSend.senderId === senderId) {
      const otherMembers = messageToSend.conversation.members.filter(
        (m: any) => m.userId !== senderId
      );
      const allRead = otherMembers.every((member: any) =>
        messageToSend.readReceipts.some((receipt: any) => receipt.userId === member.userId)
      );
      status = allRead ? 'read' : 'sent';
    }

    const formattedMessage = {
      id: messageToSend.id,
      content: decryptedContent,
      senderId: messageToSend.senderId,
      sender: messageToSend.sender,
      createdAt: messageToSend.createdAt.toISOString(),
      type: messageType,
      fileUrl: decryptedFiles[0]?.fileUrl,
      fileName: decryptedFiles[0]?.fileName,
      fileSize: decryptedFiles[0]?.fileSize,
      mimeType: decryptedFiles[0]?.mimeType,
      files: decryptedFiles,
      readReceipts: messageToSend.readReceipts,
      status,
    };

    return NextResponse.json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
