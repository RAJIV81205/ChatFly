"use client";

import { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { getTokenForSocket } from "@/lib/utils/auth";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
}

const ChatInterface = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get JWT token for WebSocket authentication
    const fetchToken = async () => {
      const authToken = await getTokenForSocket();
      setToken(authToken);
    };
    
    fetchToken();
    
    // Get current user info from the chats API
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  return (
    <div className="flex h-full">
      <ChatList 
        onChatSelect={handleChatSelect}
        selectedChatId={selectedChatId}
      />
      <ChatWindow 
        chatId={selectedChatId}
        currentUserId={currentUser?.id || null}
        token={token || undefined}
      />
    </div>
  );
};

export default ChatInterface;