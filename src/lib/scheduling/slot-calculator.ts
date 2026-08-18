import { supabaseAdmin } from "@/lib/supabase-admin";
import { addMinutes, format, startOfDay, parseISO, isAfter, isBefore, isWithinInterval } from "date-fns";

export interface SlotCalculationInput {
  contractorId: string;
  date: Date;
  duration: number; // job duration in minutes
  scheduleId?: string; // optional specific schedule
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictReason?: string;
}

export interface ContractorSettings {
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  minimum_notice_hours: number;
  slot_interval_minutes: number;
  future_booking_days: number;
}

export interface AvailabilityWindow {
  id: string;
  day_of_week: number;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean | null;
}

export interface Blackout {
  id: string;
  blackout_date: string;
  is_all_day: boolean;
}

export interface Booking {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

/**
 * Main function to calculate available time slots for a contractor on a specific date
 */
export async function calculateAvailableSlots(
  input: SlotCalculationInput
): Promise<TimeSlot[]> {
  const supabase = supabaseAdmin;

  // 1. Get contractor settings
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "buffer_before_minutes, buffer_after_minutes, minimum_notice_hours, slot_interval_minutes, future_booking_days, default_schedule_id"
    )
    .eq("id", input.contractorId)
    .single();

  if (!profile) {
    throw new Error("Contractor not found");
  }

  const settings: ContractorSettings = {
    buffer_before_minutes: profile.buffer_before_minutes || 30,
    buffer_after_minutes: profile.buffer_after_minutes || 30,
    minimum_notice_hours: profile.minimum_notice_hours || 48,
    slot_interval_minutes: profile.slot_interval_minutes || 60,
    future_booking_days: profile.future_booking_days || 60,
  };

  // 2. Check if date is within future booking window
  const today = startOfDay(new Date());
  const requestedDate = startOfDay(input.date);
  const daysDiff = Math.floor(
    (requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > settings.future_booking_days) {
    return []; // Date is too far in the future
  }

  // 3. Check minimum notice
  const now = new Date();
  const minNoticeDate = addMinutes(now, settings.minimum_notice_hours * 60);
  if (isBefore(input.date, minNoticeDate)) {
    return []; // Date is within minimum notice period
  }

  // 4. Get contractor's availability windows for this day
  const dayOfWeek = input.date.getDay();
  const scheduleId = input.scheduleId || profile.default_schedule_id;

  if (!scheduleId) {
    return []; // No schedule set
  }

  const { data: windows } = await supabase
    .from("availability_windows")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (!windows || windows.length === 0) {
    return []; // No availability for this day
  }

  // 5. Check for blackout dates
  const dateString = format(input.date, "yyyy-MM-dd");
  const { data: blackouts } = await supabase
    .from("availability_blackouts")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("blackout_date", dateString);

  if (blackouts && blackouts.length > 0 && blackouts[0].is_all_day) {
    return []; // This date is completely blocked out
  }

  // 6. Get existing bookings for this contractor on this date
  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("id, scheduled_date, duration_minutes, status")
    .eq("contractor_id", input.contractorId)
    .eq("scheduled_date", dateString)
    .in("status", ["assigned", "in_progress"]);

  // 7. Generate all possible slots from availability windows
  const allPossibleSlots = generateSlotsFromWindows(
    windows,
    input.date,
    settings.slot_interval_minutes,
    input.duration
  );

  // 8. Filter out slots that conflict with existing bookings (including buffers)
  const availableSlots = filterConflictingSlots(
    allPossibleSlots,
    existingJobs || [],
    settings.buffer_before_minutes,
    settings.buffer_after_minutes,
    settings.minimum_notice_hours
  );

  return availableSlots;
}

/**
 * Generate time slots from availability windows
 */
function generateSlotsFromWindows(
  windows: AvailabilityWindow[],
  date: Date,
  intervalMinutes: number,
  jobDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const window of windows) {
    // Parse window times
    const [startHour, startMinute] = window.start_time.split(":").map(Number);
    const [endHour, endMinute] = window.end_time.split(":").map(Number);

    const windowStart = new Date(date);
    windowStart.setHours(startHour, startMinute, 0, 0);

    const windowEnd = new Date(date);
    windowEnd.setHours(endHour, endMinute, 0, 0);

    // Generate slots at interval
    let currentSlotStart = windowStart;

    while (currentSlotStart < windowEnd) {
      const slotEnd = addMinutes(currentSlotStart, jobDuration);

      // Only add slot if the entire job fits within the window
      if (slotEnd <= windowEnd) {
        slots.push({
          start: new Date(currentSlotStart),
          end: slotEnd,
          available: true,
        });
      }

      currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
    }
  }

  return slots;
}

/**
 * Filter out slots that conflict with existing bookings
 */
function filterConflictingSlots(
  slots: TimeSlot[],
  existingBookings: any[],
  bufferBefore: number,
  bufferAfter: number,
  minimumNoticeHours: number
): TimeSlot[] {
  const now = new Date();
  const minNoticeTime = addMinutes(now, minimumNoticeHours * 60);

  return slots.map((slot) => {
    // Check if slot is within minimum notice period
    if (isBefore(slot.start, minNoticeTime)) {
      return {
        ...slot,
        available: false,
        conflictReason: "Within minimum notice period",
      };
    }

    // Check for conflicts with existing bookings
    for (const booking of existingBookings) {
      // Parse booking times (assuming ISO format or similar)
      const bookingStart = parseISO(
        `${booking.scheduled_date}T${booking.start_time || "00:00:00"}`
      );
      const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || 240);

      // Add buffers to booking
      const bookingWithBuffer = {
        start: addMinutes(bookingStart, -bufferBefore),
        end: addMinutes(bookingEnd, bufferAfter),
      };

      // Check if slot conflicts with booking + buffers
      const slotConflicts =
        isWithinInterval(slot.start, bookingWithBuffer) ||
        isWithinInterval(slot.end, bookingWithBuffer) ||
        (isBefore(slot.start, bookingWithBuffer.start) &&
          isAfter(slot.end, bookingWithBuffer.end));

      if (slotConflicts) {
        return {
          ...slot,
          available: false,
          conflictReason: "Conflicts with existing booking",
        };
      }
    }

    // No conflicts found
    return slot;
  });
}

/**
 * Helper function to check contractor availability for a specific date
 * Returns a simple boolean
 */
export async function checkContractorAvailability(
  contractorId: string,
  date: Date,
  scheduleId?: string
): Promise<boolean> {
  try {
    const slots = await calculateAvailableSlots({
      contractorId,
      date,
      duration: 240, // Default 4 hours for light installation
      scheduleId,
    });

    return slots.some((slot) => slot.available);
  } catch (error) {
    console.error("Error checking availability:", error);
    return false;
  }
}

/**
 * Get availability for a contractor across multiple dates
 */
export async function getContractorAvailabilityForRange(
  contractorId: string,
  startDate: Date,
  endDate: Date,
  duration: number = 240
): Promise<Map<string, TimeSlot[]>> {
  const availabilityMap = new Map<string, TimeSlot[]>();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const slots = await calculateAvailableSlots({
      contractorId,
      date: new Date(currentDate),
      duration,
    });

    availabilityMap.set(dateKey, slots);

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availabilityMap;
}

