"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import NewChatModal from "./NewChatModal";
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
  type: 'PRIVATE' | 'GROUP';
  name: string;
  avatar: string | null;
  lastSeen: string | null;
  lastMessage: LastMessage | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[chatId: string]: string[]}>({});
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const authToken = await getTokenForSocket();
      setToken(authToken);
    };
    initSocket();
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        // Sort chats by last message time (most recent first)
        const sortedChats = data.chats.sort((a: Chat, b: Chat) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        
        setChats(sortedChats);
        setUser(data.user);
      } else {
        console.error('Failed to fetch chats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket integration for typing status only
  const {
    isConnected,
    getTypingUsersInConversation,
  } = useSocket({
    token: token || undefined,
    currentUserId: user?.id,
    onUserTyping: useCallback((data: { userId: string; username: string; conversationId: string }) => {
      // Double-check filtering here as well since useSocket might not be filtering correctly
      if (data.userId !== user?.id) {
        setTypingUsers(prev => {
          const chatTyping = prev[data.conversationId] || [];
          if (!chatTyping.includes(data.username)) {
            return {
              ...prev,
              [data.conversationId]: [...chatTyping, data.username]
            };
          }
          return prev;
        });
      }
    }, [user?.id]),
    onUserStoppedTyping: useCallback((data: { userId: string; username: string; conversationId: string }) => {
      // Remove typing indicator
      setTypingUsers(prev => {
        const chatTyping = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: chatTyping.filter(username => username !== data.username)
        };
      });
    }, []),
  });

  // Background fetch that updates chats smartly without full re-render
  const fetchChatsInBackground = useCallback(async () => {
    try {
      setIsBackgroundFetching(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        setChats(prevChats => {
          const newChats = data.chats;
          const updatedChats = [...prevChats];
          
          // Track which chats have been updated or added
          const chatMap = new Map(prevChats.map(chat => [chat.id, chat]));
          
          newChats.forEach((newChat: Chat) => {
            const existingChat = chatMap.get(newChat.id);
            
            if (!existingChat) {
              // New chat - add it
              updatedChats.push(newChat);
            } else {
              // Existing chat - check if last message changed
              const existingIndex = updatedChats.findIndex(chat => chat.id === newChat.id);
              if (existingIndex !== -1) {
                const hasNewMessage = 
                  !existingChat.lastMessage && newChat.lastMessage ||
                  existingChat.lastMessage?.id !== newChat.lastMessage?.id ||
                  existingChat.lastMessage?.createdAt !== newChat.lastMessage?.createdAt;
                
                if (hasNewMessage || existingChat.name !== newChat.name) {
                  updatedChats[existingIndex] = newChat;
                }
              }
            }
          });
          
          // Sort chats by last message time (most recent first)
          updatedChats.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
          });
          
          return updatedChats;
        });
        
        // Update user info if needed
        if (data.user && (!user || user.id !== data.user.id)) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching chats in background:', error);
    } finally {
      setIsBackgroundFetching(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, []); // Only run once on mount

  // Separate effect for setting up the interval
  useEffect(() => {
    // Only set up interval if we have a user (to avoid running before user is loaded)
    if (!user?.id) {
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up background fetching every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchChatsInBackground();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id]); // Only depend on user ID

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleChatCreated = useCallback((chatId: string) => {
    // Refresh the chat list to show the new chat
    fetchChats();
    // Select the new chat
    onChatSelect(chatId);
  }, [fetchChats, onChatSelect]);

  // Sort filtered chats by last message time (most recent first) - memoized for performance
  const filteredChats = useMemo(() => {
    return chats
      .filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [chats, searchQuery]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMessage = (content: string, maxLength: number = 40) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
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
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                {user?.name}
              </h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">available</span>
                {isBackgroundFetching && (
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse ml-1" title="Syncing..." />
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <MoreHorizontal className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Search */}
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
            Last chats
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
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            No chats found
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition ${
                selectedChatId === chat.id
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
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
                  {chat.type === 'PRIVATE' && chat.lastSeen && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                  )}
                  {chat.type === 'GROUP' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-zinc-900 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{chat.members.length}</span>
                    </div>
                  )}
                </div>

                  {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                      {chat.name}
                    </h4>
                    {chat.lastMessage && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  {chat.type === 'GROUP' && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {chat.members.length} participants
                    </p>
                  )}

                  {/* Typing indicator or last message */}
                  {typingUsers[chat.id] && typingUsers[chat.id].length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">
                        {chat.type === 'PRIVATE' 
                          ? 'typing...' 
                          : `${typingUsers[chat.id][0]} is typing...`
                        }
                      </p>
                    </div>
                  ) : chat.lastMessage ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      {chat.lastMessage.senderId === user?.id 
                        ? `You: ${truncateMessage(chat.lastMessage.content)}`
                        : truncateMessage(chat.lastMessage.content)
                      }
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                      No messages yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default ChatList;