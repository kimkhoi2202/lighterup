"use client";

import { Conversation } from "./conversation-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConversationProfilePanelProps {
  conversation?: Conversation | null;
  viewer: "contractor" | "homeowner";
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationProfilePanel({
  conversation,
  viewer,
  isOpen,
  onClose,
}: ConversationProfilePanelProps) {
  const otherParty =
    viewer === "contractor"
      ? conversation?.homeowner
      : conversation?.contractor;

  const otherName = otherParty?.full_name
    ? viewer === "contractor"
      ? otherParty.full_name
      : (otherParty as any).business_name || otherParty.full_name
    : "User";

  const initials = otherName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const jobAddress = conversation?.jobs
    ? `${conversation.jobs.address}, ${conversation.jobs.city}`
    : "";

  return (
    <aside
      className={`${
        isOpen ? "flex" : "hidden"
      } w-80 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-700/80 bg-white/50 dark:bg-zinc-800/30">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h3>
        <button
          onClick={onClose}
          className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-200"
        >
          Close
        </button>
      </div>
      {conversation ? (
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-zinc-200/50 dark:border-zinc-700/50">
            <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-zinc-800 shadow-md">
              <AvatarImage src={undefined} alt={otherName} />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                {otherName}
              </p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {viewer === "contractor" ? "Homeowner" : "Contractor"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Job Details
              </h4>
            </div>
            {conversation.jobs ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4 shadow-sm space-y-3 transition-all duration-200 hover:shadow-md">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Address
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {conversation.jobs.address}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Location
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {conversation.jobs.city}, {conversation.jobs.state}{" "}
                    {conversation.jobs.zip}
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Status
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    conversation.jobs.status === "assigned"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}>
                    {conversation.jobs.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4 shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Job information not available
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-300">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-4">
            <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            No conversation selected
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select a conversation to view profile details
          </p>
        </div>
      )}
    </aside>
  );
}


