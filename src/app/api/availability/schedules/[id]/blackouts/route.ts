import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/availability/schedules/{id}/blackouts:
 *   post:
 *     summary: Add blackout dates to a schedule
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
    const { dates, reason, is_all_day } = body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: "dates array is required" },
        { status: 400 }
      );
    }

    // Insert blackouts (handle duplicates gracefully)
    const blackouts = dates.map((date: string) => ({
      schedule_id: id,
      blackout_date: date,
      reason: reason || null,
      is_all_day: is_all_day !== false,
    }));

    const { data: createdBlackouts, error } = await supabase
      .from("availability_blackouts")
      .upsert(blackouts, {
        onConflict: "schedule_id,blackout_date",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Error creating blackouts:", error);
      return NextResponse.json(
        { error: "Failed to create blackouts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ blackouts: createdBlackouts }, { status: 201 });
  } catch (error: any) {
    console.error("Blackout creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create blackouts" },
      { status: 500 }
    );
  }
}

