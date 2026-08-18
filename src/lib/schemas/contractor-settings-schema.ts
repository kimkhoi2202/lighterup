import { z } from "zod";

/**
 * Validation schema for contractor scheduling settings
 * Used in the Limits & Buffers tab
 */
export const contractorSettingsSchema = z.object({
  buffer_before_minutes: z.coerce.number().min(0).max(180),
  buffer_after_minutes: z.coerce.number().min(0).max(180),
  minimum_notice_hours: z.coerce.number().min(0),
  slot_interval_minutes: z.coerce.number(),
  future_booking_days: z.coerce.number().min(7).max(365),
});

export type ContractorSettings = z.infer<typeof contractorSettingsSchema>;

