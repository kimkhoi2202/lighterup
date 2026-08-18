import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Get Google Calendar connection status for the authenticated contractor
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
          set(name: string, value: string, options: any) {
            // Note: This won't actually set cookies in the response
            // For setting cookies, you'd need to use the response object
          },
          remove(name: string, options: any) {
            // Note: This won't actually remove cookies from the response
          },
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

    // Get calendar connection status from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("google_calendar_id, google_calendar_connected_at, google_calendar_last_sync, google_calendar_selected_ids")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    const isConnected = !!(profile?.google_calendar_id && profile?.google_calendar_connected_at);
    
    // Parse selected calendar IDs (stored as JSONB, may be null or JSON array)
    let selectedCalendarIds: string[] = [];
    if (profile?.google_calendar_selected_ids) {
      try {
        selectedCalendarIds = Array.isArray(profile.google_calendar_selected_ids) 
          ? profile.google_calendar_selected_ids 
          : [];
      } catch (e) {
        console.error("Error parsing selected calendar IDs:", e);
      }
    }

    return NextResponse.json({
      isConnected,
      calendarId: profile?.google_calendar_id || null,
      connectedAt: profile?.google_calendar_connected_at || null,
      lastSyncAt: profile?.google_calendar_last_sync || null,
      selectedCalendarIds,
    });
  } catch (error: any) {
    console.error("Error fetching calendar status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
