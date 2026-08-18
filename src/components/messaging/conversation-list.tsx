"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import { useGetConversationsQuery, type Conversation } from "@/store/api/conversations-api";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Re-export for consumers
export type { Conversation };

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, conversation?: Conversation) => void;
  initialConversations?: Conversation[];
}

export function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  initialConversations,
}: ConversationListProps) {
  // RTK Query hook
  const { data: conversationsData, isLoading } = useGetConversationsQuery();
  const conversations = useMemo(
    () => conversationsData?.conversations || initialConversations || [],
    [conversationsData, initialConversations]
  );

function getInitials(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "??";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getOtherPartyName(conversation: Conversation, currentUserId: string): string {
  if (conversation.homeowner_id === currentUserId) {
    if (!conversation.contractor) return "Unknown Contractor";
    return conversation.contractor.business_name || conversation.contractor.full_name || "Unknown Contractor";
  }
  if (!conversation.homeowner) return "Unknown Homeowner";
  return conversation.homeowner.full_name || "Unknown Homeowner";
}

  if (isLoading && !initialConversations?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-4">
          <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No conversations yet</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          Start chatting about your jobs
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Messages</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {conversations.map((conversation) => {
          const isSelected = selectedConversationId === conversation.id;
          const otherPartyName = getOtherPartyName(conversation, currentUserId);
          const hasUnread = (conversation.unread_count ?? 0) > 0;
          const avatarLabel = getInitials(otherPartyName);

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id, conversation)}
              className={cn(
                "w-full px-3.5 py-3 flex items-center gap-3.5 rounded-xl transition-all duration-200 text-left",
                "hover:bg-white dark:hover:bg-zinc-800/50 hover:shadow-sm",
                isSelected && "bg-white dark:bg-zinc-800/70 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              )}
            >
              <Avatar className="h-11 w-11 ring-2 ring-zinc-100 dark:ring-zinc-800">
                <AvatarImage src={undefined} alt={otherPartyName} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {avatarLabel}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p
                    className={cn(
                      "text-[15px] font-medium truncate text-zinc-900 dark:text-zinc-100 transition-colors",
                      hasUnread && "font-semibold"
                    )}
                  >
                    {otherPartyName}
                  </p>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 ml-2 shrink-0">
                    {conversation.last_message_at ? formatRelativeTime(conversation.last_message_at) : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate">
                    {conversation.jobs?.address || "No address"}
                  </p>
                  {hasUnread && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold ml-2 shrink-0">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


