import { baseApi } from "./base-api";

export interface AvailabilitySchedule {
  id: string;
  contractor_id: string;
  name: string;
  is_default: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityWindow {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlackout {
  id: string;
  schedule_id: string;
  blackout_date: string;
  is_all_day: boolean;
  reason: string | null;
  created_at: string;
}

export interface CreateScheduleRequest {
  name: string;
  timezone: string;
  is_default?: boolean;
}

export interface UpdateScheduleRequest {
  name?: string;
  timezone?: string;
  is_default?: boolean;
}

export interface CreateWindowRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface UpdateWindowRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface CreateBlackoutRequest {
  blackout_date: string;
  is_all_day?: boolean;
  reason?: string;
}

export interface UpdateBlackoutRequest {
  blackout_date: string;
  is_all_day?: boolean;
  reason?: string;
}

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Schedules
    getSchedules: builder.query<AvailabilitySchedule[], void>({
      query: () => "/availability/schedules",
      providesTags: ["Schedule"],
      keepUnusedDataFor: 300, // Availability rarely changes
      transformResponse: (response: { schedules: AvailabilitySchedule[] }) => response.schedules || [],
    }),

    getSchedule: builder.query<{ schedule: AvailabilitySchedule; windows: AvailabilityWindow[]; blackouts: AvailabilityBlackout[] }, string>({
      query: (scheduleId) => `/availability/schedules/${scheduleId}`,
      providesTags: (result, error, scheduleId) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
      keepUnusedDataFor: 300,
      transformResponse: (response: { schedule: AvailabilitySchedule; windows: AvailabilityWindow[]; blackouts: AvailabilityBlackout[] }) => response,
    }),

    createSchedule: builder.mutation<{ schedule: AvailabilitySchedule }, CreateScheduleRequest>({
      query: (data) => ({
        url: "/availability/schedules",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Schedule"],
    }),

    updateSchedule: builder.mutation<{ schedule: AvailabilitySchedule }, { id: string; data: UpdateScheduleRequest }>({
      query: ({ id, data }) => ({
        url: `/availability/schedules/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Schedule", id },
        "Schedule",
      ],
    }),

    deleteSchedule: builder.mutation<void, string>({
      query: (scheduleId) => ({
        url: `/availability/schedules/${scheduleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Schedule"],
    }),

    // Windows
    getWindows: builder.query<AvailabilityWindow[], string>({
      query: (scheduleId) => `/availability/schedules/${scheduleId}/windows`,
      providesTags: (result, error, scheduleId) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
      keepUnusedDataFor: 300,
    }),

    createWindow: builder.mutation<{ window: AvailabilityWindow }, { scheduleId: string; data: CreateWindowRequest }>({
      query: ({ scheduleId, data }) => ({
        url: `/availability/schedules/${scheduleId}/windows`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),

    updateWindow: builder.mutation<{ window: AvailabilityWindow }, { scheduleId: string; windowId: string; data: UpdateWindowRequest }>({
      query: ({ scheduleId, windowId, data }) => ({
        url: `/availability/schedules/${scheduleId}/windows/${windowId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),

    deleteWindow: builder.mutation<void, { scheduleId: string; windowId: string }>({
      query: ({ scheduleId, windowId }) => ({
        url: `/availability/schedules/${scheduleId}/windows/${windowId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),

    // Blackouts
    getBlackouts: builder.query<AvailabilityBlackout[], string>({
      query: (scheduleId) => `/availability/schedules/${scheduleId}/blackouts`,
      providesTags: (result, error, scheduleId) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
      keepUnusedDataFor: 300,
    }),

    createBlackout: builder.mutation<{ blackout: AvailabilityBlackout }, { scheduleId: string; data: CreateBlackoutRequest }>({
      query: ({ scheduleId, data }) => ({
        url: `/availability/schedules/${scheduleId}/blackouts`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),

    updateBlackout: builder.mutation<{ blackout: AvailabilityBlackout }, { scheduleId: string; blackoutId: string; data: UpdateBlackoutRequest }>({
      query: ({ scheduleId, blackoutId, data }) => ({
        url: `/availability/schedules/${scheduleId}/blackouts/${blackoutId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),

    deleteBlackout: builder.mutation<void, { scheduleId: string; blackoutId: string }>({
      query: ({ scheduleId, blackoutId }) => ({
        url: `/availability/schedules/${scheduleId}/blackouts/${blackoutId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { scheduleId }) => [
        { type: "Schedule", id: scheduleId },
        "Schedule",
      ],
    }),
  }),
});

export const {
  useGetSchedulesQuery,
  useGetScheduleQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  useGetWindowsQuery,
  useCreateWindowMutation,
  useUpdateWindowMutation,
  useDeleteWindowMutation,
  useGetBlackoutsQuery,
  useCreateBlackoutMutation,
  useUpdateBlackoutMutation,
  useDeleteBlackoutMutation,
} = availabilityApi;

