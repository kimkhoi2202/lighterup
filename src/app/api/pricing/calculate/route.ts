import { NextRequest, NextResponse } from "next/server";
import { calculateJobPricing, PricingInputs } from "@/lib/pricing-engine";

/**
 * @swagger
 * /api/pricing/calculate:
 *   post:
 *     summary: Calculate job pricing
 *     description: Calculate the pricing for a job based on region, length, complexity, and options
 *     tags: [Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PricingInputs'
 *     responses:
 *       200:
 *         description: Pricing calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingResult'
 *       400:
 *         description: Missing required pricing inputs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to calculate pricing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: NextRequest) {
  try {
    const inputs: PricingInputs = await req.json();

    // Validate inputs
    if (!inputs.regionId || !inputs.estimatedLengthFeet || !inputs.complexity) {
      return NextResponse.json(
        { error: "Missing required pricing inputs" },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = await calculateJobPricing(inputs);

    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error("Pricing calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate pricing" },
      { status: 500 }
    );
  }
}
