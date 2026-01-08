"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token?: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { userId: string; user: any; conversationId: string }) => void;
  onUserStoppedTyping?: (data: { userId: string; conversationId: string }) => void;
  onUserOnline?: (data: { userId: string; user: any }) => void;
  onUserOffline?: (data: { userId: string; lastSeen: Date }) => void;
  onMessageRead?: (data: { messageId: string; userId: string; user: any; readAt: Date }) => void;
  onFileMessageUploaded?: (data: { messageId: string; conversationId: string; senderId: string }) => void;
  onIncomingCall?: (data: { callerId: string; caller: any; roomId: string }) => void;
  onCallAccepted?: (data: { roomId: string; acceptedBy: string; acceptedByUser: any }) => void;
  onCallRejected?: (data: { roomId: string; rejectedBy: string; rejectedByUser: any }) => void;
  onCallEnded?: (data: { roomId: string; endedBy: string; endedByUser: any }) => void;
  onCallFailed?: (data: { reason: string; calleeId: string }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, any>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, { conversationId: string; user: any }>>(new Map()); // userId -> {conversationId, user}
  const socketRef = useRef<Socket | null>(null);

  // Memoize the online users array to prevent unnecessary re-renders
  const onlineUsersArray = useMemo(() => Array.from(onlineUsers.values()), [onlineUsers]);

  useEffect(() => {
    if (!options.token) {
      // // console.log('No token provided to useSocket');
      return;
    }

    // // console.log('Initializing socket connection with token:', options.token?.substring(0, 20) + '...');

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
      // // console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      // // console.log('Disconnected from WebSocket server');
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
      setTypingUsers(prev => new Map(prev.set(data.userId, { 
        conversationId: data.conversationId, 
        user: data.user 
      })));
      options.onUserTyping?.(data);
    });

    socket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
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
      // // console.log('Read receipt received:', data);
      options.onMessageRead?.(data);
    });

    // File message uploaded event
    socket.on('file_message_uploaded', (data) => {
      options.onFileMessageUploaded?.(data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on("online_users", (users) => {
      const map = new Map();
      users.forEach((u: any) => map.set(u.userId, u));
      setOnlineUsers(map);
    });

    // Call events
    socket.on('incoming_call', (data) => {
      console.log('incoming_call event received:', data);
      options.onIncomingCall?.(data);
    });

    socket.on('call_accepted', (data) => {
      console.log('call_accepted event received:', data);
      options.onCallAccepted?.(data);
    });

    socket.on('call_rejected', (data) => {
      console.log('call_rejected event received:', data);
      options.onCallRejected?.(data);
    });

    socket.on('call_ended', (data) => {
      console.log('call_ended event received:', data);
      options.onCallEnded?.(data);
    });

    socket.on('call_failed', (data) => {
      console.log('call_failed event received:', data);
      options.onCallFailed?.(data);
    });


    return () => {
      socket.disconnect();
    };
  }, [options.token]);

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
    const typingData = typingUsers.get(userId);
    return typingData?.conversationId === conversationId;
  };

  const getTypingUsersInConversation = (conversationId: string) => {
    const typing = [];
    for (const [userId, data] of typingUsers.entries()) {
      if (data.conversationId === conversationId) {
        typing.push({
          userId,
          user: data.user,
          conversationId: data.conversationId
        });
      }
    }
    return typing;
  };

  const notifyFileMessage = (messageId: string, conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notify_file_message', { messageId, conversationId });
    }
  };

  // Call methods
  const initiateCall = (callerId: string, calleeId: string, roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('incoming_call', { 
        callerId, 
        calleeId, 
        roomId 
      });
    }
  };

  const acceptCall = (roomId: string, callerId: string) => {
    console.log('acceptCall called:', { roomId, callerId, connected: socketRef.current?.connected });
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_accepted', { roomId, callerId });
      console.log('call_accepted event emitted');
    } else {
      console.error('Socket not connected when trying to accept call');
    }
  };

  const rejectCall = (roomId: string, callerId: string) => {
    console.log('rejectCall called:', { roomId, callerId, connected: socketRef.current?.connected });
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_rejected', { roomId, callerId });
      console.log('call_rejected event emitted');
    } else {
      console.error('Socket not connected when trying to reject call');
    }
  };

  const endCall = (roomId: string, participantIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('call_ended', { roomId, participantIds });
    }
  };

  return {
    isConnected,
    onlineUsers: onlineUsersArray, // Use memoized array
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
    notifyFileMessage,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  };
};