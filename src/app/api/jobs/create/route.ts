import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { calculateJobPricing } from "@/lib/pricing-engine";

/**
 * @swagger
 * /api/jobs/create:
 *   post:
 *     summary: Create a new job
 *     description: Create a new job posting as a homeowner. Requires authentication.
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       200:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: NextRequest) {
  try {
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

    const jobData = await req.json();

    // Calculate pricing
    const pricing = await calculateJobPricing({
      regionId: jobData.regionId,
      estimatedLengthFeet: jobData.estimatedLengthFeet,
      complexity: jobData.complexity,
      lightsProvided: jobData.lightsProvided,
      storageNeeded: jobData.storageNeeded,
      tipAmountCents: jobData.tipAmountCents || 0,
    });

    // Create job
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        homeowner_id: user.id,
        region_id: jobData.regionId,
        address: jobData.address,
        city: jobData.city,
        state: jobData.state,
        zip: jobData.zip,
        latitude: jobData.latitude || null,
        longitude: jobData.longitude || null,
        description: jobData.description,
        num_stories: jobData.numStories,
        house_size: jobData.houseSize,
        estimated_length_feet: jobData.estimatedLengthFeet,
        complexity: jobData.complexity,
        lights_provided: jobData.lightsProvided,
        storage_needed: jobData.storageNeeded,
        tip_amount_cents: jobData.tipAmountCents || 0,
        requested_date_start: jobData.requestedDateStart || null,
        requested_date_end: jobData.requestedDateEnd || null,
        base_price_cents: pricing.basePriceCents,
        complexity_addon_cents: pricing.complexityAddonCents,
        options_addon_cents: pricing.optionsAddonCents,
        total_price_cents: pricing.totalPriceCents,
        contractor_payout_cents: pricing.contractorPayoutCents,
      })
      .select()
      .single();

    if (error) throw error;

    // Create success response with proper cookies
    return NextResponse.json({ job }, {
      status: 200,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
