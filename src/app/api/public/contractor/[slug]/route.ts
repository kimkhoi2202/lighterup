import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/public/contractor/[slug]
 * Public API to fetch contractor profile by slug
 * No authentication required
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    // Use service role for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch public profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        business_name,
        bio,
        tagline,
        avatar_url,
        website_url,
        years_in_business,
        instagram_handle,
        facebook_url,
        business_email,
        phone,
        service_base_city,
        service_base_state,
        service_radius_miles,
        event_type_title,
        event_type_description,
        event_type_duration_minutes,
        event_type_price_cents,
        event_type_currency,
        event_type_location_options,
        is_profile_public,
        public_slug
      `)
      .eq("public_slug", slug)
      .eq("is_profile_public", true)
      .eq("role", "contractor")
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Don't expose sensitive fields
    const publicProfile = {
      id: profile.id,
      name: profile.full_name,
      businessName: profile.business_name,
      bio: profile.bio,
      tagline: profile.tagline,
      avatarUrl: profile.avatar_url,
      websiteUrl: profile.website_url,
      yearsInBusiness: profile.years_in_business,
      instagram: profile.instagram_handle,
      facebook: profile.facebook_url,
      email: profile.business_email,
      phone: profile.phone,
      location: {
        city: profile.service_base_city,
        state: profile.service_base_state,
        serviceRadius: profile.service_radius_miles,
      },
      eventType: {
        title: profile.event_type_title,
        description: profile.event_type_description,
        durationMinutes: profile.event_type_duration_minutes,
        priceCents: profile.event_type_price_cents,
        currency: profile.event_type_currency,
        locationOptions: profile.event_type_location_options,
      },
      slug: profile.public_slug,
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error: any) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

