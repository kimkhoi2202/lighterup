import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base query with automatic cookie handling for authentication
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include", // Automatically includes cookies
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Job", "Schedule", "Conversation", "Availability"],
  keepUnusedDataFor: 60, // Cache data for 60 seconds after last subscription
  refetchOnFocus: false, // We use Supabase Realtime for real-time updates
  refetchOnReconnect: true, // Refetch on network reconnect
  endpoints: () => ({}),
});

