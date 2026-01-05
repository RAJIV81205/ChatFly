import prisma from "../prisma";
import {
  encryptMessage,
  decryptMessage,
  encryptFileUrl,
  decryptFileUrl,
  encryptFileName,
  decryptFileName,
} from "../../encryption";

/* ======================================================
   TYPES
====================================================== */

export interface CreateMessageData {
  content?: string;
  senderId: string;
  conversationId: string;
  files?: {
    fileName: string;
    fileUrl: string;
    cloudinaryPublicId: string;
    fileSize?: number;
    mimeType?: string;
  }[];
}

export interface DecryptedMessage {
  id: string;
  type: "TEXT" | "FILE" | "MIXED" | "SYSTEM";
  content: string | null;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    username: string;
    fullName: string;
    profilePicUrl: string | null;
  };
  files: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: Date;
  }[];
  readReceipts: {
    id: string;
    userId: string;
    readAt: Date;
    user: {
      id: string;
      fullName: string;
    };
  }[];
  status: "sent" | "read";
}

/* ======================================================
   HELPERS
====================================================== */

function resolveMessageType(
  content?: string,
  files?: any[]
): "TEXT" | "FILE" | "MIXED" {
  if (content && files?.length) return "MIXED";
  if (files?.length) return "FILE";
  return "TEXT";
}

/* ======================================================
   CREATE MESSAGE
====================================================== */

export async function createMessage(data: CreateMessageData) {
  const { content, senderId, conversationId, files = [] } = data;

  const type = resolveMessageType(content, files);

  const encrypted =
    content != null ? encryptMessage(content) : { content: null, contentIv: null };

  return prisma.message.create({
    data: {
      type,
      content: encrypted.content,
      contentIv: encrypted.contentIv,
      senderId,
      conversationId,
      files: {
        create: files.map((file) => {
          const { fileName, fileNameIv } = encryptFileName(file.fileName);
          const { fileUrl, fileUrlIv } = encryptFileUrl(file.fileUrl);

          return {
            uploaderId: senderId,
            fileName,
            fileNameIv,
            fileUrl,
            fileUrlIv,
            cloudinaryPublicId: file.cloudinaryPublicId,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          };
        }),
      },
    },
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
    },
  });
}

/* ======================================================
   GET CONVERSATION MESSAGES
====================================================== */

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  cursor?: string,
  currentUserId?: string
): Promise<DecryptedMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      isDeleted: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePicUrl: true,
        },
      },
      files: {
        where: { status: "ACTIVE" },
      },
      readReceipts: {
        include: {
          user: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: { select: { userId: true } },
    },
  });

  const memberIds = conversation?.members.map((m: { userId: any; }) => m.userId) ?? [];

  return messages
    .map((message: { content: string; contentIv: string; files: any[]; senderId: string; readReceipts: any[]; }) => {
      const content =
        message.content && message.contentIv
          ? decryptMessage(message.content, message.contentIv)
          : null;

      const files = message.files.map((file) => ({
        ...file,
        fileName: decryptFileName(file.fileName, file.fileNameIv),
        fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
      }));

      let status: "sent" | "read" = "sent";

      if (currentUserId && message.senderId === currentUserId) {
        const otherMembers = memberIds.filter((id: string) => id !== currentUserId);
        const allRead = otherMembers.every((id: any) =>
          message.readReceipts.some((r) => r.userId === id)
        );
        if (allRead) status = "read";
      }

      return {
        ...message,
        content,
        files,
        status,
      };
    })
    .reverse();
}

/* ======================================================
   GET MESSAGE BY ID
====================================================== */

export async function getMessageById(
  messageId: string
): Promise<DecryptedMessage | null> {
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
          user: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!message) return null;

  return {
    ...message,
    content:
      message.content && message.contentIv
        ? decryptMessage(message.content, message.contentIv)
        : null,
    files: message.files.map((file: { fileName: string; fileNameIv: string; fileUrl: string; fileUrlIv: string; }) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    })),
    status: "sent",
  };
}

/* ======================================================
   UPDATE MESSAGE
====================================================== */

export async function updateMessage(messageId: string, newContent: string) {
  const encrypted = encryptMessage(newContent);

  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: encrypted.content,
      contentIv: encrypted.contentIv,
      updatedAt: new Date(),
    },
  });
}

/* ======================================================
   DELETE MESSAGE (SOFT)
====================================================== */

export async function deleteMessage(messageId: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

/* ======================================================
   SEARCH MESSAGES
====================================================== */

export async function searchMessages(
  conversationId: string,
  searchTerm: string,
  limit = 20
): Promise<DecryptedMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId, isDeleted: false },
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
    },
    orderBy: { createdAt: "desc" },
  });

  return messages
    .map((m: { content: string; contentIv: string; files: { fileName: string; fileNameIv: string; fileUrl: string; fileUrlIv: string; }[]; }) => ({
      ...m,
      content:
        m.content && m.contentIv
          ? decryptMessage(m.content, m.contentIv)
          : null,
      files: m.files.map((f: { fileName: string; fileNameIv: string; fileUrl: string; fileUrlIv: string; }) => ({
        ...f,
        fileName: decryptFileName(f.fileName, f.fileNameIv),
        fileUrl: decryptFileUrl(f.fileUrl, f.fileUrlIv),
      })),
    }))
    .filter((m: { content: string; }) =>
      m.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, limit);
}
