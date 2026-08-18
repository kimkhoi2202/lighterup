"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "./emoji-picker";
import { X } from "lucide-react";

interface ReplyingTo {
  id: string;
  content: string;
  senderName: string;
}

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ReplyingTo | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (content.trim() && !disabled && !isSending) {
      const messageContent = content.trim();

      // Clear content first
      setContent("");
      setIsSending(true);

      // Send message asynchronously without awaiting
      // This prevents any blocking
      const result = onSend(messageContent);
      if (result && typeof result.then === 'function') {
        result
          .catch((error) => {
            console.error("Error sending message:", error);
          })
          .finally(() => {
            setIsSending(false);
          });
      } else {
        setIsSending(false);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleEmojiSelect(emoji: string) {
    setContent((prev) => `${prev} ${emoji}`);
    // Refocus the input immediately after selecting emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    <div className="sticky bottom-0 bg-linear-to-t from-white to-white/95 dark:from-zinc-800 dark:to-zinc-800/95 backdrop-blur-sm">
      <form onSubmit={handleSend} className="px-5 pb-5 pt-3">
        {/* Reply preview bar */}
        {replyingTo && (
          <div className="flex items-center justify-between gap-3 mb-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-t-2xl border border-b-0 border-zinc-200 dark:border-zinc-700">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Replying to{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {replyingTo.senderName}
                </span>
              </span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                {replyingTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={`relative flex items-center gap-3 bg-white dark:bg-zinc-900/50 ${replyingTo ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'} border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all duration-200 px-4 py-3`}>
          <div className="flex-1 relative flex items-center">
            <Input
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none leading-normal"
              placeholder={placeholder}
              aria-disabled={disabled || isSending}
            />
            <div className="absolute right-0 flex items-center">
              <EmojiPicker onChange={handleEmojiSelect} />
            </div>
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 px-1 font-medium">
          Press <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Enter</span> to send
        </div>
      </form>
    </div>
  );
}



