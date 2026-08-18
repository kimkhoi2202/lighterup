import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules:
 *   get:
 *     summary: Get all availability schedules for the authenticated contractor
 *     tags: [Availability]
 *     responses:
 *       200:
 *         description: List of schedules
 *       401:
 *         description: Unauthorized
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a contractor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "contractor") {
      return NextResponse.json(
        { error: "Only contractors can manage availability" },
        { status: 403 }
      );
    }

    // Get all schedules for this contractor
    const { data: schedules, error } = await supabase
      .from("availability_schedules")
      .select("*")
      .eq("contractor_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching schedules:", error);
      return NextResponse.json(
        { error: "Failed to fetch schedules" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedules: schedules || [] });
  } catch (error: any) {
    console.error("Schedules fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/availability/schedules:
 *   post:
 *     summary: Create a new availability schedule
 *     tags: [Availability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               timezone:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Schedule created
 *       401:
 *         description: Unauthorized
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a contractor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, service_base_city, service_base_state")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "contractor") {
      return NextResponse.json(
        { error: "Only contractors can manage availability" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, timezone, is_default } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Schedule name is required" },
        { status: 400 }
      );
    }

    // Determine default timezone based on contractor location (Austin, TX = America/Chicago)
    const defaultTimezone = timezone || "America/Chicago";

    // If setting as default, unset other defaults first
    if (is_default === true) {
      await supabase
        .from("availability_schedules")
        .update({ is_default: false })
        .eq("contractor_id", user.id)
        .eq("is_default", true);
    }

    // Create the schedule
    const { data: schedule, error } = await supabase
      .from("availability_schedules")
      .insert({
        contractor_id: user.id,
        name: name.trim(),
        timezone: defaultTimezone,
        is_default: is_default === true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating schedule:", error);
      return NextResponse.json(
        { error: "Failed to create schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error("Schedule creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}

