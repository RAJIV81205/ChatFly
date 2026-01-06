interface CachedMessage {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    username: string;
    profilePicUrl: string | null;
  };
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

interface CachedConversation {
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

interface ChatCache {
  messages: CachedMessage[];
  conversation: CachedConversation | null;
  lastFetched: number;
}

class CacheStore {
  private static instance: CacheStore;
  private cache: Map<string, ChatCache> = new Map();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheStore {
    if (!CacheStore.instance) {
      CacheStore.instance = new CacheStore();
    }
    return CacheStore.instance;
  }

  // Get cached messages for a chat
  getCachedMessages(chatId: string): { messages: CachedMessage[]; conversation: CachedConversation | null } | null {
    try {
      // First try memory cache
      const memoryCache = this.cache.get(chatId);
      if (memoryCache && this.isCacheValid(memoryCache.lastFetched)) {
        return {
          messages: memoryCache.messages,
          conversation: memoryCache.conversation
        };
      }

      // Then try localStorage
      const cached = localStorage.getItem(`chat_${chatId}`);
      if (cached) {
        const parsedCache: ChatCache = JSON.parse(cached);
        
        // Update memory cache
        this.cache.set(chatId, parsedCache);
        
        return {
          messages: parsedCache.messages,
          conversation: parsedCache.conversation
        };
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    
    return null;
  }

  // Cache messages for a chat
  cacheMessages(chatId: string, messages: CachedMessage[], conversation: CachedConversation | null): void {
    try {
      const cacheData: ChatCache = {
        messages,
        conversation,
        lastFetched: Date.now()
      };

      // Update memory cache
      this.cache.set(chatId, cacheData);

      // Update localStorage
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  // Add a new message to cache
  addMessageToCache(chatId: string, message: CachedMessage): void {
    try {
      const cached = this.getCachedMessages(chatId);
      if (cached) {
        const updatedMessages = [...cached.messages, message];
        this.cacheMessages(chatId, updatedMessages, cached.conversation);
      }
    } catch (error) {
      console.error('Error adding message to cache:', error);
    }
  }

  // Update a message in cache (for read receipts, status changes)
  updateMessageInCache(chatId: string, messageId: string, updates: Partial<CachedMessage>): void {
    try {
      const cached = this.getCachedMessages(chatId);
      if (cached) {
        const updatedMessages = cached.messages.map(msg => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
        this.cacheMessages(chatId, updatedMessages, cached.conversation);
      }
    } catch (error) {
      console.error('Error updating message in cache:', error);
    }
  }

  // Check if cache is still valid
  private isCacheValid(lastFetched: number): boolean {
    return Date.now() - lastFetched < this.CACHE_EXPIRY;
  }

  // Clear cache for a specific chat
  clearChatCache(chatId: string): void {
    try {
      this.cache.delete(chatId);
      localStorage.removeItem(`chat_${chatId}`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Clear all cache
  clearAllCache(): void {
    try {
      this.cache.clear();
      // Clear all chat caches from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('chat_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }
}

export const cacheStore = CacheStore.getInstance();