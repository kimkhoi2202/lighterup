import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getValidAccessToken } from "@/lib/google-calendar";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

interface WorkingHoursRange {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

interface BusyTime {
  start: string;
  end: string;
}

interface TimeSlot {
  time: string; // ISO string
}

interface BatchSlotsResponse {
  slots: Record<string, TimeSlot[]>;
  timezone: string;
}

interface SingleDateSlotsResponse {
  date: string;
  timezone: string;
  slots: TimeSlot[];
}

/**
 * GET /api/booking/[contractorId]/slots
 * 
 * Supports two modes:
 * 
 * 1. Single Date Mode (backward compatible):
 *    ?date=YYYY-MM-DD&timezone=America/New_York
 *    Returns: { date, timezone, slots: TimeSlot[] }
 * 
 * 2. Batch Date Range Mode (optimized):
 *    ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&timezone=America/New_York
 *    Returns: { slots: { "YYYY-MM-DD": TimeSlot[], ... }, timezone }
 * 
 * Calculates available time slots based on:
 * - Working hours from the contractor's default schedule
 * - Date overrides (blackout dates)
 * - Buffer times (before/after meetings)
 * - Minimum booking notice
 * - Google Calendar conflicts (if connected)
 * - Slot interval settings
 * 
 * This endpoint is public and doesn't require authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const { contractorId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const timezoneParam = searchParams.get("timezone") || "America/New_York";
    
    // Check for batch mode (startDate + endDate) vs single date mode
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const singleDateParam = searchParams.get("date");

    const isBatchMode = startDateParam && endDateParam;

    if (!isBatchMode && !singleDateParam) {
      return NextResponse.json(
        { error: "Either 'date' or both 'startDate' and 'endDate' parameters are required" },
        { status: 400 }
      );
    }

    // Fetch contractor profile with schedule settings (done once for all dates)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        default_schedule_id,
        minimum_notice_hours,
        buffer_before_minutes,
        buffer_after_minutes,
        slot_interval_minutes,
        future_booking_days,
        event_type_duration_minutes,
        google_calendar_access_token,
        google_calendar_refresh_token,
        google_calendar_token_expires_at,
        google_calendar_selected_ids,
        role,
        is_active
      `)
      .eq("id", contractorId)
      .eq("role", "contractor")
      .eq("is_active", true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Contractor not found or inactive" },
        { status: 404 }
      );
    }

    if (!profile.default_schedule_id) {
      if (isBatchMode) {
        return NextResponse.json({ slots: {}, timezone: timezoneParam }, { status: 200 });
      }
      return NextResponse.json({ date: singleDateParam, timezone: timezoneParam, slots: [] }, { status: 200 });
    }

    // Fetch the default schedule
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from("availability_schedules")
      .select("id, timezone")
      .eq("id", profile.default_schedule_id)
      .single();

    if (scheduleError || !schedule) {
      if (isBatchMode) {
        return NextResponse.json({ slots: {}, timezone: timezoneParam }, { status: 200 });
      }
      return NextResponse.json({ date: singleDateParam, timezone: timezoneParam, slots: [] }, { status: 200 });
    }

    const scheduleTimezone = schedule.timezone;

    // Get settings with defaults
    const minimumNoticeHours = profile.minimum_notice_hours || 24;
    const bufferBeforeMinutes = profile.buffer_before_minutes || 0;
    const bufferAfterMinutes = profile.buffer_after_minutes || 0;
    const slotIntervalMinutes = profile.slot_interval_minutes || 30;
    const eventDurationMinutes = profile.event_type_duration_minutes || 60;
    const futureBookingDays = profile.future_booking_days || 60;

    // Calculate minimum start time (now + minimum notice)
    const minimumStartTime = dayjs().add(minimumNoticeHours, "hour");
    const maxFutureDate = dayjs().add(futureBookingDays, "day");

    // Log profile settings for debugging
    console.log("[Slots API] Profile Settings:", {
      contractorId,
      scheduleId: profile.default_schedule_id,
      scheduleTimezone,
      minimumNoticeHours,
      bufferBeforeMinutes,
      bufferAfterMinutes,
      slotIntervalMinutes,
      eventDurationMinutes,
      futureBookingDays,
      now: dayjs().format("YYYY-MM-DD HH:mm:ss Z"),
      minimumStartTime: minimumStartTime.format("YYYY-MM-DD HH:mm:ss Z"),
      maxFutureDate: maxFutureDate.format("YYYY-MM-DD"),
      hasGoogleCalendar: !!(profile.google_calendar_access_token && Array.isArray(profile.google_calendar_selected_ids) && profile.google_calendar_selected_ids.length > 0),
      selectedCalendarsCount: Array.isArray(profile.google_calendar_selected_ids) ? profile.google_calendar_selected_ids.length : 0,
    });

    if (isBatchMode) {
      // BATCH MODE: Process date range
      return handleBatchMode({
        startDateParam: startDateParam!,
        endDateParam: endDateParam!,
        timezoneParam,
        scheduleTimezone,
        scheduleId: schedule.id,
        profile,
        contractorId,
        minimumStartTime,
        maxFutureDate,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        slotIntervalMinutes,
        eventDurationMinutes,
      });
    } else {
      // SINGLE DATE MODE: Process single date (backward compatible)
      return handleSingleDateMode({
        dateParam: singleDateParam!,
        timezoneParam,
        scheduleTimezone,
        scheduleId: schedule.id,
        profile,
        contractorId,
        minimumStartTime,
        maxFutureDate,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        slotIntervalMinutes,
        eventDurationMinutes,
      });
    }
  } catch (error) {
    console.error("Error calculating slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle batch date range mode - fetches all data once and processes all dates in-memory
 */
async function handleBatchMode({
  startDateParam,
  endDateParam,
  timezoneParam,
  scheduleTimezone,
  scheduleId,
  profile,
  contractorId,
  minimumStartTime,
  maxFutureDate,
  bufferBeforeMinutes,
  bufferAfterMinutes,
  slotIntervalMinutes,
  eventDurationMinutes,
}: {
  startDateParam: string;
  endDateParam: string;
  timezoneParam: string;
  scheduleTimezone: string;
  scheduleId: string;
  profile: any;
  contractorId: string;
  minimumStartTime: dayjs.Dayjs;
  maxFutureDate: dayjs.Dayjs;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes: number;
  eventDurationMinutes: number;
}): Promise<NextResponse<BatchSlotsResponse>> {
  const startDate = dayjs.tz(startDateParam, timezoneParam);
  const endDate = dayjs.tz(endDateParam, timezoneParam);

  if (!startDate.isValid() || !endDate.isValid()) {
    return NextResponse.json(
      { error: "Invalid date format" } as any,
      { status: 400 }
    );
  }

  // Limit the date range to prevent abuse (max 93 days to cover 3 full months)
  const daysDiff = endDate.diff(startDate, "day");
  if (daysDiff > 93) {
    return NextResponse.json(
      { error: "Date range cannot exceed 93 days" } as any,
      { status: 400 }
    );
  }

  // Fetch ALL availability windows for this schedule (all days of week)
  const { data: allWindows, error: windowsError } = await supabaseAdmin
    .from("availability_windows")
    .select("day_of_week, start_time, end_time, is_active")
    .eq("schedule_id", scheduleId)
    .eq("is_active", true);

  if (windowsError) {
    console.error("Error fetching windows:", windowsError);
    return NextResponse.json({ slots: {}, timezone: timezoneParam });
  }

  // Group windows by day of week for quick lookup
  const windowsByDay: Record<number, Array<{ start_time: string; end_time: string }>> = {};
  for (const window of allWindows || []) {
    if (!windowsByDay[window.day_of_week]) {
      windowsByDay[window.day_of_week] = [];
    }
    windowsByDay[window.day_of_week].push({
      start_time: window.start_time,
      end_time: window.end_time,
    });
  }

  // Fetch all blackout dates in the range
  const { data: blackouts } = await supabaseAdmin
    .from("availability_blackouts")
    .select("blackout_date")
    .eq("schedule_id", scheduleId)
    .gte("blackout_date", startDateParam)
    .lte("blackout_date", endDateParam);

  const blackoutSet = new Set((blackouts || []).map((b) => b.blackout_date));

  // Fetch Google Calendar busy times for the date range
  // Note: Google freeBusy API has a ~60 day limit, so we chunk requests
  let busyTimes: BusyTime[] = [];
  const hasGoogleCalendar = profile.google_calendar_access_token &&
    profile.google_calendar_selected_ids &&
    Array.isArray(profile.google_calendar_selected_ids) &&
    profile.google_calendar_selected_ids.length > 0;

  if (hasGoogleCalendar) {
    try {
      const accessToken = await getValidAccessToken(contractorId, supabaseAdmin);
      
      if (!accessToken) {
        console.error("[Slots API] Failed to get valid access token for Google Calendar");
      } else {
        const calendarIds = profile.google_calendar_selected_ids as string[];
        
        // Google freeBusy API has a ~60 day limit, chunk the requests
        const MAX_DAYS_PER_REQUEST = 55; // Stay under the limit
        let chunkStart = startDate;
        
        while (chunkStart.isBefore(endDate) || chunkStart.isSame(endDate, "day")) {
          const chunkEnd = chunkStart.add(MAX_DAYS_PER_REQUEST, "day").isAfter(endDate)
            ? endDate
            : chunkStart.add(MAX_DAYS_PER_REQUEST, "day");
          
          const timeMin = chunkStart.startOf("day").utc().format();
          const timeMax = chunkEnd.endOf("day").utc().format();

          const response = await fetch(
            "https://www.googleapis.com/calendar/v3/freeBusy",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                timeMin,
                timeMax,
                items: calendarIds.map((id) => ({ id })),
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            for (const calendarId of calendarIds) {
              const calendar = data.calendars[calendarId];
              if (calendar && calendar.busy) {
                busyTimes.push(...calendar.busy);
              }
            }
          } else {
            const errorText = await response.text();
            console.error("[Slots API] freeBusy API error:", {
              status: response.status,
              error: errorText,
              timeMin,
              timeMax,
            });
          }
          
          // Move to next chunk
          chunkStart = chunkEnd.add(1, "day");
        }
        
        console.log("[Slots API] Total busy times found:", busyTimes.length);
      }
    } catch (error) {
      console.error("[Slots API] Error fetching Google Calendar busy times:", error);
      // Continue without busy times on error
    }
  }

  // Process each date in the range
  const slotsMap: Record<string, TimeSlot[]> = {};
  let currentDate = startDate;

  while (currentDate.isSameOrBefore(endDate, "day")) {
    const dateString = currentDate.format("YYYY-MM-DD");

    // Skip if date is in the past or too far in the future
    if (currentDate.isBefore(dayjs(), "day") || currentDate.isAfter(maxFutureDate)) {
      slotsMap[dateString] = [];
      currentDate = currentDate.add(1, "day");
      continue;
    }

    // Skip if blackout date
    if (blackoutSet.has(dateString)) {
      slotsMap[dateString] = [];
      currentDate = currentDate.add(1, "day");
      continue;
    }

    const dayOfWeek = currentDate.day();
    const windows = windowsByDay[dayOfWeek] || [];

    if (windows.length === 0) {
      slotsMap[dateString] = [];
      currentDate = currentDate.add(1, "day");
      continue;
    }

    // Generate slots for this date
    // Enable detailed logging for December 1, 2025 to debug
    const enableLogging = dateString === "2025-12-01";
    
    const slots = generateSlotsForDate({
      date: currentDate,
      windows,
      scheduleTimezone,
      minimumStartTime,
      busyTimes,
      bufferBeforeMinutes,
      bufferAfterMinutes,
      slotIntervalMinutes,
      eventDurationMinutes,
      enableLogging,
    });

    slotsMap[dateString] = slots;
    currentDate = currentDate.add(1, "day");
  }

  return NextResponse.json({
    slots: slotsMap,
    timezone: timezoneParam,
  });
}

/**
 * Handle single date mode - backward compatible with existing API
 */
async function handleSingleDateMode({
  dateParam,
  timezoneParam,
  scheduleTimezone,
  scheduleId,
  profile,
  contractorId,
  minimumStartTime,
  maxFutureDate,
  bufferBeforeMinutes,
  bufferAfterMinutes,
  slotIntervalMinutes,
  eventDurationMinutes,
}: {
  dateParam: string;
  timezoneParam: string;
  scheduleTimezone: string;
  scheduleId: string;
  profile: any;
  contractorId: string;
  minimumStartTime: dayjs.Dayjs;
  maxFutureDate: dayjs.Dayjs;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes: number;
  eventDurationMinutes: number;
}): Promise<NextResponse<SingleDateSlotsResponse>> {
  const requestedDate = dayjs.tz(dateParam, timezoneParam);

  if (!requestedDate.isValid()) {
    return NextResponse.json(
      { error: "Invalid date format" } as any,
      { status: 400 }
    );
  }

  // Check if date is too far in the future
  if (requestedDate.isAfter(maxFutureDate)) {
    return NextResponse.json({
      date: dateParam,
      timezone: timezoneParam,
      slots: [],
    });
  }

  const dayOfWeek = requestedDate.day();

  // Fetch working hours for this day of week
  const { data: windows, error: windowsError } = await supabaseAdmin
    .from("availability_windows")
    .select("start_time, end_time, is_active")
    .eq("schedule_id", scheduleId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (windowsError || !windows || windows.length === 0) {
    return NextResponse.json({
      date: dateParam,
      timezone: timezoneParam,
      slots: [],
    });
  }

  // Check for blackout dates
  const { data: blackouts } = await supabaseAdmin
    .from("availability_blackouts")
    .select("blackout_date")
    .eq("schedule_id", scheduleId)
    .eq("blackout_date", dateParam);

  if (blackouts && blackouts.length > 0) {
    return NextResponse.json({
      date: dateParam,
      timezone: timezoneParam,
      slots: [],
    });
  }

  // Fetch Google Calendar busy times if connected
  let busyTimes: BusyTime[] = [];
  if (
    profile.google_calendar_access_token &&
    profile.google_calendar_selected_ids &&
    Array.isArray(profile.google_calendar_selected_ids) &&
    profile.google_calendar_selected_ids.length > 0
  ) {
    try {
      const accessToken = await getValidAccessToken(contractorId, supabaseAdmin);
      const calendarIds = profile.google_calendar_selected_ids as string[];

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin: requestedDate.startOf("day").utc().format(),
            timeMax: requestedDate.endOf("day").utc().format(),
            items: calendarIds.map((id) => ({ id })),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        for (const calendarId of calendarIds) {
          const calendar = data.calendars[calendarId];
          if (calendar && calendar.busy) {
            busyTimes.push(...calendar.busy);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Google Calendar busy times:", error);
    }
  }

  // Generate slots for this date
  // Enable detailed logging for December 1, 2025 to debug
  const enableLogging = dateParam === "2025-12-01";
  
  const slots = generateSlotsForDate({
    date: requestedDate,
    windows: windows.map((w) => ({ start_time: w.start_time, end_time: w.end_time })),
    scheduleTimezone,
    minimumStartTime,
    busyTimes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    slotIntervalMinutes,
    eventDurationMinutes,
    enableLogging,
  });

  return NextResponse.json({
    date: dateParam,
    timezone: timezoneParam,
    slots,
  });
}

/**
 * Generate available time slots for a specific date
 */
function generateSlotsForDate({
  date,
  windows,
  scheduleTimezone,
  minimumStartTime,
  busyTimes,
  bufferBeforeMinutes,
  bufferAfterMinutes,
  slotIntervalMinutes,
  eventDurationMinutes,
  enableLogging = false,
}: {
  date: dayjs.Dayjs;
  windows: Array<{ start_time: string; end_time: string }>;
  scheduleTimezone: string;
  minimumStartTime: dayjs.Dayjs;
  busyTimes: BusyTime[];
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes: number;
  eventDurationMinutes: number;
  enableLogging?: boolean;
}): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateStr = date.format("YYYY-MM-DD");
  
  const log = (msg: string, data?: any) => {
    if (enableLogging) {
      if (data) {
        console.log(`[Slots ${dateStr}] ${msg}`, data);
      } else {
        console.log(`[Slots ${dateStr}] ${msg}`);
      }
    }
  };

  log("=== GENERATING SLOTS ===");
  log("Configuration:", {
    scheduleTimezone,
    minimumStartTime: minimumStartTime.format("YYYY-MM-DD HH:mm Z"),
    bufferBeforeMinutes,
    bufferAfterMinutes,
    slotIntervalMinutes,
    eventDurationMinutes,
  });
  log("Working windows:", windows);

  // Build working hour ranges for this date
  const dateRanges: WorkingHoursRange[] = windows.map((window) => {
    const [startHour, startMinute] = window.start_time.split(":").map(Number);
    const [endHour, endMinute] = window.end_time.split(":").map(Number);

    return {
      start: date
        .tz(scheduleTimezone)
        .hour(startHour)
        .minute(startMinute)
        .second(0)
        .millisecond(0),
      end: date
        .tz(scheduleTimezone)
        .hour(endHour)
        .minute(endMinute)
        .second(0)
        .millisecond(0),
    };
  });

  log("Parsed date ranges:", dateRanges.map(r => ({
    start: r.start.format("YYYY-MM-DD HH:mm Z"),
    end: r.end.format("YYYY-MM-DD HH:mm Z"),
  })));

  // Filter busy times relevant to this date
  const relevantBusyTimes = busyTimes.filter(busy => {
    const busyStart = dayjs(busy.start);
    const busyEnd = dayjs(busy.end);
    const dayStart = date.startOf("day");
    const dayEnd = date.endOf("day");
    return busyStart.isBefore(dayEnd) && busyEnd.isAfter(dayStart);
  });

  log(`Busy times for this date (${relevantBusyTimes.length}):`, relevantBusyTimes.map(b => ({
    start: dayjs(b.start).format("HH:mm Z"),
    end: dayjs(b.end).format("HH:mm Z"),
  })));

  for (const range of dateRanges) {
    let currentSlotStart = range.start;

    log(`Processing range: ${range.start.format("HH:mm")} - ${range.end.format("HH:mm")}`);

    // If the slot is before minimum notice time, adjust
    if (currentSlotStart.isBefore(minimumStartTime)) {
      log(`Slot ${currentSlotStart.format("HH:mm")} is before minimum notice ${minimumStartTime.format("HH:mm")}, adjusting...`);
      currentSlotStart = minimumStartTime;

      // Round up to next slot interval
      const minutesSinceRangeStart = currentSlotStart.diff(range.start, "minute");
      const remainder = minutesSinceRangeStart % slotIntervalMinutes;
      if (remainder > 0) {
        currentSlotStart = currentSlotStart.add(slotIntervalMinutes - remainder, "minute");
      }
      log(`Adjusted to: ${currentSlotStart.format("HH:mm")}`);
    }

    while (currentSlotStart.isBefore(range.end)) {
      const slotEnd = currentSlotStart.add(eventDurationMinutes, "minute");
      const slotTime = currentSlotStart.format("HH:mm");

      // Check if slot fits within the working hours
      if (slotEnd.isAfter(range.end)) {
        log(`Slot ${slotTime}: SKIPPED - slot end ${slotEnd.format("HH:mm")} is after working hours end ${range.end.format("HH:mm")}`);
        break;
      }

      // Check for conflicts with busy times (including buffers)
      const slotStartWithBuffer = currentSlotStart.subtract(bufferBeforeMinutes, "minute");
      const slotEndWithBuffer = slotEnd.add(bufferAfterMinutes, "minute");

      let hasConflict = false;
      let conflictReason = "";
      for (const busy of busyTimes) {
        const busyStart = dayjs(busy.start);
        const busyEnd = dayjs(busy.end);

        // Check if there's any overlap
        if (
          slotStartWithBuffer.isBefore(busyEnd) &&
          slotEndWithBuffer.isAfter(busyStart)
        ) {
          hasConflict = true;
          conflictReason = `Conflicts with busy time ${busyStart.format("HH:mm")}-${busyEnd.format("HH:mm")} (slot with buffers: ${slotStartWithBuffer.format("HH:mm")}-${slotEndWithBuffer.format("HH:mm")})`;
          break;
        }
      }

      if (hasConflict) {
        log(`Slot ${slotTime}: BLOCKED - ${conflictReason}`);
      } else {
        log(`Slot ${slotTime}: AVAILABLE`);
        slots.push({
          time: currentSlotStart.toISOString(),
        });
      }

      currentSlotStart = currentSlotStart.add(slotIntervalMinutes, "minute");
    }
  }

  log(`=== RESULT: ${slots.length} available slots ===`);
  return slots;
}
