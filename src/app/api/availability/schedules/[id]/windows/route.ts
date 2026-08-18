import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules/{id}/windows:
 *   post:
 *     summary: Add a time window to a schedule
 *     tags: [Availability]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify ownership
    const { data: schedule } = await supabase
      .from("availability_schedules")
      .select("contractor_id")
      .eq("id", id)
      .single();

    if (!schedule || schedule.contractor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { day_of_week, start_time, end_time, is_active } = body;

    if (
      typeof day_of_week !== "number" ||
      day_of_week < 0 ||
      day_of_week > 6
    ) {
      return NextResponse.json(
        { error: "Invalid day_of_week (0-6)" },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "start_time and end_time are required" },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: "start_time must be before end_time" },
        { status: 400 }
      );
    }

    const { data: window, error } = await supabase
      .from("availability_windows")
      .insert({
        schedule_id: id,
        day_of_week,
        start_time,
        end_time,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating window:", error);
      return NextResponse.json(
        { error: "Failed to create time window" },
        { status: 500 }
      );
    }

    return NextResponse.json({ window }, { status: 201 });
  } catch (error: any) {
    console.error("Window creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create time window" },
      { status: 500 }
    );
  }
}

