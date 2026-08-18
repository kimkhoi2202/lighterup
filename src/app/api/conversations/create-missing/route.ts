import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Utility endpoint to create missing conversations for existing accepted jobs
 * This is a one-time fix for jobs that were accepted before auto-create was implemented
 */
export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({});
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
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            req.cookies.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all jobs assigned to this contractor that don't have conversations
    const { data: assignedJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, homeowner_id, contractor_id")
      .eq("contractor_id", user.id)
      .not("status", "eq", "cancelled");

    if (jobsError) throw jobsError;

    const createdConversations = [];
    const errors = [];

    for (const job of assignedJobs || []) {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("job_id", job.id)
        .eq("homeowner_id", job.homeowner_id)
        .eq("contractor_id", job.contractor_id)
        .maybeSingle();

      if (!existing) {
        // Create conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            job_id: job.id,
            homeowner_id: job.homeowner_id,
            contractor_id: job.contractor_id,
          })
          .select()
          .single();

        if (createError) {
          errors.push({ job_id: job.id, error: createError.message });
        } else {
          createdConversations.push(newConv.id);
        }
      }
    }

    return NextResponse.json(
      {
        created: createdConversations.length,
        conversationIds: createdConversations,
        errors: errors.length > 0 ? errors : undefined,
      },
      { headers: response.headers }
    );
  } catch (error: any) {
    console.error("Error creating missing conversations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create conversations" },
      { status: 500 }
    );
  }
}


