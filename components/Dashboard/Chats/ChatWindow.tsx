"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Phone, Video, MoreHorizontal, Paperclip, Smile } from "lucide-react";
import Image from "next/image";
import { useSocket } from "@/lib/hooks/useSocket";

interface User {
  id: string;
  fullName: string;
  username: string;
  profilePicUrl: string | null;
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  createdAt: string;
  readReceipts: Array<{
    id: string;
    userId: string;
    readAt: string;
    user: {
      id: string;
      fullName: string;
    };
  }>;
}

interface Conversation {
  id: string;
  type: 'PRIVATE' | 'GROUP';
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
}

const ChatWindow = ({ chatId, currentUserId, token }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userLastSeen, setUserLastSeen] = useState<{[userId: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    getTypingUsersInConversation
  } = useSocket({
    token,
    onNewMessage: (message) => {
      setMessages(prev => [...prev, message]);
      // Mark message as read if it's not from current user
      if (message.senderId !== currentUserId && chatId) {
        markMessageRead(message.id, chatId);
      }
    },
    onUserTyping: (data) => {
      // Handle typing indicators
      console.log(`${data.user.fullName} is typing in ${data.conversationId}`);
    },
    onUserStoppedTyping: (data) => {
      console.log(`${data.userId} stopped typing in ${data.conversationId}`);
    },
    onUserOffline: (data) => {
      // Update last seen when user goes offline
      setUserLastSeen(prev => ({
        ...prev,
        [data.userId]: data.lastSeen.toString()
      }));
    }
  });

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      joinConversation(chatId);
    }
    
    return () => {
      if (chatId) {
        leaveConversation(chatId);
      }
    };
  }, [chatId]);

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setConversation(data.conversation);
        
        // Fetch last seen data for private chats
        if (data.conversation?.type === 'PRIVATE') {
          await fetchUserLastSeen(data.conversation.members);
        }
        
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLastSeen = async (members: any[]) => {
    try {
      // Get the other user (not current user)
      const otherUser = members.find(member => member.id !== currentUserId);
      if (!otherUser) return;

      const response = await fetch(`/api/users/${otherUser.username}`);
      const data = await response.json();

      if (data.success && data.user.lastSeen) {
        setUserLastSeen(prev => ({
          ...prev,
          [otherUser.id]: data.user.lastSeen
        }));
      }
    } catch (error) {
      console.error('Error fetching user last seen:', error);
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
        socketSendMessage(chatId, messageContent);
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          console.error('Failed to send message:', data.error);
          setNewMessage(messageContent);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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

    return minutes > 0
      ? `${hours}h ${minutes}m ago`
      : `${hours}h ago`;
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
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
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
          0%, 60%, 100% {
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
                {conversation.type === 'GROUP' ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {conversation.members.length} participants
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const otherUser = conversation.members.find(member => member.id !== currentUserId);
                      const isOnline = otherUser && isUserOnline(otherUser.id);
                      const lastSeen = otherUser && userLastSeen[otherUser.id];
                      
                      return (
                        <>
                          <div className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isOnline 
                              ? 'online' 
                              : lastSeen 
                                ? `last seen ${formatLastSeen(lastSeen)}`
                                : 'offline'
                            }
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
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <Video className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <MoreHorizontal className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Tabs - Only show for group chats */}
          {conversation.type === 'GROUP' && (
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

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

              <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
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

                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
                  {!isOwnMessage && conversation?.type === 'GROUP' && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {message.sender.fullName}, {formatTime(message.createdAt)}
                    </p>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>

                  {isOwnMessage && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-right">
                      {formatTime(message.createdAt)}
                    </p>
                  )}
                  
                  {!isOwnMessage && conversation?.type === 'PRIVATE' && (
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
        {chatId && getTypingUsersInConversation(chatId).length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <div className="shrink-0">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {conversation?.type === 'PRIVATE' 
                    ? conversation.name.charAt(0).toUpperCase()
                    : '👥'
                  }
                </span>
              </div>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-1"></div>
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-2"></div>
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-3"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4">
        {/* Typing Indicators */}
        {/* {chatId && getTypingUsersInConversation(chatId).length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <div className="shrink-0">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {conversation?.type === 'PRIVATE' 
                    ? conversation.name.charAt(0).toUpperCase()
                    : '👥'
                  }
                </span>
              </div>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-1"></div>
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-2"></div>
                <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full typing-dot-3"></div>
              </div>
            </div>
          </div>
        )} */}
        
        <form onSubmit={sendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={
                  conversation?.type === 'PRIVATE' 
                    ? `Message ${conversation.name}...` 
                    : "Write your message..."
                }
                disabled={sending}
                className="w-full px-4 py-3 pr-20 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                >
                  <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>
                <button
                  type="button"
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                >
                  <Smile className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-xl transition disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Real-time messaging unavailable - using fallback mode
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ChatWindow;