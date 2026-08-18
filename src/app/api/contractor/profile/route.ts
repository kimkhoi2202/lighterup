import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /api/contractor/profile - Fetch contractor profile
 * PATCH /api/contractor/profile - Update contractor profile
 */

const PROFILE_FIELDS = `
  id,
  full_name,
  phone,
  business_name,
  bio,
  tagline,
  avatar_url,
  website_url,
  years_in_business,
  instagram_handle,
  facebook_url,
  business_email,
  license_number,
  insurance_info,
  public_slug,
  is_profile_public,
  service_base_address,
  service_base_city,
  service_base_state,
  service_base_zip,
  service_radius_miles
`;

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Error in profile GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();

    // Allowed fields to update
    const allowedFields = [
      "full_name",
      "phone",
      "business_name",
      "bio",
      "tagline",
      "avatar_url",
      "website_url",
      "years_in_business",
      "instagram_handle",
      "facebook_url",
      "business_email",
      "license_number",
      "insurance_info",
      "public_slug",
      "is_profile_public",
      "service_base_address",
      "service_base_city",
      "service_base_state",
      "service_base_zip",
      "service_radius_miles",
    ];

    // Filter to only allowed fields
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Validate public_slug if provided
    if (updateData.public_slug) {
      // Sanitize slug: lowercase, alphanumeric and hyphens only
      const slug = updateData.public_slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (slug.length < 3) {
        return NextResponse.json(
          { error: "Slug must be at least 3 characters" },
          { status: 400 }
        );
      }

      if (slug.length > 50) {
        return NextResponse.json(
          { error: "Slug must be 50 characters or less" },
          { status: 400 }
        );
      }

      // Check if slug is already taken by another user
      const { data: existingSlug } = await supabase
        .from("profiles")
        .select("id")
        .eq("public_slug", slug)
        .neq("id", user.id)
        .single();

      if (existingSlug) {
        return NextResponse.json(
          { error: "This URL is already taken" },
          { status: 409 }
        );
      }

      updateData.public_slug = slug;
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select(PROFILE_FIELDS)
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Error in profile PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

