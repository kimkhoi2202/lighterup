import { baseApi } from "./base-api";

export interface Job {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  total_price_cents: number;
  contractor_payout_cents: number;
  complexity: "simple" | "medium" | "complex";
  lights_provided: boolean;
  storage_needed: boolean;
  estimated_length_feet: number;
  description: string;
  status: string;
  homeowner_id: string;
  contractor_id: string | null;
  created_at: string;
  requested_date_start: string | null;
  requested_date_end?: string | null;
  cover_image_url?: string | null;
  distance_miles?: number;
}

export interface CreateJobRequest {
  regionId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  description: string;
  numStories: number;
  houseSize: string;
  estimatedLengthFeet: number;
  complexity: "simple" | "medium" | "complex";
  lightsProvided: boolean;
  storageNeeded: boolean;
  tipAmountCents?: number;
  requestedDateStart?: string;
  requestedDateEnd?: string;
}

export interface UpdateJobRequest {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  numStories?: number;
  houseSize?: string;
  estimatedLengthFeet?: number;
  complexity?: "simple" | "medium" | "complex";
  lightsProvided?: boolean;
  storageNeeded?: boolean;
  tipAmountCents?: number;
  requestedDateStart?: string;
}

export interface AcceptJobResponse {
  message: string;
  job: Job;
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get available jobs (for contractors)
    getAvailableJobs: builder.query<Job[], void>({
      query: () => "/jobs/feed",
      providesTags: ["Job"],
      keepUnusedDataFor: 60,
    }),

    // Get my jobs (for contractor or homeowner)
    getMyJobs: builder.query<Job[], void>({
      query: () => "/jobs/my-jobs",
      providesTags: ["Job"],
      keepUnusedDataFor: 120, // Jobs change less frequently
      transformResponse: (response: { jobs: Job[] }) => response.jobs || [],
    }),

    // Accept a job (contractor only)
    acceptJob: builder.mutation<AcceptJobResponse, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Job"], // Invalidate all job queries
    }),

    // Create a job (homeowner only)
    createJob: builder.mutation<{ job: Job }, CreateJobRequest>({
      query: (jobData) => ({
        url: "/jobs/create",
        method: "POST",
        body: jobData,
      }),
      invalidatesTags: ["Job"], // Invalidate all job queries
    }),

    // Update a job (homeowner only, unassigned jobs)
    updateJob: builder.mutation<{ job: Job }, { jobId: string; data: UpdateJobRequest }>({
      query: ({ jobId, data }) => ({
        url: `/jobs/${jobId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Job"], // Invalidate all job queries
    }),
  }),
});

export const {
  useGetAvailableJobsQuery,
  useGetMyJobsQuery,
  useAcceptJobMutation,
  useCreateJobMutation,
  useUpdateJobMutation,
} = jobsApi;

