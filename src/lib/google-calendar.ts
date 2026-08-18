/**
 * Google Calendar Integration Utilities
 * Handles OAuth flow, token refresh, and calendar operations
 */

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  contractorId: string,
  supabase: any
): Promise<string | null> {
  // Get stored tokens
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expires_at")
    .eq("id", contractorId)
    .single();

  if (error || !profile?.google_calendar_access_token) {
    return null;
  }

  // Check if token is expired or expires soon (within 5 minutes)
  const expiresAt = profile.google_calendar_token_expires_at
    ? new Date(profile.google_calendar_token_expires_at)
    : null;

  if (expiresAt && expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    // Token is still valid
    return profile.google_calendar_access_token;
  }

  // Token expired or expiring soon, refresh it
  if (!profile.google_calendar_refresh_token) {
    return null; // Can't refresh without refresh token
  }

  try {
    console.log("[Google Calendar] Attempting token refresh for contractor:", contractorId);
    
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: profile.google_calendar_refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("[Google Calendar] Token refresh failed:", {
        status: refreshResponse.status,
        error: errorText,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      });
      return null;
    }

    const tokens = await refreshResponse.json();
    const { access_token, expires_in } = tokens;

    // Update stored tokens
    const expiresAtNew = new Date();
    expiresAtNew.setSeconds(expiresAtNew.getSeconds() + (expires_in || 3600));

    await supabase
      .from("profiles")
      .update({
        google_calendar_access_token: access_token,
        google_calendar_token_expires_at: expiresAtNew.toISOString(),
      })
      .eq("id", contractorId);

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Get Google Calendar events for a date range
 */
export async function getCalendarEvents(
  contractorId: string,
  supabase: any,
  timeMin: Date,
  timeMax: Date
): Promise<any[]> {
  const accessToken = await getValidAccessToken(contractorId, supabase);
  if (!accessToken) {
    throw new Error("No valid access token");
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a calendar event
 * Uses the contractor's selected destination calendar, or 'primary' if not set
 */
export async function createCalendarEvent(
  contractorId: string,
  supabase: any,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: string;
  }
): Promise<any> {
  const accessToken = await getValidAccessToken(contractorId, supabase);
  if (!accessToken) {
    throw new Error("No valid access token");
  }

  // Get the contractor's destination calendar
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_destination_id")
    .eq("id", contractorId)
    .single();

  // Use the destination calendar or default to primary
  const calendarId = encodeURIComponent(profile?.google_calendar_destination_id || "primary");

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create calendar event: ${error.error?.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  contractorId: string,
  supabase: any,
  eventId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(contractorId, supabase);
  if (!accessToken) {
    throw new Error("No valid access token");
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete calendar event: ${response.statusText}`);
  }
}

/**
 * Generate Google OAuth authorization URL
 * @param contractorId - The contractor's user ID
 * @param scheduleId - Optional schedule ID to redirect back to after OAuth
 */
export function getGoogleAuthUrl(contractorId: string, scheduleId?: string): string {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/api/auth/google/callback`;
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  // Encode both contractorId and scheduleId in the state
  const stateData = scheduleId 
    ? JSON.stringify({ contractorId, scheduleId })
    : contractorId;

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline", // Required to get refresh token
    prompt: "consent", // Force consent screen to get refresh token
    state: stateData, // Pass contractor ID and optional schedule ID
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

