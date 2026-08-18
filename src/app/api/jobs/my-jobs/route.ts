import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     summary: Get jobs for the authenticated user
 *     description: Returns jobs for contractors (accepted jobs) or homeowners (created jobs)
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
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

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let jobs;

    if (profile.role === "contractor") {
      // Get jobs where contractor is assigned
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      jobs = data || [];
    } else if (profile.role === "homeowner") {
      // Get jobs created by homeowner
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("homeowner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      jobs = data || [];
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Get cover images for all jobs
    const jobsWithCoverImages = await Promise.all(
      jobs.map(async (job) => {
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

    return NextResponse.json({ jobs: jobsWithCoverImages });
  } catch (error: any) {
    console.error("Error fetching my jobs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

