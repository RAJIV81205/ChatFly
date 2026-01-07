"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, MessageCircleOff } from "lucide-react";
import Image from "next/image";
import NewChatModal from "./NewChatModal";
import { cacheStore } from "@/lib/hooks/cacheStore";
import { useSocket } from "@/lib/hooks/useSocket";
import { getTokenForSocket } from "@/lib/utils/auth";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
}

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface Chat {
  id: string;
  type: "PRIVATE" | "GROUP";
  name: string;
  avatar: string | null;
  lastSeen: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  members: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isAdmin: boolean;
  }>;
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

const ChatList = ({ onChatSelect, selectedChatId }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [socketToken, setSocketToken] = useState<string | null>(null);

  const { onlineUsers , getTypingUsersInConversation} = useSocket({
    token: socketToken || undefined,
    onNewMessage: (message) => {
      // When a new message arrives, refresh the chat list to update unread counts
      // Only refresh if the message is not from the current user and not in the selected chat
      if (message.senderId !== user?.id && message.conversationId !== selectedChatId) {
        fetchChats();
      }
    },
    onMessageRead: (data) => {
      // When a message is read, update the unread count for that conversation
      // This handles read receipts from other users in the same conversation
      fetchChats();
    },
    onUserTyping: () => {
      // Force re-render when someone starts typing
      setChats(prev => [...prev]);
    },
    onUserStoppedTyping: () => {
      // Force re-render when someone stops typing
      setChats(prev => [...prev]);
    },
  });

  // Load cache + socket token
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await getTokenForSocket();
        setSocketToken(token);
      } catch (error) {
        console.error("Failed to get socket token:", error);
      }
    };

    initializeSocket();

    let hasCache = false;

    try {
      const cached = cacheStore.getCachedChatList();
      if (cached) {
        // Ensure cached chats have unreadCount property
        const chatsWithUnreadCount = cached.chats.map(chat => ({
          ...chat,
          unreadCount: (chat as any).unreadCount || 0
        }));
        setChats(chatsWithUnreadCount);
        setUser(cached.user);
        hasCache = true;
      }
    } catch {}

    setLoading(!hasCache);
    fetchChats();
  }, []);



  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!data.success || !Array.isArray(data.chats)) {
        console.warn("Invalid chat data:", data);
        return;
      }

      const sortedChats = data.chats.sort((a: Chat, b: Chat) => {
        const aTime = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt).getTime()
          : a.lastSeen
          ? new Date(a.lastSeen).getTime()
          : 0;

        const bTime = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt).getTime()
          : b.lastSeen
          ? new Date(b.lastSeen).getTime()
          : 0;

        return bTime - aTime;
      });

      setChats(sortedChats);
      setUser(data.user);

      // Cache updated chat list
      cacheStore.cacheChatList(sortedChats, data.user);
    } catch (error) {
      console.error("fetchChats failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatCreated = (chatId: string) => {
    fetchChats();
    onChatSelect(chatId);
  };

  const markChatAsRead = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Update the local state to reflect read status
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId 
              ? { ...chat, unreadCount: 0 }
              : chat
          )
        );
        
        // Update cache
        const updatedChats = chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        );
        if (user) {
          cacheStore.cacheChatList(updatedChats, user);
        }
      }
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    markChatAsRead(chatId);
  };

  // Search filter
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();

    if (chat.type === "GROUP") {
      if (chat.name.toLowerCase().includes(q)) return true;
    }

    if (chat.type === "PRIVATE" && user) {
      const otherMember = chat.members.find((m) => m.id !== user.id);
      if (otherMember) {
        if (
          otherMember.name.toLowerCase().includes(q) ||
          otherMember.username.toLowerCase().includes(q)
        ) {
          return true;
        }
      }
    }

    if (chat.lastMessage?.content?.toLowerCase().includes(q)) {
      return true;
    }

    return false;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const truncateMessage = (content: string, maxLength = 40) =>
    content.length > maxLength ? content.substring(0, maxLength) + "..." : content;

  if (loading) {
    return (
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center">
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
            transform: translateY(-4px);
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
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-white">{user?.name}</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">available</span>
              </div>
            </div>
          </div>

          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <MoreHorizontal className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Chat List Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Recent chats
          </h3>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
          >
            <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 flex flex-col h-full justify-center items-center text-center text-zinc-500 dark:text-zinc-400 select-none">
            <MessageCircleOff className="w-10 h-10 mb-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
              No chats found
            </p>
            <p className="text-sm mt-1 text-zinc-500 dark:text-zinc-400">
              Click on the{" "}
              <span className="font-semibold text-zinc-300 dark:text-white">“+”</span>{" "}
              above to start chatting
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherMember =
              chat.type === "PRIVATE"
                ? chat.members.find((m) => m.id !== user?.id)
                : null;

            // FINAL FIX: correct online check
            const isOnline =
              otherMember &&
              onlineUsers?.some((u) => u.user?.id === otherMember.id);

            return (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition ${
                  selectedChatId === chat.id
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : chat.unreadCount > 0
                    ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 bg-blue-50/30 dark:bg-blue-900/10"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    {chat.avatar ? (
                      <Image
                        src={chat.avatar}
                        alt={chat.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          {chat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* ONLINE/OFFLINE DOT */}
                    {chat.type === "PRIVATE" && otherMember && (
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isOnline ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-500"
                        }`}
                      />
                    )}

                    {/* GROUP PARTICIPANT COUNT */}
                    {chat.type === "GROUP" && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {chat.members.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-zinc-900 dark:text-white truncate ${
                        chat.unreadCount > 0 ? 'font-bold' : 'font-medium'
                      }`}>
                        {chat.name}
                      </h4>

                      <div className="flex items-center gap-2 ml-2">
                        {chat.lastMessage && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                        
                        {/* Unread count badge */}
                        {chat.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GROUP INFO */}
                    {chat.type === "GROUP" && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        {chat.members.length} participants
                      </p>
                    )}

                    {/* LAST MESSAGE */}
                    {(() => {
                      // Check if someone is typing in this chat
                      const typingData = getTypingUsersInConversation(chat.id);
                      const typingUsers = typingData.filter(data => data.userId !== user?.id);
                      
                      if (typingUsers.length > 0) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full typing-dot-1"></div>
                              <div className="w-1 h-1 bg-emerald-500 rounded-full typing-dot-2"></div>
                              <div className="w-1 h-1 bg-emerald-500 rounded-full typing-dot-3"></div>
                            </div>
                            <span className="text-sm text-emerald-600 dark:text-emerald-400 italic">
                              {chat.type === "PRIVATE"
                                ? "typing..."
                                : typingUsers.length === 1
                                ? `${typingUsers[0].user?.fullName || 'Someone'} is typing...`
                                : `${typingUsers.length} people are typing...`}
                            </span>
                          </div>
                        );
                      }
                      
                      // Show last message if no one is typing
                      if (chat.lastMessage) {
                        return (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                            {chat.lastMessage.senderId === user?.id
                              ? `You: ${truncateMessage(chat.lastMessage.content)}`
                              : truncateMessage(chat.lastMessage.content)}
                          </p>
                        );
                      }
                      
                      return (
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                          No messages yet
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
    </>
  );
};

export default ChatList;
