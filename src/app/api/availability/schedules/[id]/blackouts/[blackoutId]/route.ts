import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules/{id}/blackouts/{blackoutId}:
 *   delete:
 *     summary: Delete a blackout date
 *     tags: [Availability]
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; blackoutId: string }> }
) {
  try {
    const { id, blackoutId } = await params;
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
      .from("availability_blackouts")
      .delete()
      .eq("id", blackoutId)
      .eq("schedule_id", id);

    if (error) {
      console.error("Error deleting blackout:", error);
      return NextResponse.json(
        { error: "Failed to delete blackout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Blackout deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete blackout" },
      { status: 500 }
    );
  }
}

