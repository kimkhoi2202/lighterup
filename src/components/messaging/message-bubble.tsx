"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageHoverToolbar } from "./message-hover-toolbar";
import { Input } from "@/components/ui/input";
import { CornerDownRight } from "lucide-react";

interface RepliedToMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    full_name: string;
    business_name: string | null;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to_message_id?: string | null;
  replied_to_message?: RepliedToMessage | null;
  sender: {
    id: string;
    full_name: string;
    business_name: string | null;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showName: boolean;
  previousMessage?: Message;
  currentUserId: string;
  conversationId: string;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onReply?: (message: Message) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showName,
  previousMessage,
  currentUserId,
  conversationId,
  onEdit,
  onDelete,
  onReply,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Reset edit state when message changes
  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [message.content, message.id]);

  const displayName = message.sender.business_name || message.sender.full_name;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isDeleted = !!message.deleted_at;
  const canEdit = isOwnMessage && !isDeleted && onEdit;
  const canDelete = isOwnMessage && !isDeleted && onDelete;

  // Check if this message is from a different day than the previous one
  const showDateSeparator =
    !previousMessage ||
    new Date(message.created_at).toDateString() !==
      new Date(previousMessage.created_at).toDateString();

  // Format timestamp
  const messageDate = new Date(message.created_at);
  
  // Format timestamp like Discord: "Today at 10:23 AM", "Yesterday at 10:23 AM", or "1/7/25, 10:23 AM"
  function formatDiscordTimestamp(date: Date): string {
    const now = new Date();
    const isSameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isSameDay) {
      return `Today at ${time}`;
    }

    if (isYesterday) {
      return `Yesterday at ${time}`;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}, ${time}`;
  }
  
  // Format compact timestamp for grouped messages: [H:MM AM/PM]
  function formatCompactTimestamp(date: Date): string {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function handleEdit() {
    if (!onEdit || !editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await onDelete(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
  }

  return (
    <>
      {showDateSeparator && (
        <div
          className="relative flex items-center justify-center py-6"
          role="separator"
          aria-label={new Date(message.created_at).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200/50 dark:border-zinc-700/50" />
          </div>
          <span className="relative bg-white dark:bg-zinc-800 px-4 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 rounded-full">
            {new Date(message.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      )}
      <li className="list-none" role="article" aria-roledescription="Message">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "message cozyMessage wrapper group relative flex items-start gap-4 px-5 transition-all duration-200",
            "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30",
            showAvatar ? "groupStart pt-3 pb-1" : "py-0.5"
          )}
        >
          <div className="flex items-start gap-3 w-full relative">
            {showAvatar ? (
              <Avatar className="avatar h-10 w-10 shrink-0 cursor-pointer" aria-hidden="true">
                <AvatarImage src={undefined} alt=" " />
                <AvatarFallback className="bg-zinc-200 text-zinc-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 shrink-0 flex items-start justify-end pr-1 pt-1">
                <span className="timestamp text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-none">
                  <time dateTime={message.created_at}>
                    {formatCompactTimestamp(messageDate)}
                  </time>
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* Reply reference - show the original message being replied to */}
              {message.replied_to_message && (
                <div className="flex items-center gap-2 mb-1.5 group/reply cursor-pointer">
                  <CornerDownRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors shrink-0">
                      @{message.replied_to_message.sender.business_name || message.replied_to_message.sender.full_name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate group-hover/reply:text-zinc-600 dark:group-hover/reply:text-zinc-400 transition-colors">
                      {message.replied_to_message.content}
                    </span>
                  </div>
                </div>
              )}
              {showName && (
                <h3 className="header flex items-center gap-2 mb-1.5">
                  <span className="headerText">
                    <span className="username font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-150">
                      {displayName}
                    </span>
                  </span>
                  <span className="timestamp timestampInline text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center font-medium">
                    <time dateTime={message.created_at}>
                      {formatDiscordTimestamp(messageDate)}
                    </time>
                  </span>
                </h3>
              )}
              <div className="flex items-start gap-1.5 relative w-full">
                {isEditing ? (
                  <div className="w-full">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-[15px] text-zinc-900 dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all duration-200"
                      autoFocus
                    />
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                      Press Esc to{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent(message.content);
                        }}
                        className="text-zinc-700 dark:text-zinc-300 font-semibold hover:underline cursor-pointer"
                      >
                        cancel
                      </button>{" "}
                      • Enter to{" "}
                      <button
                        type="button"
                        onClick={handleEdit}
                        disabled={isSubmitting}
                        className="text-zinc-700 dark:text-zinc-300 font-semibold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      id={`message-content-${message.id}`}
                      className="markup messageContent text-[15px] leading-normal text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap wrap-break-word m-0 overflow-wrap-anywhere"
                    >
                      {isDeleted ? (
                        <span className="italic text-zinc-400 dark:text-zinc-500 text-sm">
                          This message was deleted
                        </span>
                      ) : (
                        <>
                          <span>{message.content}</span>
                          {message.edited_at && (
                            <span className="timestamp ml-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                              <time dateTime={message.edited_at}>
                                (edited)
                              </time>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {/* Hover toolbar - show for all messages (reply), edit/delete only for own */}
                    {isHovered && !isDeleted && (
                      <div className="absolute -top-8 right-0 z-20 animate-in fade-in duration-150">
                        <MessageHoverToolbar
                          canEdit={!!canEdit && !!canDelete}
                          onEdit={() => setIsEditing(true)}
                          onDelete={handleDelete}
                          onReply={onReply ? () => onReply(message) : undefined}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </li>
    </>
  );
}

