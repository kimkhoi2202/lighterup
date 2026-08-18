import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Update the list of selected Google Calendar IDs for conflict checking
 * PATCH /api/contractor/calendar/update-selected
 * Body: { calendarIds: string[] }
 */
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
          set(name: string, value: string, options: any) {
            // Note: This won't actually set cookies in the response
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

    // Parse request body
    const body = await req.json();
    const { calendarIds } = body;

    // Validate input
    if (!Array.isArray(calendarIds)) {
      return NextResponse.json(
        { error: "calendarIds must be an array" },
        { status: 400 }
      );
    }

    // Update the selected calendar IDs in the database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_calendar_selected_ids: calendarIds,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating selected calendars:", updateError);
      return NextResponse.json(
        { error: "Failed to update calendar selection" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Calendar selection updated successfully",
      selectedCount: calendarIds.length,
    });
  } catch (error: any) {
    console.error("Error updating calendar selection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

