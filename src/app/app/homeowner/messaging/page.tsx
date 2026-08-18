"use client";

import { useEffect, useState } from "react";
import { ConversationList, Conversation } from "@/components/messaging/conversation-list";
import { ChatWindow } from "@/components/messaging/chat-window";
import { supabase } from "@/lib/supabase";
import { ConversationProfilePanel } from "@/components/messaging/conversation-profile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserCircle2 } from "lucide-react";

export default function HomeownerMessagingPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  function handleSelectConversation(conversationId: string, conversation?: any) {
    setSelectedConversationId(conversationId);
    setSelectedConversation(conversation);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full mb-4" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="text-center px-8">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-5 inline-flex mb-5">
            <svg className="h-10 w-10 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Authentication required
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Please sign in to view your messages
          </p>
        </div>
      </div>
    );
  }

  const otherPartyName = selectedConversation?.contractor
    ? selectedConversation.contractor.business_name ||
      selectedConversation.contractor.full_name ||
      "Unknown Contractor"
    : "Select a conversation";
  const jobAddress = selectedConversation?.jobs
    ? `${selectedConversation.jobs.address}, ${selectedConversation.jobs.city}`
    : undefined;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 -m-4 md:-m-8 overflow-hidden">
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-700 flex flex-col shrink-0">
        <ConversationList
          currentUserId={currentUserId}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>
      <div className="flex flex-1 min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversationId ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 bg-white/50 dark:bg-zinc-800/30 backdrop-blur-sm shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {otherPartyName}
                  </p>
                  {jobAddress && (
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                      {jobAddress}
                    </p>
                  )}
                </div>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowProfile((prev) => !prev)}
                        className="rounded-lg p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 ml-3"
                        aria-label={
                          showProfile ? "Hide User Profile" : "Show User Profile"
                        }
                      >
                        <UserCircle2 className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {showProfile ? "Hide Profile" : "Show Profile"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <ChatWindow
                  conversationId={selectedConversationId}
                  currentUserId={currentUserId}
                  otherPartyName={
                    selectedConversation?.contractor?.business_name ||
                    selectedConversation?.contractor?.full_name
                  }
                  jobAddress={jobAddress}
                />
              </div>
            </>
          ) : (
            <div className="flex-1">
              <ChatWindow
                conversationId={null}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
        <ConversationProfilePanel
          conversation={selectedConversation}
          viewer="homeowner"
          isOpen={showProfile && !!selectedConversationId}
          onClose={() => setShowProfile(false)}
        />
      </div>
    </div>
  );
}

