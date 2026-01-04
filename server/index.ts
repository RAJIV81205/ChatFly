import "dotenv/config";


import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/db/prisma";
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
// Changed to support multiple connections per user
const onlineUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId
const socketData = new Map(); // socketId -> user data

// Middleware to authenticate socket connections
io.use(async (socket: Socket, next) => {
  try {
    // console.log('Socket connection attempt:', socket.handshake.auth);
    const token = socket.handshake.auth.token;
    if (!token) {
      // console.log('No token provided');
      return next(new Error('Authentication error'));
    }

    if (!process.env.JWT_SECRET) {
      // console.log('JWT_SECRET not configured');
      return next(new Error('JWT_SECRET not configured'));
    }

    // console.log('Verifying token...');
    const payload = jwt.verify(token, process.env.JWT_SECRET) as any;
    // console.log('Token payload:', payload);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, fullName: true, profilePicUrl: true }
    });

    if (!user) {
      // console.log('User not found for ID:', payload.userId);
      return next(new Error('User not found'));
    }

    // console.log('User authenticated:', user);
    // Augment socket with user data
    (socket as any).userId = user.id;
    (socket as any).user = user;
    next();
  } catch (error) {
    // console.log('Authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket: Socket) => {
  const authenticatedSocket = socket as AuthenticatedSocket;
  const userId = authenticatedSocket.userId;
  const user = authenticatedSocket.user;

  // console.log(`User ${user.fullName} connected`);

  // Add user to online users (support multiple connections)
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(authenticatedSocket.id);
  
  userSockets.set(authenticatedSocket.id, userId);
  socketData.set(authenticatedSocket.id, {
    user: user,
    lastSeen: new Date(),
    typingIn: null
  });

  // Don't update lastSeen when connecting - user is now online
  // We'll only update lastSeen when they fully disconnect

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

  // Broadcast user online status to their conversations (without lastSeen since they're online)
  conversations.forEach((conv: any) => {
    authenticatedSocket.to(`conversation:${conv.id}`).emit('user_online', {
      userId: userId,
      user: user
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
        })),
        readReceipts: [],
        status: 'sent' as const
      };

      // Broadcast to conversation room
      io.to(`conversation:${conversationId}`).emit('new_message', messageData);

      // Stop typing for this user from this socket
      const socketInfo = socketData.get(authenticatedSocket.id);
      if (socketInfo?.typingIn === conversationId) {
        socketInfo.typingIn = null;
        
        // Check if user is still typing from other sockets
        const userSocketIds = onlineUsers.get(userId) || new Set();
        const isStillTyping = Array.from(userSocketIds).some(socketId => {
          const info = socketData.get(socketId);
          return info && info.typingIn === conversationId;
        });

        if (!isStillTyping) {
          authenticatedSocket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
            userId: userId,
            conversationId: conversationId
          });
        }
      }

    } catch (error) {
      // console.error('Error sending message:', error);
      authenticatedSocket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  authenticatedSocket.on('typing_start', (data: any) => {
    const { conversationId } = data;
    
    // Update this socket's typing status
    const socketInfo = socketData.get(authenticatedSocket.id);
    if (socketInfo) {
      socketInfo.typingIn = conversationId;
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
    
    // Update this socket's typing status
    const socketInfo = socketData.get(authenticatedSocket.id);
    if (socketInfo) {
      socketInfo.typingIn = null;
    }

    // Only broadcast stop typing if no other sockets for this user are typing in this conversation
    const userSocketIds = onlineUsers.get(userId) || new Set();
    const isStillTyping = Array.from(userSocketIds).some(socketId => {
      const info = socketData.get(socketId);
      return info && info.typingIn === conversationId;
    });

    if (!isStillTyping) {
      // Broadcast to others in conversation
      authenticatedSocket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: userId,
        conversationId: conversationId
      });
    }
  });

  // Handle message read receipts
  authenticatedSocket.on('mark_message_read', async (data: any) => {
    try {
      const { messageId, conversationId } = data;
      // console.log('🟢 Marking message as read:', { messageId, conversationId, userId });

      // Create read receipt
      const readReceipt = await prisma.readReceipt.upsert({
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
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        }
      });

      // console.log('🟢 Read receipt created:', readReceipt);

      const broadcastData = {
        messageId: messageId,
        userId: userId,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username
        },
        readAt: readReceipt.readAt
      };

      // console.log('🟢 Broadcasting read receipt:', broadcastData);

      // Broadcast read receipt to conversation (including the reader for confirmation)
      io.to(`conversation:${conversationId}`).emit('message_read', broadcastData);

    } catch (error) {
      // console.error('🔴 Error marking message as read:', error);
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
    // console.log(`User ${user.fullName} disconnected`);

    // Remove this socket from user's connections
    const userSocketIds = onlineUsers.get(userId);
    if (userSocketIds) {
      userSocketIds.delete(authenticatedSocket.id);
      
      // If no more connections for this user, remove from online users
      if (userSocketIds.size === 0) {
        onlineUsers.delete(userId);
        
        // Update last seen in database only when fully offline
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() }
        });

        // Broadcast user offline status to their conversations
        conversations.forEach((conv: any) => {
          authenticatedSocket.to(`conversation:${conv.id}`).emit('user_offline', {
            userId: userId,
            lastSeen: new Date()
          });
        });
      }
    }

    // Clean up socket data
    userSockets.delete(authenticatedSocket.id);
    socketData.delete(authenticatedSocket.id);

    // Stop any typing indicators for this socket
    conversations.forEach((conv: any) => {
      // Check if user is still typing from other sockets
      const userSocketIds = onlineUsers.get(userId);
      if (userSocketIds) {
        const isStillTyping = Array.from(userSocketIds).some(socketId => {
          const info = socketData.get(socketId);
          return info && info.typingIn === conv.id;
        });

        if (!isStillTyping) {
          authenticatedSocket.to(`conversation:${conv.id}`).emit('user_stopped_typing', {
            userId: userId,
            conversationId: conv.id
          });
        }
      }
    });
  });
});

// API endpoint to get online users for a conversation
app.get('/api/conversation/:id/online-users', (req: any, res: any) => {
  const conversationId = req.params.id;
  const onlineInConversation = [];

  for (const [userId, socketIds] of onlineUsers.entries()) {
    if (socketIds.size > 0) {
      // Get user data from any of their sockets
      const firstSocketId = Array.from(socketIds)[0];
      const socketInfo = socketData.get(firstSocketId);
      
      if (socketInfo) {
        // Check if user is typing in this conversation from any socket
        const isTyping = Array.from(socketIds).some(socketId => {
          const info = socketData.get(socketId);
          return info && info.typingIn === conversationId;
        });

        onlineInConversation.push({
          userId: userId,
          user: socketInfo.user,
          isOnline: true, // They're in the onlineUsers map, so they're online
          isTyping: isTyping
        });
      }
    }
  }

  res.json({ onlineUsers: onlineInConversation });
});

// New API endpoint to check if specific users are online
app.get('/api/users/online-status', (req: any, res: any) => {
  const userIds = req.query.userIds ? req.query.userIds.split(',') : [];
  const onlineStatus: {[key: string]: boolean} = {};
  
  userIds.forEach((userId: string) => {
    onlineStatus[userId] = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
  });
  
  res.json({ onlineStatus });
});

const PORT = process.env.WEBSOCKET_PORT || 3001;

server.listen(PORT, () => {
  // console.log(`Real-time messaging server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  // console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    // console.log('Server closed');
    process.exit(0);
  });
});
