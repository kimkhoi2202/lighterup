import { baseApi } from "./base-api";

export interface Conversation {
  id: string;
  job_id: string | null;
  homeowner_id: string;
  contractor_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  homeowner?: {
    id: string;
    full_name: string;
  } | null;
  contractor?: {
    id: string;
    full_name: string;
    business_name: string | null;
  } | null;
  jobs?: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    status: string;
  } | null;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  unread_count?: number;
}

export const conversationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<{ conversations: Conversation[] }, void>({
      query: () => "/conversations",
      providesTags: ["Conversation"],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetConversationsQuery } = conversationsApi;

