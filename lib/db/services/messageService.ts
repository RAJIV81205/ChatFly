import { prisma } from '../prisma';
import { 
  encryptMessage, 
  decryptMessage, 
  encryptFileUrl, 
  decryptFileUrl, 
  encryptFileName, 
  decryptFileName 
} from '../../encryption';

export interface CreateMessageData {
  content: string;
  senderId: string;
  conversationId: string;
  files?: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }[];
}

export interface DecryptedMessage {
  id: string;
  content: string;
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
}

/**
 * Create a new encrypted message
 */
export async function createMessage(data: CreateMessageData) {
  const { content, senderId, conversationId, files = [] } = data;
  
  // Encrypt message content
  const { content: encryptedContent, contentIv } = encryptMessage(content);
  
  // Create message with encrypted files
  const message = await prisma.message.create({
    data: {
      content: encryptedContent,
      contentIv,
      senderId,
      conversationId,
      files: {
        create: files.map(file => {
          const { fileName: encryptedFileName, fileNameIv } = encryptFileName(file.fileName);
          const { fileUrl: encryptedFileUrl, fileUrlIv } = encryptFileUrl(file.fileUrl);
          
          return {
            fileName: encryptedFileName,
            fileNameIv,
            fileUrl: encryptedFileUrl,
            fileUrlIv,
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
  
  return message;
}

/**
 * Get messages for a conversation with decryption
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  cursor?: string
): Promise<DecryptedMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
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
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });
  
  // Decrypt messages
  return messages.map((message: any) => ({
    ...message,
    content: decryptMessage(message.content, message.contentIv),
    files: message.files.map((file: any) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    })),
  }));
}

/**
 * Get a single message by ID with decryption
 */
export async function getMessageById(messageId: string): Promise<DecryptedMessage | null> {
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
    },
  });
  
  if (!message) return null;
  
  return {
    ...message,
    content: decryptMessage(message.content, message.contentIv),
    files: message.files.map((file: any) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    })),
  };
}

/**
 * Update message content (re-encrypt)
 */
export async function updateMessage(messageId: string, newContent: string) {
  const { content: encryptedContent, contentIv } = encryptMessage(newContent);
  
  return await prisma.message.update({
    where: { id: messageId },
    data: {
      content: encryptedContent,
      contentIv,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string) {
  return await prisma.message.delete({
    where: { id: messageId },
  });
}

/**
 * Search messages (requires decryption for matching)
 */
export async function searchMessages(
  conversationId: string,
  searchTerm: string,
  limit: number = 20
): Promise<DecryptedMessage[]> {
  // Note: This is not efficient for large datasets as it requires decrypting all messages
  // For production, consider using a separate search index or full-text search
  const messages = await prisma.message.findMany({
    where: { conversationId },
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
    orderBy: { createdAt: 'desc' },
  });
  
  // Decrypt and filter messages
  const decryptedMessages = messages.map((message: any) => ({
    ...message,
    content: decryptMessage(message.content, message.contentIv),
    files: message.files.map((file: any) => ({
      ...file,
      fileName: decryptFileName(file.fileName, file.fileNameIv),
      fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
    })),
  }));
  
  return decryptedMessages
    .filter((message: any) => 
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, limit);
}