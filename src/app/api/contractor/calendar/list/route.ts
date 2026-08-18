import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getValidAccessToken } from "@/lib/google-calendar";

/**
 * List all Google Calendars for the authenticated user
 * GET /api/contractor/calendar/list
 * 
 * Returns list of calendars with id, name, and whether it's primary
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

    // Get valid access token
    const accessToken = await getValidAccessToken(user.id, supabase);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected or token expired" },
        { status: 401 }
      );
    }

    // Fetch calendar list from Google
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error fetching calendar list:", error);
      return NextResponse.json(
        { error: "Failed to fetch calendars from Google" },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Map to simpler format
    const calendars = (data.items || []).map((cal: any) => ({
      id: cal.id,
      name: cal.summary,
      description: cal.description || null,
      isPrimary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
      accessRole: cal.accessRole,
    }));

    // Sort: primary first, then alphabetically
    calendars.sort((a: any, b: any) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ calendars });
  } catch (error: any) {
    console.error("Error listing calendars:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
