"use client";

import { Paperclip, Smile, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  sending: boolean;
  uploadingFile: boolean;
  isConnected: boolean;
  conversation: {
    type: "PRIVATE" | "GROUP";
    name: string;
  } | null;
  onSendMessage: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload: (file: File) => void;
}


const MessageInput = ({
  newMessage,
  setNewMessage,
  sending,
  uploadingFile,
  isConnected,
  conversation,
  onSendMessage,
  onInputChange,
  onFileUpload,
}: MessageInputProps) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addEmoji = (emoji: string) => {
    if (!inputRef.current) return;

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;

    const updated = newMessage.slice(0, start) + emoji + newMessage.slice(end);

    setNewMessage(updated);
    setShowEmoji(false);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(
        start + emoji.length,
        start + emoji.length
      );
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="relative border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <form onSubmit={onSendMessage} className="flex items-end gap-3 px-4 py-3">
        {/* Emoji Button (LEFT) */}
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Smile className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
          </button>

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-14 left-0 z-50">
              <EmojiPicker
                onSelect={(emoji) => {
                  const input = inputRef.current!;
                  const start = input.selectionStart || 0;
                  const end = input.selectionEnd || 0;

                  const updated =
                    newMessage.slice(0, start) + emoji + newMessage.slice(end);

                  setNewMessage(updated);
                  setShowEmoji(false);

                  requestAnimationFrame(() => {
                    input.focus();
                    input.setSelectionRange(
                      start + emoji.length,
                      start + emoji.length
                    );
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={onInputChange}
            disabled={sending}
            placeholder={
              conversation?.type === "PRIVATE"
                ? `Message ${conversation.name}…`
                : "Type a message…"
            }
            className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 pr-14 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 disabled:opacity-50"
          />

          {/* Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {uploadingFile ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Send */}
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:scale-105 transition disabled:from-zinc-300 dark:disabled:from-zinc-700 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-5 w-5 translate-x-px" />
          )}
        </button>
      </form>

      {!isConnected && (
        <div className="px-4 pb-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠ Real-time messaging unavailable — messages may be delayed
        </div>
      )}
    </div>
  );
};

export default MessageInput;
