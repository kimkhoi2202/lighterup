import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Get all bookings for the authenticated contractor
 * GET /api/contractor/bookings
 * 
 * Query params:
 * - status: filter by status (upcoming, past, cancelled)
 * - limit: number of results (default 50)
 * - offset: pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("jobs")
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        status,
        booker_name,
        booker_email,
        booker_phone,
        booker_notes,
        meeting_location_type,
        meeting_location_details,
        address,
        city,
        state,
        total_price_cents,
        google_calendar_event_id,
        created_at
      `)
      .eq("contractor_id", user.id)
      .not("booker_email", "is", null) // Only bookings (not regular jobs)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    // Filter by status
    const today = new Date().toISOString().split("T")[0];
    
    if (status === "upcoming") {
      query = query.gte("scheduled_date", today).neq("status", "cancelled");
    } else if (status === "past") {
      query = query.lt("scheduled_date", today);
    } else if (status === "cancelled") {
      query = query.eq("status", "cancelled");
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: bookings, error: bookingsError, count } = await query;

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Get total counts for tabs
    const { count: upcomingCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id)
      .not("booker_email", "is", null)
      .gte("scheduled_date", today)
      .neq("status", "cancelled");

    const { count: pastCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id)
      .not("booker_email", "is", null)
      .lt("scheduled_date", today);

    const { count: cancelledCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id)
      .not("booker_email", "is", null)
      .eq("status", "cancelled");

    return NextResponse.json({
      bookings: bookings || [],
      counts: {
        upcoming: upcomingCount || 0,
        past: pastCount || 0,
        cancelled: cancelledCount || 0,
        total: (upcomingCount || 0) + (pastCount || 0) + (cancelledCount || 0),
      },
      pagination: {
        limit,
        offset,
        hasMore: (bookings?.length || 0) === limit,
      },
    });
  } catch (error: any) {
    console.error("Error in bookings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

