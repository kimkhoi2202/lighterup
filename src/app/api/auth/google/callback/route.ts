import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Parse the OAuth state parameter
 * Can be either a plain contractorId string or JSON with { contractorId, scheduleId }
 */
function parseState(state: string): { contractorId: string; scheduleId?: string } {
  try {
    // Try to parse as JSON first (new format with scheduleId)
    const parsed = JSON.parse(state);
    return {
      contractorId: parsed.contractorId,
      scheduleId: parsed.scheduleId,
    };
  } catch {
    // Fall back to plain string (just contractorId)
    return { contractorId: state };
  }
}

/**
 * Build redirect URL based on state data
 */
function buildRedirectUrl(scheduleId?: string, queryParam?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";
  const path = scheduleId
    ? `/app/contractor/availability/${scheduleId}`
    : "/app/contractor/availability";
  const query = queryParam ? `?${queryParam}` : "";
  return `${baseUrl}${path}${query}`;
}

/**
 * Google OAuth Callback Handler
 * Handles the OAuth callback from Google and stores tokens securely
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state"); // Contains contractorId and optionally scheduleId

    // Parse state to get contractorId and scheduleId
    const { contractorId, scheduleId } = state ? parseState(state) : { contractorId: "" };

    // Handle OAuth errors - redirect to schedule page if available
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(buildRedirectUrl(scheduleId, "error=oauth_failed"));
    }

    if (!code || !contractorId) {
      return NextResponse.redirect(buildRedirectUrl(scheduleId, "error=invalid_request"));
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(buildRedirectUrl(scheduleId, "error=token_exchange_failed"));
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Verify user is authenticated
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            req.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify the state matches the authenticated user
    if (!user || user.id !== contractorId) {
      return NextResponse.redirect(buildRedirectUrl(scheduleId, "error=unauthorized"));
    }

    // Get user's primary calendar ID
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let calendarId = "primary";
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      calendarId = calendarData.id || "primary";
    }

    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600));

    // Store tokens in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_calendar_access_token: access_token,
        google_calendar_refresh_token: refresh_token,
        google_calendar_token_expires_at: expiresAt.toISOString(),
        google_calendar_connected_at: new Date().toISOString(),
        google_calendar_id: calendarId,
      })
      .eq("id", contractorId);

    if (updateError) {
      console.error("Error storing tokens:", updateError);
      return NextResponse.redirect(buildRedirectUrl(scheduleId, "error=storage_failed"));
    }

    // Redirect back to the schedule page (or main availability page) with success
    return NextResponse.redirect(buildRedirectUrl(scheduleId, "success=calendar_connected"));
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    // For catch block, we may not have scheduleId, so fall back to generic page
    return NextResponse.redirect(buildRedirectUrl(undefined, "error=unknown"));
  }
}

