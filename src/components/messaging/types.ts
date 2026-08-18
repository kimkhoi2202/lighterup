"use client";

// UI-facing types that adapt our Supabase schema to the Code 2
// messaging template expectations. These are purely front-end
// representations and are populated from our existing API responses.

export type PresenceStatus = "online" | "offline" | "away" | "dnd";

// Normalized user representation used by the messaging UI
export interface UiUser {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  status?: PresenceStatus;
  lastSeenAt?: string | null;
}

// Per-emoji reaction bundle, matching the Code 2 `Reaction` shape
export interface UiReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

// Single message, normalized for the UI. This is designed so it can
// be constructed from our `/api/conversations/[id]/messages` payloads.
export interface UiMessage {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  createdAt: string;

  // Optional metadata populated when available
  replyToMessageId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;

  reactions?: UiReaction[];
  isPinned?: boolean;

  // List of user IDs who have read this message
  readByUserIds?: string[];
}

// Conversation representation used by the sidebar + header
export interface UiConversation {
  id: string;
  participantIds: string[];

  // Last activity time (maps from `last_message_at`)
  lastMessageAt: string;

  // Unread count from the perspective of the current user
  unreadCount: number;

  // Whether the other party is currently typing
  isTyping?: boolean;

  // Job metadata (from our domain)
  jobId?: string;
  jobAddress?: string;
  jobCity?: string;
  jobState?: string;
  jobZip?: string;
  jobStatus?: string;

  // Convenience `other user` id for the current viewer
  otherUserId?: string;
}

// Typing state used by the UI when we hook into Supabase Realtime
export interface TypingState {
  userId: string;
  conversationId: string;
  lastUpdatedAt: number;
}


