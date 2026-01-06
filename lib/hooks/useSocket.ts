"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token?: string;
  currentUserId?: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { userId: string; username: string; user: any; conversationId: string }) => void;
  onUserStoppedTyping?: (data: { userId: string; username: string; conversationId: string }) => void;
  onUserOnline?: (data: { userId: string; user: any }) => void;
  onUserOffline?: (data: { userId: string; lastSeen: Date }) => void;
  onMessageRead?: (data: { messageId: string; userId: string; user: any; readAt: Date }) => void;
  onFileMessageUploaded?: (data: { messageId: string; conversationId: string; senderId: string }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, any>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> conversationId
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!options.token) {
      return;
    }

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: options.token
      },
      withCredentials: true
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Message events
    socket.on('new_message', (message) => {
      options.onNewMessage?.(message);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      // Only store typing state if it's not the current user
      if (data.userId !== options.currentUserId) {
        setTypingUsers(prev => new Map(prev.set(data.userId, data.conversationId)));
        // Only call the callback for other users
        options.onUserTyping?.(data);
      }
    });

    socket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      // Always call stopped typing callback for cleanup
      options.onUserStoppedTyping?.(data);
    });

    // Presence events
    socket.on('user_online', (data) => {
      setOnlineUsers(prev => new Map(prev.set(data.userId, data)));
      options.onUserOnline?.(data);
    });

    socket.on('user_offline', (data) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      options.onUserOffline?.(data);
    });

    // Read receipt events
    socket.on('message_read', (data) => {
      options.onMessageRead?.(data);
    });

    // File message uploaded event
    socket.on('file_message_uploaded', (data) => {
      options.onFileMessageUploaded?.(data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [options.token, options.currentUserId]); // Add currentUserId to dependencies

  // Socket methods
  const sendMessage = (conversationId: string, content: string, files: any[] = []) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        files
      });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_stop', { conversationId });
    }
  };

  const markMessageRead = (messageId: string, conversationId: string) => {
    // // console.log('Marking message as read:', { messageId, conversationId, connected: socketRef.current?.connected });
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_message_read', { messageId, conversationId });
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const isUserTyping = (userId: string, conversationId: string) => {
    return typingUsers.get(userId) === conversationId;
  };

  const getTypingUsersInConversation = (conversationId: string) => {
    const typing = [];
    for (const [userId, convId] of typingUsers.entries()) {
      if (convId === conversationId && userId !== options.currentUserId) {
        typing.push(userId);
      }
    }
    return typing;
  };

  const notifyFileMessage = (messageId: string, conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notify_file_message', { messageId, conversationId });
    }
  };

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    joinConversation,
    leaveConversation,
    isUserOnline,
    isUserTyping,
    getTypingUsersInConversation,
    notifyFileMessage
  };
};