import prisma from '../prisma';
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
  readReceipts: {
    id: string;
    userId: string;
    readAt: Date;
    user: {
      id: string;
      fullName: string;
    };
  }[];
  status: 'sent' | 'read';
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
 * Get messages for a conversation with decryption and status calculation
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  cursor?: string,
  currentUserId?: string
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
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });
  
  // Get conversation members to calculate status
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });
  
  const memberIds = conversation?.members.map((m: { userId: any; }) => m.userId) || [];
  
  // Decrypt messages and calculate status
  const decryptedMessages = messages.map((message: any) => {
    const decryptedMessage = {
      ...message,
      content: decryptMessage(message.content, message.contentIv),
      files: message.files.map((file: any) => ({
        ...file,
        fileName: decryptFileName(file.fileName, file.fileNameIv),
        fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv),
      })),
    };
    
    // Calculate message status for sender's messages
    let status: 'sent' | 'read' = 'sent';
    
    if (currentUserId && message.senderId === currentUserId) {
      // Get other members (excluding sender)
      const otherMembers = memberIds.filter((id: string) => id !== currentUserId);
      
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
      ...decryptedMessage,
      status,
    };
  }).reverse();
  
  return decryptedMessages;
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