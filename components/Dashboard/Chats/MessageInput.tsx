import { Paperclip, Smile, Send } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  sending: boolean;
  isConnected: boolean;
  conversation: {
    type: 'PRIVATE' | 'GROUP';
    name: string;
  } | null;
  onSendMessage: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MessageInput = ({
  newMessage,
  setNewMessage,
  sending,
  isConnected,
  conversation,
  onSendMessage,
  onInputChange
}: MessageInputProps) => {
    return (
          <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4">
        
        
        <form onSubmit={onSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={onInputChange}
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
    );
}

export default MessageInput;