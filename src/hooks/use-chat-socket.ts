import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
  conversationId: string;
};

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  sender: {
    id: string;
    full_name: string;
    business_name: string | null;
  };
}

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
  conversationId,
}: ChatSocketProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || conversationId === "") {
      return;
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data: newMessage } = await supabase
            .from("messages")
            .select(
              `
              id,
              conversation_id,
              sender_id,
              content,
              created_at,
              read_at,
              edited_at,
              deleted_at,
              reply_to_message_id,
              sender:sender_id (
                id,
                full_name,
                business_name
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          // If message has a reply, fetch the replied-to message
          if (newMessage?.reply_to_message_id) {
            const { data: repliedTo } = await supabase
              .from("messages")
              .select(
                `
                id,
                content,
                sender:sender_id (
                  id,
                  full_name,
                  business_name
                )
              `
              )
              .eq("id", newMessage.reply_to_message_id)
              .single();

            if (repliedTo) {
              (newMessage as any).replied_to_message = repliedTo;
            }
          }

          if (newMessage) {
            queryClient.setQueryData([queryKey, conversationId], (oldData: any) => {
              if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                return {
                  pages: [
                    {
                      items: [newMessage],
                      nextCursor: null,
                    },
                  ],
                  pageParams: [undefined],
                };
              }

              const newData = [...oldData.pages];
              // Add to the last page (most recent messages at the end)
              const lastPageIndex = newData.length - 1;
              const lastPage = newData[lastPageIndex];
              newData[lastPageIndex] = {
                ...lastPage,
                items: [...(lastPage.items || []), newMessage],
              };

              return {
                ...oldData,
                pages: newData,
              };
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the updated message with sender info
          const { data: updatedMessage } = await supabase
            .from("messages")
            .select(
              `
              id,
              conversation_id,
              sender_id,
              content,
              created_at,
              read_at,
              edited_at,
              deleted_at,
              reply_to_message_id,
              sender:sender_id (
                id,
                full_name,
                business_name
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          // If message has a reply, fetch the replied-to message
          if (updatedMessage?.reply_to_message_id) {
            const { data: repliedTo } = await supabase
              .from("messages")
              .select(
                `
                id,
                content,
                sender:sender_id (
                  id,
                  full_name,
                  business_name
                )
              `
              )
              .eq("id", updatedMessage.reply_to_message_id)
              .single();

            if (repliedTo) {
              (updatedMessage as any).replied_to_message = repliedTo;
            }
          }

          if (updatedMessage) {
            queryClient.setQueryData([queryKey, conversationId], (oldData: any) => {
              if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                return oldData;
              }

              const newData = oldData.pages.map((page: any) => {
                return {
                  ...page,
                  items: (page.items || []).map((item: Message) => {
                    if (item.id === updatedMessage.id) {
                      return updatedMessage;
                    }
                    return item;
                  }),
                };
              });

              return {
                ...oldData,
                pages: newData,
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey, conversationId]);
};

