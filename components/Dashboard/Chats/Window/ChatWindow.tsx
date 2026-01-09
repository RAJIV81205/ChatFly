"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Download,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useSocket } from "@/lib/hooks/useSocket";
import { cacheStore } from "@/lib/hooks/cacheStore";
import { MessageStatus } from "./MessageStatus";
import MessageInput from "./MessageInput";
import Contact from "./Contact";
import FilePreview from "./FilePreview";
import toast from "react-hot-toast";

interface User {
  id: string;
  fullName: string;
  username: string;
  profilePicUrl: string | null;
  lastSeen?: string;
  bio?: string;
  createdAt?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  createdAt: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;
  readReceipts?: Array<{
    id: string;
    userId: string;
    readAt: string;
    user: {
      id: string;
      fullName: string;
    };
  }>;
  status: "sent" | "read";
}

interface Conversation {
  id: string;
  type: "PRIVATE" | "GROUP";
  name: string;
  avatar: string | null;
  members: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isAdmin: boolean;
  }>;
}

interface ChatWindowProps {
  chatId: string | null;
  currentUserId: string | null;
  token?: string;
  currentUser? : User
  globalSocketInstance?: {
    isConnected: boolean;
    acceptCall: (roomId: string, callerId: string) => void;
    rejectCall: (roomId: string, callerId: string) => void;
    endCall: (roomId: string, participantIds: string[]) => void;
    initiateCall: (callerId: string, receiverId: string, roomId: string) => void;
  };
}

const ChatWindow = ({ chatId, currentUserId, token, globalSocketInstance }: ChatWindowProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userLastSeen, setUserLastSeen] = useState<{
    [userId: string]: string;
  }>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [forceUpdate, setForceUpdate] = useState(0); // Add force update state
  const [showContactModal, setShowContactModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onlineStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Socket integration
  const {
    isConnected,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    joinConversation,
    leaveConversation,
    isUserOnline,
    getTypingUsersInConversation,
    notifyFileMessage,
    initiateCall,
  } = useSocket({
    token,
    onUserTyping: (data) => {
      setForceUpdate((prev) => prev + 1);
    },
    onUserStoppedTyping: (data) => {
      setForceUpdate((prev) => prev + 1);
    },
    onNewMessage: (message) => {
      const safeMessage = {
        ...message,
        readReceipts: Array.isArray(message.readReceipts)
          ? message.readReceipts
          : [],
        status: message.status || "sent",
      };

      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (msg) =>
            !(
              msg &&
              msg.id &&
              msg.id.startsWith("temp-") &&
              msg.senderId === safeMessage.senderId &&
              msg.content === safeMessage.content
            )
        );
        const updatedMessages = [...filteredMessages, safeMessage];

        if (chatId) {
          cacheStore.addMessageToCache(chatId, safeMessage);
        }

        return updatedMessages;
      });

      if (safeMessage.senderId !== currentUserId && chatId) {
        markMessageRead(safeMessage.id, chatId);
      }
    },
    onFileMessageUploaded: async (data) => {
      if (data.senderId === currentUserId) {
        return;
      }
      try {
        const response = await fetch(`/api/messages/${data.messageId}`);
        const result = await response.json();

        if (result.success) {
          setMessages((prev) => {
            const updatedMessages = [...prev, result.message];

            // Update cache with new message
            if (chatId) {
              cacheStore.addMessageToCache(chatId, result.message);
            }

            return updatedMessages;
          });

          // Mark as read if it's not from current user and chat is open
          if (result.message.senderId !== currentUserId && chatId) {
            markMessageRead(result.message.id, chatId);
          }
        }
      } catch (error) {
        console.error("Error fetching uploaded file message:", error);
      }
    },
    onUserOnline: (data) => {
      // Update online status when user comes online
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    },
    onUserOffline: (data) => {
      // Update last seen when user goes offline and remove from online users
      setUserLastSeen((prev) => ({
        ...prev,
        [data.userId]: data.lastSeen.toString(),
      }));
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    },
    onMessageRead: (data) => {
      // Update message status when someone reads it
      setMessages((prev) => {
        return prev.map((msg) => {
          // Safety check for message object
          if (!msg || !msg.id || msg.id !== data.messageId) {
            return msg;
          }
          try {
            // Ensure readReceipts exists and add the read receipt if it doesn't exist
            const currentReadReceipts = Array.isArray(msg.readReceipts)
              ? msg.readReceipts
              : [];

            const updatedReadReceipts = currentReadReceipts.some(
              (r) => r && r.userId === data.userId
            )
              ? currentReadReceipts
              : [
                  ...currentReadReceipts,
                  {
                    id: data.messageId + data.userId,
                    userId: data.userId,
                    readAt: data.readAt.toString(),
                    user: data.user,
                  },
                ];

            // Calculate new status if this is sender's message
            let newStatus = msg.status || "sent";
            if (
              msg.senderId === currentUserId &&
              conversation &&
              conversation.members
            ) {
              const otherMembers = conversation.members.filter(
                (m) => m && m.id !== currentUserId
              );
              // // console.log('🔵 Other members:', otherMembers);

              const allRead = otherMembers.every((member) =>
                updatedReadReceipts.some((r) => r && r.userId === member.id)
              );

              newStatus = allRead ? ("read" as const) : ("sent" as const);
            }

            const updatedMessage = {
              ...msg,
              readReceipts: updatedReadReceipts,
              status: newStatus,
            };

            // Update cache with message changes
            if (chatId) {
              cacheStore.updateMessageInCache(chatId, msg.id, {
                readReceipts: updatedReadReceipts,
                status: newStatus,
              });
            }

            // Force a re-render to ensure UI updates
            setTimeout(() => setForceUpdate((prev) => prev + 1), 100);

            return updatedMessage;
          } catch (error) {
            console.error("🔴 Error updating message read status:", error, msg);
            return msg;
          }
        });
      });
    },
  });

  useEffect(() => {
    if (chatId) {
      // Load from cache first for instant display
      const cached = cacheStore.getCachedMessages(chatId);
      if (cached) {
        setMessages(cached.messages);
        setConversation(cached.conversation);

        // Scroll to bottom immediately with cached messages
        setTimeout(() => {
          scrollToBottom();
        }, 0);
      }

      // Then fetch fresh data in background
      fetchMessages();
      joinConversation(chatId);
    }

    return () => {
      if (chatId) {
        leaveConversation(chatId);
      }
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
      }
    };
  }, [chatId]);

  // Separate effect for online status checking that depends on conversation
  useEffect(() => {
    if (conversation && chatId) {
      // Initial check
      checkOnlineStatus();

      // Set up interval
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
      }
      onlineStatusIntervalRef.current = setInterval(checkOnlineStatus, 30000);
    }

    return () => {
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
      }
    };
  }, [conversation, chatId]);

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);

    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-scroll when typing indicators appear/disappear
  useEffect(() => {
    if (chatId) {
      const typingData = getTypingUsersInConversation(chatId);
      if (typingData.length > 0) {
        // Small delay to ensure typing indicator is rendered
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [chatId, getTypingUsersInConversation, forceUpdate]); // Add forceUpdate to dependencies

  // Handle visibility change to mark messages as read when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && chatId && currentUserId) {
        // Mark any unread messages as read when user returns to tab
        const unreadMessages = messages.filter((msg: Message) => {
          if (!msg || msg.senderId === currentUserId) return false;
          const readReceipts = Array.isArray(msg.readReceipts)
            ? msg.readReceipts
            : [];
          return !readReceipts.some(
            (receipt: any) => receipt && receipt.userId === currentUserId
          );
        });

        unreadMessages.forEach((msg: Message) => {
          markMessageRead(msg.id, chatId);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [messages, chatId, currentUserId, markMessageRead]);

  // Handle window focus to mark messages as read
  useEffect(() => {
    const handleFocus = () => {
      if (chatId && currentUserId) {
        // Mark any unread messages as read when chat gets focus
        const unreadMessages = messages.filter((msg: Message) => {
          if (!msg || msg.senderId === currentUserId) return false;
          const readReceipts = Array.isArray(msg.readReceipts)
            ? msg.readReceipts
            : [];
          return !readReceipts.some(
            (receipt: any) => receipt && receipt.userId === currentUserId
          );
        });

        unreadMessages.forEach((msg: Message) => {
          markMessageRead(msg.id, chatId);
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [messages, chatId, currentUserId, markMessageRead]);

  // Periodic status check and update
  useEffect(() => {
    if (!conversation || !currentUserId) return;

    const interval = setInterval(() => {
      setMessages((prev) => {
        let hasChanges = false;
        const updated = prev.map((msg) => {
          if (msg.senderId === currentUserId && msg.status === "sent") {
            const readReceipts = Array.isArray(msg.readReceipts)
              ? msg.readReceipts
              : [];
            const otherMembers = conversation.members.filter(
              (m) => m && m.id !== currentUserId
            );
            const allRead = otherMembers.every((member) =>
              readReceipts.some((r) => r && r.userId === member.id)
            );

            if (allRead) {
              // // console.log('🔄 Periodic update: changing status to read for message', msg.id);
              hasChanges = true;
              return { ...msg, status: "read" as const };
            }
          }
          return msg;
        });

        if (hasChanges) {
          setForceUpdate((prev) => prev + 1);
        }

        return hasChanges ? updated : prev;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [conversation, currentUserId]);

  // Periodic check to mark unread messages as read
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const interval = setInterval(() => {
      const unreadMessages = messages.filter((msg: Message) => {
        if (!msg || msg.senderId === currentUserId) return false;
        const readReceipts = Array.isArray(msg.readReceipts)
          ? msg.readReceipts
          : [];
        return !readReceipts.some(
          (receipt: any) => receipt && receipt.userId === currentUserId
        );
      });

      if (unreadMessages.length > 0) {
        // // console.log('Periodic check: marking', unreadMessages.length, 'messages as read');
        unreadMessages.forEach((msg: Message) => {
          markMessageRead(msg.id, chatId);
        });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [messages, chatId, currentUserId, markMessageRead]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showContactModal) {
        setShowContactModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showContactModal]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    // Check if typing indicator is visible and scroll to it, otherwise scroll to messages end
    if (typingIndicatorRef.current) {
      typingIndicatorRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const checkOnlineStatus = async () => {
    if (!conversation) return;

    try {
      // Get user IDs to check (excluding current user)
      const userIds = conversation.members
        .filter((member) => member.id !== currentUserId)
        .map((member) => member.id);

      if (userIds.length === 0) return;

      const response = await fetch(
        `/api/users/online-status?userIds=${userIds.join(",")}`
      );
      const data = await response.json();

      if (data.onlineStatus) {
        const onlineUserIds = Object.keys(data.onlineStatus).filter(
          (userId) => data.onlineStatus[userId]
        );
        setOnlineUsers(new Set(onlineUserIds));
      }
    } catch (error) {
      console.error("Error checking online status:", error);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    // Only show loading if we don't have cached data
    const cached = cacheStore.getCachedMessages(chatId);
    if (!cached) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setConversation(data.conversation);

        // Cache the fresh data
        cacheStore.cacheMessages(chatId, data.messages, data.conversation);

        // Fetch last seen data for private chats
        if (data.conversation?.type === "PRIVATE") {
          await fetchUserLastSeen(data.conversation.members);
        }

        // Mark unread messages as read
        if (currentUserId) {
          const unreadMessages = data.messages.filter((msg: Message) => {
            if (!msg || msg.senderId === currentUserId) return false;
            const readReceipts = Array.isArray(msg.readReceipts)
              ? msg.readReceipts
              : [];
            return !readReceipts.some(
              (receipt: any) => receipt && receipt.userId === currentUserId
            );
          });

          // Use bulk read API for better performance
          if (unreadMessages.length > 0) {
            try {
              await fetch(`/api/chats/${chatId}/read`, {
                method: "POST",
              });
            } catch (error) {
              console.error("Failed to mark messages as read:", error);
              // Fallback to individual message marking
              unreadMessages.forEach((msg: Message) => {
                markMessageRead(msg.id, chatId);
              });
            }
          }
        }

        // Scroll to bottom after messages are loaded (only if no cached data was shown)
        if (!cached) {
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      } else {
        console.error("Failed to fetch messages:", data.error);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLastSeen = async (members: any[]) => {
    try {
      // Get the other user (not current user)
      const otherUser = members.find((member) => member.id !== currentUserId);
      if (!otherUser) return;

      const response = await fetch(`/api/users/${otherUser.username}`);
      const data = await response.json();

      if (data.success && data.user.lastSeen) {
        setUserLastSeen((prev) => ({
          ...prev,
          [otherUser.id]: data.user.lastSeen,
        }));
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user last seen:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUserId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    if (isTyping) {
      stopTyping(chatId);
      setIsTyping(false);
    }

    try {
      // Use WebSocket if connected, fallback to HTTP
      if (isConnected) {
        socketSendMessage(chatId, messageContent, []);
        // Optimistically add the message to UI
        const tempMessage: Message = {
          id: "temp-" + Date.now(),
          content: messageContent,
          senderId: currentUserId,
          sender: {
            id: currentUserId,
            fullName: "You",
            username: "",
            profilePicUrl: null,
          },
          createdAt: new Date().toISOString(),
          type: "TEXT",
          readReceipts: [],
          status: "sent",
        };
        setMessages((prev) => [...prev, tempMessage]);
      } else {
        // Fallback to HTTP API
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
            senderId: currentUserId,
            conversationId: chatId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchMessages();
        } else {
          // console.error('Failed to send message:', data.error);
          setNewMessage(messageContent);
        }
      }
    } catch (error) {
      // console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!chatId) return;

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(chatId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(chatId);
      }
    }, 2000);

    // Stop typing if input is empty
    if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(chatId);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatLastSeen = (lastSeenString: string) => {
    const lastSeen = new Date(lastSeenString);
    const now = new Date();

    if (isNaN(lastSeen.getTime())) return "";

    const diffMs = now.getTime() - lastSeen.getTime();

    // Future safeguard
    if (diffMs < 0) return "just now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    const isSameDay =
      lastSeen.getFullYear() === now.getFullYear() &&
      lastSeen.getMonth() === now.getMonth() &&
      lastSeen.getDate() === now.getDate();

    // 🔹 Today → show exact time difference
    if (isSameDay) {
      if (diffMinutes < 1) return "just now";

      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      }

      const hours = diffHours;
      const minutes = diffMinutes % 60;

      return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
    }

    // 🔹 Older than today → show date + time
    return lastSeen.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const shouldShowDateSeparator = (
    currentMessage: Message,
    previousMessage: Message | null
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  const handleFileUpload = async (file: File) => {
    if (!chatId || !currentUserId || uploadingFile) return;

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB (matching backend)
    if (file.size > maxSize) {
      alert("File size must be less than 100MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("File type not supported");
      return;
    }

    // Show preview instead of uploading immediately
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // console.log("Setting preview URL:", url);
    // console.log("Setting showFilePreview to true");
    setShowFilePreview(true);
  };

  const handleFileConfirm = async (processedFile?: File | Blob) => {
    if (!selectedFile || !chatId || !currentUserId) return;

    setUploadingFile(true);
    setShowFilePreview(false);

    try {
      // Use processed file if available (for edited images), otherwise use original
      const fileToUpload = processedFile || selectedFile;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("conversationId", chatId);
      formData.append("senderId", currentUserId);

      // Upload file
      const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Notify other users via socket about the new file message
        if (isConnected) {
          notifyFileMessage(data.messageId, chatId);
        }

        // Add the message to our own UI immediately
        setMessages((prev) => {
          const updatedMessages = [...prev, data.message];

          // Update cache with new message
          cacheStore.addMessageToCache(chatId, data.message);

          return updatedMessages;
        });
      } else {
        alert("Failed to upload file: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
      setSelectedFile(null);
      setPreviewUrl("");
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleFileCancel = () => {
    setShowFilePreview(false);
    setSelectedFile(null);
    setViewingMessage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleViewMessage = (message: Message) => {
    if (!message.fileUrl) return;

    setViewingMessage(message);
    setPreviewUrl(getFileUrl(message.fileUrl));
    setShowFilePreview(true);
  };

  const handleDownloadMessage = (message: Message) => {
    if (!message.fileUrl) return;

    const link = document.createElement("a");
    link.href = getFileUrl(message.fileUrl);
    link.download = message.fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleVideoCall = () => {
    if (!conversation || !currentUserId) return;

    // Use global socket if available, fallback to local socket
    const socketToUse = globalSocketInstance?.isConnected ? globalSocketInstance : { isConnected, initiateCall };
    
    if (!socketToUse.isConnected) {
      toast.error("Not connected to server");
      return;
    }

    const roomId = conversation.id + "-" + Date.now();

    // notify the other user
    const otherUser = conversation.members.find((m) => m.id !== currentUserId);

    if (!otherUser) return;

    socketToUse.initiateCall(currentUserId, otherUser.id, roomId);

    // Note: The global socket will handle the call popup
    toast.loading("Calling...");
  };

  // For file URLs, check if they're already decrypted or need to be served through our API
  const getFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return "";

    // If it's already a full URL (decrypted), use it directly
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }

    // If it's encrypted (contains :), serve through our API
    if (fileUrl.includes(":")) {
      return `/api/files/${encodeURIComponent(fileUrl)}`;
    }

    // Fallback
    return fileUrl;
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case "IMAGE":
        return (
          <div className="max-w-xs">
            <img
              src={getFileUrl(message.fileUrl)}
              alt={message.fileName || "Image"}
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleViewMessage(message)}
            />
            {message.content && message.content !== message.fileName && (
              <p className="text-sm mt-2">{message.content}</p>
            )}
          </div>
        );

      case "VIDEO":
        return (
          <div className="max-w-xs">
            <div className="relative">
              <video
                src={getFileUrl(message.fileUrl)}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                preload="metadata"
                poster={
                  message.thumbnail ? getFileUrl(message.thumbnail) : undefined
                }
                onClick={() => handleViewMessage(message)}
              />
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer rounded-lg"
                onClick={() => handleViewMessage(message)}
              >
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-800 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            {message.content && message.content !== message.fileName && (
              <p className="text-sm mt-2">{message.content}</p>
            )}
          </div>
        );

      case "FILE":
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleViewMessage(message)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleViewMessage(message);
              }
            }}
            className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg max-w-xs cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600 transition"
          >
            {/* Icon */}
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-600 rounded-lg flex items-center justify-center shrink-0">
              <Paperclip className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {message.fileName || "File"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {message.fileSize
                  ? formatFileSize(message.fileSize)
                  : "Unknown size"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMessage(message);
                }}
                className="text-gray-600 dark:text-gray-200 hover:text-blue-500 transition"
                title="View"
              >
                <Eye className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadMessage(message);
                }}
                className="text-gray-600 dark:text-gray-200 hover:text-emerald-500 transition"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      default:
        // Only render if content exists and is not empty
        return message.content && message.content.trim() !== "" ? (
          <p className="text-sm">{message.content}</p>
        ) : null;
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
            Select a chat to start messaging
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Choose from your existing conversations or start a new one
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        .typing-dot-1 {
          animation: typingDot 1.4s infinite;
          animation-delay: 0s;
        }
        .typing-dot-2 {
          animation: typingDot 1.4s infinite;
          animation-delay: 0.2s;
        }
        .typing-dot-3 {
          animation: typingDot 1.4s infinite;
          animation-delay: 0.4s;
        }
      `}</style>
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        {conversation && (
          <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {conversation.avatar ? (
                  <Image
                    src={conversation.avatar}
                    alt={conversation.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {conversation.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-white">
                    {conversation.name}
                  </h2>
                  {conversation.type === "GROUP" ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {conversation.members.length} participants
                    </p>
                  ) : (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const otherUser = conversation.members.find(
                          (member) => member.id !== currentUserId
                        );
                        const isOnline =
                          otherUser &&
                          (isUserOnline(otherUser.id) ||
                            onlineUsers.has(otherUser.id));
                        const lastSeen =
                          otherUser && userLastSeen[otherUser.id];

                        return (
                          <>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {isOnline
                                ? "online"
                                : lastSeen
                                ? `last seen ${formatLastSeen(lastSeen)}`
                                : "offline"}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                  <Phone className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  onClick={handleVideoCall}
                >
                  <Video className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>

                <div className="relative">
                  <button
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    onClick={() => setShowContactModal(true)}
                  >
                    <MoreHorizontal className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs - Only show for group chats */}
            {conversation.type === "GROUP" && (
              <div className="flex gap-6 mt-4">
                <button className="pb-2 border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium">
                  Messages
                </button>
                <button className="pb-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                  Participants
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto p-6 space-y-4 relative ${
            dragOver ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-100/80 dark:bg-emerald-900/40 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Paperclip className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-emerald-700 dark:text-emerald-300">
                  Drop file to send
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Images, videos, and documents supported
                </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId;
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(
              message,
              previousMessage
            );

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="shrink-0">
                      {message.sender.profilePicUrl ? (
                        <Image
                          src={message.sender.profilePicUrl}
                          alt={message.sender.fullName}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-xs lg:max-w-md ${
                      isOwnMessage ? "order-first" : ""
                    }`}
                  >
                    {!isOwnMessage && conversation?.type === "GROUP" && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        {message.sender.fullName},{" "}
                        {formatTime(message.createdAt)}
                      </p>
                    )}

                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? "bg-emerald-500 text-white"
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {renderMessageContent(message)}
                    </div>

                    {isOwnMessage && (
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatTime(message.createdAt)}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-400">
                            {message.status}
                          </span>
                          <MessageStatus
                            key={`${message.id}-${message.status}-${forceUpdate}`}
                            status={message.status}
                          />
                        </div>
                      </div>
                    )}

                    {!isOwnMessage && conversation?.type === "PRIVATE" && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {formatTime(message.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {chatId &&
            (() => {
              const typingData = getTypingUsersInConversation(chatId);
              const typingUsers = typingData
                .filter((data) => data.userId !== currentUserId)
                .map((data) => ({
                  id: data.userId,
                  name:
                    data.user?.fullName || data.user?.name || "Unknown User",
                }));

              if (typingUsers.length === 0) return null;

              return (
                <div
                  ref={typingIndicatorRef}
                  className="mb-3 flex items-center gap-3"
                >
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {typingUsers.length === 1
                          ? typingUsers[0]?.name?.charAt(0).toUpperCase()
                          : "👥"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-1"></div>
                        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-2"></div>
                        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-3"></div>
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-2">
                        {conversation?.type === "PRIVATE"
                          ? ""
                          : typingUsers.length === 1
                          ? `${typingUsers[0]?.name} is typing...`
                          : typingUsers.length === 2
                          ? `${typingUsers[0]?.name} and ${typingUsers[1]?.name} are typing...`
                          : `${typingUsers[0]?.name} and ${
                              typingUsers.length - 1
                            } others are typing...`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Message Input */}
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sending={sending}
          uploadingFile={uploadingFile}
          isConnected={isConnected}
          conversation={conversation}
          onSendMessage={sendMessage}
          onInputChange={handleInputChange}
          onFileUpload={handleFileUpload}
        />
      </div>

      {/* Contact Modal */}
      {showContactModal && conversation?.type === "PRIVATE" && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowContactModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <Contact
              user={user}
              conversation={conversation}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
              userLastSeen={userLastSeen}
              formatLastSeen={formatLastSeen}
              isUserOnline={isUserOnline}
              onClose={() => setShowContactModal(false)}
            />
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && (selectedFile || viewingMessage) && (
        <FilePreview
          file={selectedFile || undefined}
          previewUrl={previewUrl}
          onConfirm={selectedFile ? handleFileConfirm : undefined}
          onCancel={handleFileCancel}
          uploading={uploadingFile}
          mode={selectedFile ? "send" : "view"}
          fileName={viewingMessage?.fileName}
          fileSize={viewingMessage?.fileSize}
          fileType={viewingMessage?.mimeType}
          onDownload={
            viewingMessage
              ? () => handleDownloadMessage(viewingMessage)
              : undefined
          }
        />
      )}
    </>
  );
};

export default ChatWindow;
