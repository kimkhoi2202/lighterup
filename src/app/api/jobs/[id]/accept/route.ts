import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/jobs/{id}/accept:
 *   post:
 *     summary: Accept a job
 *     description: Accept a job as a contractor. Only contractors can accept jobs. The job must be in 'open' status.
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job accepted successfully
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Job is no longer available or has already been accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only contractors can accept jobs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Job was accepted by another contractor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to accept job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id: jobId } = await params;

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

    // Verify user is a contractor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "contractor") {
      return NextResponse.json(
        { error: "Only contractors can accept jobs" },
        { status: 403 }
      );
    }

    // Check if job exists and is still open
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("id, status, contractor_id")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "open") {
      return NextResponse.json(
        { error: "Job is no longer available" },
        { status: 400 }
      );
    }

    if (job.contractor_id) {
      return NextResponse.json(
        { error: "Job has already been accepted" },
        { status: 400 }
      );
    }

    // Accept the job - assign contractor and update status
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({
        contractor_id: user.id,
        status: "assigned",
      })
      .eq("id", jobId)
      .eq("status", "open") // Double-check it's still open (prevent race conditions)
      .select()
      .single();

    if (updateError) {
      console.error("Error accepting job:", updateError);
      return NextResponse.json(
        { error: "Failed to accept job. It may have been accepted by another contractor." },
        { status: 500 }
      );
    }

    if (!updatedJob) {
      return NextResponse.json(
        { error: "Job was accepted by another contractor" },
        { status: 409 }
      );
    }

    // Auto-create conversation for this job
    try {
      const { data: jobWithHomeowner } = await supabase
        .from("jobs")
        .select("homeowner_id")
        .eq("id", jobId)
        .single();

      if (jobWithHomeowner?.homeowner_id) {
        // Check if conversation already exists
        const { data: existingConv, error: checkError } = await supabase
          .from("conversations")
          .select("id")
          .eq("job_id", jobId)
          .eq("homeowner_id", jobWithHomeowner.homeowner_id)
          .eq("contractor_id", user.id)
          .maybeSingle();

        // Create conversation if it doesn't exist
        if (!existingConv && !checkError) {
          const { data: newConv, error: insertError } = await supabase
            .from("conversations")
            .insert({
              job_id: jobId,
              homeowner_id: jobWithHomeowner.homeowner_id,
              contractor_id: user.id,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating conversation:", insertError);
          } else {
            console.log("Conversation created successfully:", newConv?.id);
          }
        }
      }
    } catch (convError) {
      // Don't fail the job acceptance if conversation creation fails
      console.error("Error creating conversation:", convError);
    }

    // Return success response with updated job
    return NextResponse.json(
      {
        message: "Job accepted successfully",
        job: updatedJob,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Job acceptance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept job" },
      { status: 500 }
    );
  }
}
