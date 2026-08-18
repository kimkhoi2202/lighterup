import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/jobs/feed:
 *   get:
 *     summary: Get available jobs for contractors
 *     description: Returns all open jobs that haven't been accepted yet
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of available jobs
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

    // Fetch open jobs
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(
        "id, address, city, state, zip, latitude, longitude, total_price_cents, contractor_payout_cents, complexity, lights_provided, storage_needed, estimated_length_feet, description"
      )
      .eq("status", "open")
      .is("contractor_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Get cover images for all jobs
    const jobsWithCoverImages = await Promise.all(
      (jobs || []).map(async (job) => {
        const { data: coverPhoto } = await supabase
          .from("job_photos")
          .select("storage_path, storage_bucket")
          .eq("job_id", job.id)
          .eq("is_cover", true)
          .single();

        let coverImageUrl = null;
        if (coverPhoto) {
          const { data: signedUrl } = await supabase.storage
            .from(coverPhoto.storage_bucket)
            .createSignedUrl(coverPhoto.storage_path, 3600);
          coverImageUrl = signedUrl?.signedUrl || null;
        }

        return {
          ...job,
          cover_image_url: coverImageUrl,
        };
      })
    );

    return NextResponse.json(jobsWithCoverImages);
  } catch (error: any) {
    console.error("Jobs feed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

