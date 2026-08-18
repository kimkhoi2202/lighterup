import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { calculateJobPricing } from "@/lib/pricing-engine";

/**
 * @swagger
 * /api/jobs/{id}:
 *   patch:
 *     summary: Update a job
 *     description: Update an existing job. Homeowners can only update unassigned jobs. Requires authentication.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip:
 *                 type: string
 *               description:
 *                 type: string
 *               numStories:
 *                 type: number
 *               houseSize:
 *                 type: string
 *               estimatedLengthFeet:
 *                 type: number
 *               complexity:
 *                 type: string
 *                 enum: [simple, medium, complex]
 *               requestedDateStart:
 *                 type: string
 *                 format: date
 *               lightsProvided:
 *                 type: boolean
 *               storageNeeded:
 *                 type: boolean
 *               tipAmountCents:
 *                 type: number
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Job cannot be edited
 *       404:
 *         description: Job not found
 *       500:
 *         description: Failed to update job
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
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

    // Get existing job
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify user owns the job
    if (existingJob.homeowner_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own jobs" },
        { status: 403 }
      );
    }

    // Homeowners can only edit unassigned jobs (status = 'open' and contractor_id is null)
    if (existingJob.contractor_id !== null || existingJob.status !== "open") {
      return NextResponse.json(
        {
          error:
            "You can only edit jobs that haven't been assigned to a contractor yet",
        },
        { status: 403 }
      );
    }

    const jobData = await req.json();

    // Calculate new pricing if pricing-related fields changed
    const needsPricingRecalc =
      jobData.estimatedLengthFeet !== undefined ||
      jobData.complexity !== undefined ||
      jobData.lightsProvided !== undefined ||
      jobData.storageNeeded !== undefined ||
      jobData.tipAmountCents !== undefined;

    let pricing = null;
    if (needsPricingRecalc) {
      pricing = await calculateJobPricing({
        regionId: existingJob.region_id,
        estimatedLengthFeet:
          jobData.estimatedLengthFeet ?? existingJob.estimated_length_feet,
        complexity: jobData.complexity ?? existingJob.complexity,
        lightsProvided:
          jobData.lightsProvided ?? existingJob.lights_provided,
        storageNeeded: jobData.storageNeeded ?? existingJob.storage_needed,
        tipAmountCents: jobData.tipAmountCents ?? existingJob.tip_amount_cents,
      });
    }

    // Build update object
    const updateData: any = {};

    if (jobData.address !== undefined) updateData.address = jobData.address;
    if (jobData.city !== undefined) updateData.city = jobData.city;
    if (jobData.state !== undefined) updateData.state = jobData.state;
    if (jobData.zip !== undefined) updateData.zip = jobData.zip;
    if (jobData.description !== undefined)
      updateData.description = jobData.description;
    if (jobData.numStories !== undefined)
      updateData.num_stories = jobData.numStories;
    if (jobData.houseSize !== undefined)
      updateData.house_size = jobData.houseSize;
    if (jobData.estimatedLengthFeet !== undefined)
      updateData.estimated_length_feet = jobData.estimatedLengthFeet;
    if (jobData.complexity !== undefined)
      updateData.complexity = jobData.complexity;
    if (jobData.requestedDateStart !== undefined)
      updateData.requested_date_start = jobData.requestedDateStart || null;
    if (jobData.lightsProvided !== undefined)
      updateData.lights_provided = jobData.lightsProvided;
    if (jobData.storageNeeded !== undefined)
      updateData.storage_needed = jobData.storageNeeded;
    if (jobData.tipAmountCents !== undefined)
      updateData.tip_amount_cents = jobData.tipAmountCents;

    // Update pricing if recalculated
    if (pricing) {
      updateData.base_price_cents = pricing.basePriceCents;
      updateData.complexity_addon_cents = pricing.complexityAddonCents;
      updateData.options_addon_cents = pricing.optionsAddonCents;
      updateData.total_price_cents = pricing.totalPriceCents;
      updateData.contractor_payout_cents = pricing.contractorPayoutCents;
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ job: updatedJob }, {
      status: 200,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error("Job update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update job" },
      { status: 500 }
    );
  }
}

