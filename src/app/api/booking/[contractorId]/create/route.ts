import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent, getValidAccessToken } from "@/lib/google-calendar";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Booking Creation API
 * 
 * Creates a new booking/job for a contractor. This endpoint:
 * 1. Validates the selected timeslot is still available
 * 2. Creates a job record with booking details
 * 3. Creates a Google Calendar event for the contractor (if connected)
 * 4. Returns calendar links for the guest
 */

interface BookingRequest {
  // Timeslot (ISO string)
  timeslot: string;
  // Booker info
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  // Location
  locationType: "phone" | "physical";
  address?: string; // For physical location
  // Timezone
  timezone: string;
  // Optional: link to existing job (from homeowner job creation flow)
  jobId?: string;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ contractorId: string }> }
) {
  try {
    const { contractorId } = await context.params;
    const body: BookingRequest = await req.json();

    // Validate required fields
    if (!body.timeslot || !body.fullName || !body.email || !body.locationType || !body.timezone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Supabase admin client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get contractor profile with event type settings
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        business_name,
        default_schedule_id,
        event_type_title,
        event_type_description,
        event_type_duration_minutes,
        event_type_price_cents,
        event_type_currency,
        google_calendar_access_token,
        google_calendar_id
      `)
      .eq("id", contractorId)
      .eq("role", "contractor")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Parse the timeslot
    const startTime = dayjs(body.timeslot).tz(body.timezone);
    const endTime = startTime.add(profile.event_type_duration_minutes || 60, "minute");

    // Validate timeslot is in the future
    if (startTime.isBefore(dayjs())) {
      return NextResponse.json(
        { error: "Cannot book a time in the past" },
        { status: 400 }
      );
    }

    // Check if slot is still available (no conflicting bookings)
    const scheduledDate = startTime.format("YYYY-MM-DD");
    const startTimeStr = startTime.format("HH:mm");
    const endTimeStr = endTime.format("HH:mm");

    const { data: existingBookings, error: bookingsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("contractor_id", contractorId)
      .eq("scheduled_date", scheduledDate)
      .not("status", "eq", "cancelled")
      .or(`and(start_time.lt.${endTimeStr},end_time.gt.${startTimeStr})`);

    if (bookingsError) {
      console.error("Error checking existing bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    // Determine location details
    let meetingLocationDetails = "";
    if (body.locationType === "physical" && body.address) {
      meetingLocationDetails = body.address;
    } else if (body.locationType === "phone" && body.phone) {
      meetingLocationDetails = body.phone;
    }

    // Get region (use default Austin for now)
    const { data: region } = await supabase
      .from("regions")
      .select("id")
      .eq("name", "Austin")
      .single();

    let booking;

    // If jobId is provided, update the existing job with scheduling info
    // This is the homeowner flow where they created a job first
    if (body.jobId) {
      // Verify the job exists and is in a state that can be booked
      const { data: existingJob, error: jobFetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", body.jobId)
        .in("status", ["pending", "assigned"])
        .single();

      if (jobFetchError || !existingJob) {
        return NextResponse.json(
          { error: "Job not found or cannot be booked" },
          { status: 404 }
        );
      }

      // Update the existing job with contractor and scheduling info
      const { data: updatedJob, error: updateError } = await supabase
        .from("jobs")
        .update({
          contractor_id: contractorId,
          scheduled_date: scheduledDate,
          start_time: startTimeStr,
          end_time: endTimeStr,
          booker_name: body.fullName,
          booker_email: body.email,
          booker_phone: body.phone || null,
          booker_notes: body.notes || null,
          meeting_location_type: body.locationType,
          meeting_location_details: meetingLocationDetails,
          status: "assigned",
          // Update pricing with contractor's rates
          base_price_cents: profile.event_type_price_cents || existingJob.base_price_cents || 0,
          total_price_cents: profile.event_type_price_cents || existingJob.total_price_cents || 0,
          contractor_payout_cents: profile.event_type_price_cents || existingJob.contractor_payout_cents || 0,
        })
        .eq("id", body.jobId)
        .select()
        .single();

      if (updateError || !updatedJob) {
        console.error("Error updating job with booking:", updateError);
        return NextResponse.json(
          { error: "Failed to update job with booking" },
          { status: 500 }
        );
      }

      booking = updatedJob;
    } else {
      // No jobId - create a new booking job (direct booking flow)
      const { data: newBooking, error: createError } = await supabase
        .from("jobs")
        .insert({
          contractor_id: contractorId,
          region_id: region?.id || null,
          // Booking details
          scheduled_date: scheduledDate,
          start_time: startTimeStr,
          end_time: endTimeStr,
          // Booker info
          booker_name: body.fullName,
          booker_email: body.email,
          booker_phone: body.phone || null,
          booker_notes: body.notes || null,
          // Location
          meeting_location_type: body.locationType,
          meeting_location_details: meetingLocationDetails,
          // Address fields (use defaults for phone bookings)
          address: body.locationType === "physical" ? body.address || "" : "N/A - Phone Booking",
          city: "Austin", // Default city
          state: "TX", // Default state  
          zip: "00000", // Placeholder for non-physical bookings
          // Job defaults (for booking-type jobs)
          description: `Booking: ${profile.event_type_title || "Consultation"}`,
          status: "assigned",
          base_price_cents: profile.event_type_price_cents || 0,
          complexity_addon_cents: 0,
          options_addon_cents: 0,
          total_price_cents: profile.event_type_price_cents || 0,
          contractor_payout_cents: profile.event_type_price_cents || 0,
          estimated_length_feet: 0,
          complexity: "simple",
        })
        .select()
        .single();

      if (createError || !newBooking) {
        console.error("Error creating booking:", createError);
        return NextResponse.json(
          { error: "Failed to create booking" },
          { status: 500 }
        );
      }

      booking = newBooking;
    }

    // Try to create Google Calendar event for contractor
    let googleCalendarEventId: string | null = null;
    if (profile.google_calendar_access_token) {
      try {
        const eventTitle = `${profile.event_type_title || "Consultation"} with ${body.fullName}`;
        const eventDescription = [
          `Booking with ${body.fullName}`,
          `Email: ${body.email}`,
          body.phone ? `Phone: ${body.phone}` : null,
          body.notes ? `Notes: ${body.notes}` : null,
          `Location: ${body.locationType === "phone" ? "Phone Call" : body.address || "Physical Location"}`,
        ]
          .filter(Boolean)
          .join("\n");

        const calendarEvent = await createCalendarEvent(contractorId, supabase, {
          summary: eventTitle,
          description: eventDescription,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: body.timezone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: body.timezone,
          },
          location: body.locationType === "physical" ? body.address : undefined,
        });

        googleCalendarEventId = calendarEvent.id;

        // Update job with Google Calendar event ID
        await supabase
          .from("jobs")
          .update({ google_calendar_event_id: googleCalendarEventId })
          .eq("id", booking.id);
      } catch (calendarError) {
        // Log but don't fail the booking if calendar sync fails
        console.error("Failed to create Google Calendar event:", calendarError);
      }
    }

    // Generate calendar links for the guest
    const eventTitle = `${profile.event_type_title || "Consultation"} with ${profile.business_name || profile.full_name}`;
    const eventDescription = `Booked appointment with ${profile.business_name || profile.full_name}`;
    const eventLocation = body.locationType === "physical" ? body.address || "" : "Phone Call";

    // Format dates for Google Calendar in local time (YYYYMMDDTHHMMSS without Z)
    // This ensures Google Calendar displays the correct date/time in the user's timezone
    const googleCalendarUrl = generateGoogleCalendarUrl({
      title: eventTitle,
      description: eventDescription,
      location: eventLocation,
      startTime: startTime.format("YYYYMMDDTHHmmss"),
      endTime: endTime.format("YYYYMMDDTHHmmss"),
    });

    const icsContent = generateIcsFile({
      title: eventTitle,
      description: eventDescription,
      location: eventLocation,
      startTime: startTime.toDate(),
      endTime: endTime.toDate(),
      organizerEmail: body.email,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledDate: scheduledDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: profile.event_type_duration_minutes || 60,
        eventTitle: profile.event_type_title || "Consultation",
        contractorName: profile.business_name || profile.full_name,
        locationType: body.locationType,
        locationDetails: meetingLocationDetails,
      },
      calendarLinks: {
        googleCalendarUrl,
        icsContent,
      },
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate Google Calendar URL for adding event
 */
function generateGoogleCalendarUrl({
  title,
  description,
  location,
  startTime,
  endTime,
}: {
  title: string;
  description: string;
  location: string;
  startTime: string; // Format: YYYYMMDDTHHMMSS (local time, no Z)
  endTime: string;   // Format: YYYYMMDDTHHMMSS (local time, no Z)
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location: location,
    dates: `${startTime}/${endTime}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate ICS file content for calendar download
 */
function generateIcsFile({
  title,
  description,
  location,
  startTime,
  endTime,
  organizerEmail,
}: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  organizerEmail: string;
}): string {
  // Format date for ICS (YYYYMMDDTHHMMSSZ)
  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  // Escape special characters in ICS
  const escapeIcs = (text: string) => {
    return text.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
  };

  const uid = `booking-${Date.now()}@festly.app`;
  const dtstamp = formatIcsDate(new Date());
  const dtstart = formatIcsDate(startTime);
  const dtend = formatIcsDate(endTime);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Festly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    `ORGANIZER:mailto:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

