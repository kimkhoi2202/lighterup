"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { ChatWelcome } from "./chat-welcome";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useQueryClient } from "@tanstack/react-query";

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

interface ReplyingTo {
  id: string;
  content: string;
  senderName: string;
}

interface ChatWindowProps {
  conversationId: string | null;
  currentUserId: string;
  otherPartyName?: string;
  jobAddress?: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherPartyName,
  jobAddress,
}: ChatWindowProps) {
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const queryKey = `chat:${conversationId}`;
  const addKey = `chat:${conversationId}:messages`;
  const updateKey = `chat:${conversationId}:messages:update`;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useChatQuery({
    queryKey,
    apiUrl: `/api/conversations/${conversationId}/messages`,
    paramKey: "conversationId",
    paramValue: conversationId || "",
  });

  useChatSocket({
    addKey,
    updateKey,
    queryKey,
    conversationId: conversationId || "",
  });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  async function handleSendMessage(content: string) {
    if (!conversationId || !content.trim() || sending) return;

    setSending(true);
    const currentReplyingTo = replyingTo;
    setReplyingTo(null); // Clear reply state immediately

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
      edited_at: null,
      deleted_at: null,
      reply_to_message_id: currentReplyingTo?.id || null,
      sender: {
        id: currentUserId,
        full_name: "You",
        business_name: null,
      },
    };

    // Optimistically update the cache - use the same query key format as the query
    queryClient.setQueryData([queryKey, conversationId], (oldData: any) => {
      if (!oldData?.pages || oldData.pages.length === 0) {
        return {
          pages: [
            {
              items: [optimisticMessage],
              nextCursor: null,
            },
          ],
          pageParams: [undefined],
        };
      }

      const newPages = [...oldData.pages];
      // Add to the end of the first page (newest messages go at the end after reversal)
      if (newPages[0]?.items) {
        newPages[0] = {
          ...newPages[0],
          items: [...newPages[0].items, optimisticMessage],
        };
      } else {
        newPages[0] = {
          items: [optimisticMessage],
          nextCursor: null,
        };
      }

      return {
        ...oldData,
        pages: newPages,
      };
    });

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            reply_to_message_id: currentReplyingTo?.id || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const { message } = await response.json();

      // Replace optimistic message with real message
      queryClient.setQueryData([queryKey, conversationId], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: Message) =>
            item.id === tempId ? message : item
          ),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Remove optimistic message on error
      queryClient.setQueryData([queryKey, conversationId], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((item: Message) => item.id !== tempId),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });

      // Show user-friendly error message
      const errorMessage =
        error?.message?.includes("network") ||
        error?.message?.includes("fetch")
          ? "No internet connection. Please check your network and try again."
          : error?.message?.includes("user")
          ? "User not found. Please refresh the page."
          : error?.message || "Failed to send message. Please try again.";

      alert(errorMessage);
    } finally {
      setSending(false);
    }
  }

  async function handleEditMessage(messageId: string, newContent: string) {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to edit message");
      }

      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete message");
      }

      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  function handleReply(message: Message) {
    const senderName = message.sender.business_name || message.sender.full_name;
    setReplyingTo({
      id: message.id,
      content: message.content,
      senderName,
    });
  }

  function handleCancelReply() {
    setReplyingTo(null);
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="text-center px-8">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-5 inline-flex mb-5">
            <svg className="h-10 w-10 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Select a conversation
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Choose from your existing conversations to start chatting
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-50/50 dark:bg-zinc-900/30 px-8">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-5 mb-5">
          <svg className="h-10 w-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">
          Something went wrong!
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Failed to load messages. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Flatten and deduplicate messages
  const allMessages = data?.pages?.flatMap((page) => page.items || []) || [];
  const messagesMap = new Map<string, Message>();
  allMessages.forEach((msg) => {
    messagesMap.set(msg.id, msg);
  });
  const messages = Array.from(messagesMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col flex-1 bg-zinc-50/30 dark:bg-zinc-900/20 min-h-0">
      <div
        ref={chatRef}
        className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0"
      >
        {!hasNextPage && <div className="flex-1" />}
        {!hasNextPage && messages.length === 0 && (
          <ChatWelcome
            name={otherPartyName || "the other party"}
            jobAddress={jobAddress}
          />
        )}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Loading messages...</span>
              </div>
            ) : (
              <button
                onClick={() => fetchNextPage()}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow transition-all duration-200"
              >
                Load previous messages
              </button>
            )}
          </div>
        )}
        <ol
          className="flex flex-col"
          role="list"
          aria-label="Messages"
        >
          {messages.map((message: Message, index: number) => {
            const previousMessage =
              index > 0 ? messages[index - 1] : undefined;
            const isOwnMessage = message.sender_id === currentUserId;
            
            // Discord-style grouping: show avatar/name only if:
            // 1. No previous message
            // 2. Different sender
            // 3. Time gap > 5 minutes
            const showAvatar =
              !previousMessage ||
              previousMessage.sender_id !== message.sender_id ||
              new Date(message.created_at).getTime() -
                new Date(previousMessage.created_at).getTime() >
                300000; // 5 minutes
            
            // In Discord, name is only shown when avatar is shown
            const showName = showAvatar;

            return (
              <MessageBubble
                key={`${message.id}-${index}`}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                showName={showName}
                previousMessage={previousMessage}
                currentUserId={currentUserId}
                conversationId={conversationId}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onReply={handleReply}
              />
            );
          })}
        </ol>
        <div ref={bottomRef} />
      </div>
          <MessageInput
            onSend={handleSendMessage}
            disabled={sending}
            placeholder={otherPartyName ? `Message @${otherPartyName.split(' ')[0]}` : "Type a message..."}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
          />
    </div>
  );
}








