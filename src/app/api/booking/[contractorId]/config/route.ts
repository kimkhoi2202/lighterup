import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeLocationSettings } from "@/lib/location-settings";

/**
 * GET /api/booking/[contractorId]/config
 * 
 * Fetches the contractor's booking configuration including:
 * - Event type details (title, description, duration, location options, pricing)
 * - Profile information (name, business name)
 * - Default schedule timezone
 * 
 * This endpoint is public and doesn't require authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const { contractorId } = await params;

    // Fetch contractor profile with event type configuration
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        business_name,
        avatar_url,
        tagline,
        bio,
        event_type_title,
        event_type_description,
        event_type_duration_minutes,
        event_type_location_options,
        event_type_price_cents,
        event_type_currency,
        default_schedule_id,
        role
      `)
      .eq("id", contractorId)
      .eq("role", "contractor")
      .eq("is_active", true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Contractor not found or inactive" },
        { status: 404 }
      );
    }

    // Fetch default schedule timezone
    let timezone = "America/New_York"; // Default fallback
    if (profile.default_schedule_id) {
      const { data: schedule } = await supabaseAdmin
        .from("availability_schedules")
        .select("timezone")
        .eq("id", profile.default_schedule_id)
        .single();
      
      if (schedule) {
        timezone = schedule.timezone;
      }
    }

    // Format response
    return NextResponse.json({
      contractor: {
        id: profile.id,
        name: profile.full_name || profile.business_name || "Contractor",
        businessName: profile.business_name,
        avatarUrl: profile.avatar_url,
        tagline: profile.tagline,
        bio: profile.bio,
      },
      eventType: {
        title: profile.event_type_title || "Consultation",
        description: profile.event_type_description || "",
        durationMinutes: profile.event_type_duration_minutes || 60,
        locationSettings: normalizeLocationSettings(profile.event_type_location_options),
        priceCents: profile.event_type_price_cents || 0,
        currency: profile.event_type_currency || "USD",
      },
      timezone,
    });
  } catch (error) {
    console.error("Error fetching booking config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

