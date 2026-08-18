import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/homeowner/contractors
 * Fetch contractors available in the homeowner's area
 * Query params:
 * - city: filter by city (optional)
 * - state: filter by state (optional)
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query for public contractor profiles
    let query = supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        business_name,
        bio,
        tagline,
        avatar_url,
        service_base_city,
        service_base_state,
        service_radius_miles,
        years_in_business,
        event_type_title,
        event_type_description,
        event_type_duration_minutes,
        event_type_price_cents,
        event_type_currency,
        public_slug,
        is_profile_public
      `)
      .eq("role", "contractor")
      .eq("is_profile_public", true);

    // Filter by location if provided
    if (city) {
      query = query.ilike("service_base_city", `%${city}%`);
    }
    if (state) {
      query = query.eq("service_base_state", state);
    }

    // Apply pagination
    const { data: contractors, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching contractors:", error);
      return NextResponse.json(
        { error: "Failed to fetch contractors" },
        { status: 500 }
      );
    }

    // Transform the data to a cleaner format
    const formattedContractors = (contractors || []).map((c) => ({
      id: c.id,
      name: c.full_name,
      businessName: c.business_name,
      bio: c.bio,
      tagline: c.tagline,
      avatarUrl: c.avatar_url,
      location: {
        city: c.service_base_city,
        state: c.service_base_state,
        serviceRadius: c.service_radius_miles,
      },
      yearsInBusiness: c.years_in_business,
      eventType: {
        title: c.event_type_title,
        description: c.event_type_description,
        durationMinutes: c.event_type_duration_minutes,
        priceCents: c.event_type_price_cents,
        currency: c.event_type_currency,
      },
      slug: c.public_slug,
    }));

    return NextResponse.json({
      contractors: formattedContractors,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error in contractors API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

