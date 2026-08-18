import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules/{id}:
 *   get:
 *     summary: Get a specific availability schedule with windows and blackouts
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
export async function GET(
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

    // Get schedule with windows and blackouts
    const { data: schedule, error: scheduleError } = await supabase
      .from("availability_schedules")
      .select("*")
      .eq("id", id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (schedule.contractor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get windows
    const { data: windows } = await supabase
      .from("availability_windows")
      .select("*")
      .eq("schedule_id", id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    // Get blackouts
    const { data: blackouts } = await supabase
      .from("availability_blackouts")
      .select("*")
      .eq("schedule_id", id)
      .order("blackout_date", { ascending: true });

    return NextResponse.json({
      schedule,
      windows: windows || [],
      blackouts: blackouts || [],
    });
  } catch (error: any) {
    console.error("Schedule fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/availability/schedules/{id}:
 *   put:
 *     summary: Update an availability schedule
 *     tags: [Availability]
 */
export async function PUT(
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
    const { name, timezone, is_default } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Schedule name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (timezone !== undefined) {
      updates.timezone = timezone;
    }

    if (is_default === true) {
      // Unset other defaults first
      await supabase
        .from("availability_schedules")
        .update({ is_default: false })
        .eq("contractor_id", user.id)
        .eq("is_default", true)
        .neq("id", id);
      updates.is_default = true;
    } else if (is_default === false) {
      updates.is_default = false;
    }

    const { data: updatedSchedule, error } = await supabase
      .from("availability_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating schedule:", error);
      return NextResponse.json(
        { error: "Failed to update schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error: any) {
    console.error("Schedule update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/availability/schedules/{id}:
 *   delete:
 *     summary: Delete an availability schedule
 *     tags: [Availability]
 */
export async function DELETE(
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
      .select("contractor_id, is_default")
      .eq("id", id)
      .single();

    if (!schedule || schedule.contractor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete schedule (cascade will delete windows and blackouts)
    const { error } = await supabase
      .from("availability_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting schedule:", error);
      return NextResponse.json(
        { error: "Failed to delete schedule" },
        { status: 500 }
      );
    }

    // If deleted schedule was default and there are other schedules, set another one as default
    if (schedule.is_default) {
      const { data: firstSchedule } = await supabase
        .from("availability_schedules")
        .select("id")
        .eq("contractor_id", user.id)
        .limit(1)
        .single();

      if (firstSchedule) {
        await supabase
          .from("availability_schedules")
          .update({ is_default: true })
          .eq("id", firstSchedule.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Schedule deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}

