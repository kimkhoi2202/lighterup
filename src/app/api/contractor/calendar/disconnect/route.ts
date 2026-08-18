import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Disconnect Google Calendar for the authenticated contractor
 * Removes all Google Calendar tokens and settings
 */
export async function POST(req: NextRequest) {
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

    // Revoke the Google OAuth token (optional but recommended)
    // This is a best practice to inform Google that the token is no longer in use
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_calendar_access_token")
      .eq("id", user.id)
      .single();

    if (profile?.google_calendar_access_token) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${profile.google_calendar_access_token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
      } catch (revokeError) {
        // Log but don't fail the request if revocation fails
        console.error("Failed to revoke Google token:", revokeError);
      }
    }

    // Clear all Google Calendar data from database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_calendar_id: null,
        google_calendar_access_token: null,
        google_calendar_refresh_token: null,
        google_calendar_token_expires_at: null,
        google_calendar_connected_at: null,
        google_calendar_last_sync: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error disconnecting calendar:", updateError);
      return NextResponse.json(
        { error: "Failed to disconnect calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Calendar disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
