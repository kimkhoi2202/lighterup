import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/contractor/settings:
 *   get:
 *     summary: Get contractor scheduling settings
 *     description: Retrieve the contractor's scheduling preferences (buffer times, minimum notice, etc.)
 *     tags: [Contractor]
 *     responses:
 *       200:
 *         description: Contractor settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contractor profile not found
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
            req.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            req.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch contractor profile with scheduling settings
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, role, buffer_before_minutes, buffer_after_minutes, minimum_notice_hours, slot_interval_minutes, future_booking_days, google_calendar_id, google_calendar_last_sync"
      )
      .eq("id", user.id)
      .eq("role", "contractor")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Contractor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      buffer_before_minutes: profile.buffer_before_minutes || 30,
      buffer_after_minutes: profile.buffer_after_minutes || 30,
      minimum_notice_hours: profile.minimum_notice_hours || 48,
      slot_interval_minutes: profile.slot_interval_minutes || 60,
      future_booking_days: profile.future_booking_days || 60,
      google_calendar_id: profile.google_calendar_id,
      google_calendar_last_sync: profile.google_calendar_last_sync,
    });
  } catch (error: any) {
    console.error("Error fetching contractor settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/contractor/settings:
 *   post:
 *     summary: Update contractor scheduling settings
 *     description: Update the contractor's scheduling preferences
 *     tags: [Contractor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buffer_before_minutes:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 180
 *               buffer_after_minutes:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 180
 *               minimum_notice_hours:
 *                 type: number
 *                 minimum: 0
 *               slot_interval_minutes:
 *                 type: number
 *                 enum: [15, 30, 60]
 *               future_booking_days:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 365
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a contractor
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
            req.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            req.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a contractor
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role !== "contractor") {
      return NextResponse.json(
        { error: "Only contractors can update these settings" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      buffer_before_minutes,
      buffer_after_minutes,
      minimum_notice_hours,
      slot_interval_minutes,
      future_booking_days,
    } = body;

    // Validate data
    if (
      buffer_before_minutes !== undefined &&
      (buffer_before_minutes < 0 || buffer_before_minutes > 180)
    ) {
      return NextResponse.json(
        { error: "Buffer before minutes must be between 0 and 180" },
        { status: 400 }
      );
    }

    if (
      buffer_after_minutes !== undefined &&
      (buffer_after_minutes < 0 || buffer_after_minutes > 180)
    ) {
      return NextResponse.json(
        { error: "Buffer after minutes must be between 0 and 180" },
        { status: 400 }
      );
    }

    if (minimum_notice_hours !== undefined && minimum_notice_hours < 0) {
      return NextResponse.json(
        { error: "Minimum notice hours cannot be negative" },
        { status: 400 }
      );
    }

    if (
      slot_interval_minutes !== undefined &&
      ![15, 30, 60].includes(slot_interval_minutes)
    ) {
      return NextResponse.json(
        { error: "Slot interval must be 15, 30, or 60 minutes" },
        { status: 400 }
      );
    }

    if (
      future_booking_days !== undefined &&
      (future_booking_days < 1 || future_booking_days > 365)
    ) {
      return NextResponse.json(
        { error: "Future booking days must be between 1 and 365" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (buffer_before_minutes !== undefined)
      updateData.buffer_before_minutes = buffer_before_minutes;
    if (buffer_after_minutes !== undefined)
      updateData.buffer_after_minutes = buffer_after_minutes;
    if (minimum_notice_hours !== undefined)
      updateData.minimum_notice_hours = minimum_notice_hours;
    if (slot_interval_minutes !== undefined)
      updateData.slot_interval_minutes = slot_interval_minutes;
    if (future_booking_days !== undefined)
      updateData.future_booking_days = future_booking_days;

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      data: {
        buffer_before_minutes: updatedProfile.buffer_before_minutes,
        buffer_after_minutes: updatedProfile.buffer_after_minutes,
        minimum_notice_hours: updatedProfile.minimum_notice_hours,
        slot_interval_minutes: updatedProfile.slot_interval_minutes,
        future_booking_days: updatedProfile.future_booking_days,
      },
    });
  } catch (error: any) {
    console.error("Error updating contractor settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

