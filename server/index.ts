import "dotenv/config";


import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../lib/db/prisma";
import { createMessage } from "../lib/db/services/messageService";
import {
  decryptMessage,
  decryptFileName,
  decryptFileUrl,
} from "../lib/encryption";

interface AuthenticatedSocket extends Socket {
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicUrl: string | null;
  };
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users and their socket connections
const onlineUsers = new Map();
const userSockets = new Map();

// Middleware to authenticate socket connections
io.use(async (socket: Socket, next) => {
  try {
    console.log('Socket connection attempt:', socket.handshake.auth);
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error'));
    }

    if (!process.env.JWT_SECRET) {
      console.log('JWT_SECRET not configured');
      return next(new Error('JWT_SECRET not configured'));
    }

    console.log('Verifying token...');
    const payload = jwt.verify(token, process.env.JWT_SECRET) as any;
    console.log('Token payload:', payload);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, fullName: true, profilePicUrl: true }
    });

    if (!user) {
      console.log('User not found for ID:', payload.userId);
      return next(new Error('User not found'));
    }

    console.log('User authenticated:', user);
    // Augment socket with user data
    (socket as any).userId = user.id;
    (socket as any).user = user;
    next();
  } catch (error) {
    console.log('Authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket: Socket) => {
  const authenticatedSocket = socket as AuthenticatedSocket;
  const userId = authenticatedSocket.userId;
  const user = authenticatedSocket.user;

  console.log(`User ${user.fullName} connected`);

  // Add user to online users
  onlineUsers.set(userId, {
    socketId: authenticatedSocket.id,
    lastSeen: new Date(),
    typingIn: null,
    user: user
  });
  userSockets.set(authenticatedSocket.id, userId);

  // Update user's lastSeen in database
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeen: new Date() }
  });

  // Get user's conversations to join rooms
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId: userId }
      }
    },
    select: { id: true }
  });

  // Join conversation rooms
  conversations.forEach((conv: any) => {
    authenticatedSocket.join(`conversation:${conv.id}`);
  });

  // Broadcast user online status to their conversations
  conversations.forEach((conv: any) => {
    authenticatedSocket.to(`conversation:${conv.id}`).emit('user_online', {
      userId: userId,
      user: user,
      lastSeen: new Date()
    });
  });

  // Handle new message
  authenticatedSocket.on('send_message', async (data: any) => {
    try {
      const { conversationId, content, files = [] } = data;

      // Verify user is member of conversation
      const membership = await prisma.conversationMember.findFirst({
        where: {
          conversationId: conversationId,
          userId: userId
        }
      });

      if (!membership) {
        authenticatedSocket.emit('error', { message: 'Not authorized to send message to this conversation' });
        return;
      }

      // Create message
      const message = await createMessage({
        content,
        senderId: userId,
        conversationId,
        files
      });

      // Decrypt message for real-time broadcast
      const decryptedContent = decryptMessage(message.content, message.contentIv);

      const messageData = {
        id: message.id,
        content: decryptedContent,
        senderId: userId,
        conversationId: conversationId,
        createdAt: message.createdAt,
        sender: message.sender,
        files: message.files.map((file: any) => ({
          ...file,
          fileName: decryptFileName(file.fileName, file.fileNameIv),
          fileUrl: decryptFileUrl(file.fileUrl, file.fileUrlIv)
        }))
      };

      // Broadcast to conversation room
      io.to(`conversation:${conversationId}`).emit('new_message', messageData);

      // Stop typing for this user
      if (onlineUsers.get(userId)?.typingIn === conversationId) {
        onlineUsers.get(userId).typingIn = null;
        authenticatedSocket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          userId: userId,
          conversationId: conversationId
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      authenticatedSocket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  authenticatedSocket.on('typing_start', (data: any) => {
    const { conversationId } = data;
    
    // Update user's typing status
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).typingIn = conversationId;
    }

    // Broadcast to others in conversation
    authenticatedSocket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: userId,
      user: user,
      conversationId: conversationId
    });
  });

  authenticatedSocket.on('typing_stop', (data: any) => {
    const { conversationId } = data;
    
    // Update user's typing status
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).typingIn = null;
    }

    // Broadcast to others in conversation
    authenticatedSocket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      userId: userId,
      conversationId: conversationId
    });
  });

  // Handle message read receipts
  authenticatedSocket.on('mark_message_read', async (data: any) => {
    try {
      const { messageId, conversationId } = data;

      // Create read receipt
      await prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: messageId,
            userId: userId
          }
        },
        update: {
          readAt: new Date()
        },
        create: {
          messageId: messageId,
          userId: userId,
          readAt: new Date()
        }
      });

      // Broadcast read receipt to conversation
      authenticatedSocket.to(`conversation:${conversationId}`).emit('message_read', {
        messageId: messageId,
        userId: userId,
        user: user,
        readAt: new Date()
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle joining new conversations
  authenticatedSocket.on('join_conversation', (data: any) => {
    const { conversationId } = data;
    authenticatedSocket.join(`conversation:${conversationId}`);
  });

  // Handle leaving conversations
  authenticatedSocket.on('leave_conversation', (data: any) => {
    const { conversationId } = data;
    authenticatedSocket.leave(`conversation:${conversationId}`);
  });

  // Handle disconnect
  authenticatedSocket.on('disconnect', async () => {
    console.log(`User ${user.fullName} disconnected`);

    // Update last seen in database
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    });

    // Remove from online users
    onlineUsers.delete(userId);
    userSockets.delete(authenticatedSocket.id);

    // Broadcast user offline status to their conversations
    conversations.forEach((conv: any) => {
      authenticatedSocket.to(`conversation:${conv.id}`).emit('user_offline', {
        userId: userId,
        lastSeen: new Date()
      });
    });

    // Stop any typing indicators
    conversations.forEach((conv: any) => {
      authenticatedSocket.to(`conversation:${conv.id}`).emit('user_stopped_typing', {
        userId: userId,
        conversationId: conv.id
      });
    });
  });
});

// API endpoint to get online users for a conversation
app.get('/api/conversation/:id/online-users', (req: any, res: any) => {
  const conversationId = req.params.id;
  const onlineInConversation = [];

  for (const [userId, userData] of onlineUsers.entries()) {
    onlineInConversation.push({
      userId: userId,
      user: (userData as any).user,
      lastSeen: (userData as any).lastSeen,
      isTyping: (userData as any).typingIn === conversationId
    });
  }

  res.json({ onlineUsers: onlineInConversation });
});

const PORT = process.env.WEBSOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`Real-time messaging server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
