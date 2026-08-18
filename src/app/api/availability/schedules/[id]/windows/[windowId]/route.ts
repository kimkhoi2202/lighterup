import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules/{id}/windows/{windowId}:
 *   put:
 *     summary: Update a time window
 *     tags: [Availability]
 */
export async function PUT(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; windowId: string }> }
) {
  try {
    const { id, windowId } = await params;
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

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (day_of_week !== undefined) {
      if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: "Invalid day_of_week (0-6)" },
          { status: 400 }
        );
      }
      updates.day_of_week = day_of_week;
    }

    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (is_active !== undefined) updates.is_active = is_active;

    if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
      return NextResponse.json(
        { error: "start_time must be before end_time" },
        { status: 400 }
      );
    }

    const { data: window, error } = await supabase
      .from("availability_windows")
      .update(updates)
      .eq("id", windowId)
      .eq("schedule_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating window:", error);
      return NextResponse.json(
        { error: "Failed to update time window" },
        { status: 500 }
      );
    }

    return NextResponse.json({ window });
  } catch (error: any) {
    console.error("Window update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update time window" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/availability/schedules/{id}/windows/{windowId}:
 *   delete:
 *     summary: Delete a time window
 *     tags: [Availability]
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; windowId: string }> }
) {
  try {
    const { id, windowId } = await params;
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

    const { error } = await supabase
      .from("availability_windows")
      .delete()
      .eq("id", windowId)
      .eq("schedule_id", id);

    if (error) {
      console.error("Error deleting window:", error);
      return NextResponse.json(
        { error: "Failed to delete time window" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Window deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete time window" },
      { status: 500 }
    );
  }
}

