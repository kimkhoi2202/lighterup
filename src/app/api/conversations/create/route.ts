import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/conversations/create:
 *   post:
 *     summary: Create a new conversation for a job
 *     description: Create a conversation between homeowner and contractor for a specific job
 *     tags: [Messaging]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *             properties:
 *               job_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Conversation created successfully
 *       400:
 *         description: Invalid request or conversation already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to create conversation for this job
 *       500:
 *         description: Failed to create conversation
 */
export async function POST(req: NextRequest) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 }
      );
    }

    // Create response object for cookie handling
    let response = NextResponse.json({});

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: "",
              ...options,
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("homeowner_id, contractor_id")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify user is part of this job
    if (job.homeowner_id !== user.id && job.contractor_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", job_id)
      .eq("homeowner_id", job.homeowner_id)
      .eq("contractor_id", job.contractor_id || "")
      .single();

    if (existing) {
      return NextResponse.json(
        { conversation: existing, created: false },
        { status: 200, headers: response.headers }
      );
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        job_id,
        homeowner_id: job.homeowner_id,
        contractor_id: job.contractor_id,
      })
      .select()
      .single();

    if (convError) {
      console.error("Error creating conversation:", convError);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { conversation, created: true },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Conversation creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}


