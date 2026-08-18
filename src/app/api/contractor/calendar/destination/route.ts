import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Get or update the destination calendar for new bookings
 * 
 * GET /api/contractor/calendar/destination - Get current destination calendar
 * PATCH /api/contractor/calendar/destination - Update destination calendar
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("google_calendar_destination_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      destinationCalendarId: profile?.google_calendar_destination_id || "primary",
    });
  } catch (error: any) {
    console.error("Error fetching destination calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { calendarId } = body;

    if (!calendarId || typeof calendarId !== "string") {
      return NextResponse.json(
        { error: "calendarId is required" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_calendar_destination_id: calendarId,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating destination calendar:", updateError);
      return NextResponse.json(
        { error: "Failed to update destination calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      destinationCalendarId: calendarId,
    });
  } catch (error: any) {
    console.error("Error updating destination calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

