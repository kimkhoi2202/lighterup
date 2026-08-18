import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
  paramKey: "conversationId";
  paramValue: string;
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
  sender: {
    id: string;
    full_name: string;
    business_name: string | null;
  };
}

interface MessagesResponse {
  items: Message[];
  nextCursor: string | null;
}

export const useChatQuery = ({
  queryKey,
  apiUrl,
  paramKey,
  paramValue,
}: ChatQueryProps) => {
  const fetchMessages = async ({ pageParam }: { pageParam: string | undefined }): Promise<MessagesResponse> => {
    if (!paramValue) {
      return { items: [], nextCursor: null };
    }

    const url = qs.stringifyUrl(
      {
        url: apiUrl,
        query: {
          cursor: pageParam || undefined,
          [paramKey]: paramValue,
        },
      },
      { skipNull: true }
    );

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }
    return res.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [queryKey, paramValue],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    initialPageParam: undefined,
    enabled: !!paramValue, // Only fetch if conversationId is provided
    refetchInterval: false, // We use Supabase Realtime instead
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};

