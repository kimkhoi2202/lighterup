import { supabaseAdmin } from "./supabase-admin";

export interface PricingInputs {
  regionId: string;
  estimatedLengthFeet: number;
  complexity: "simple" | "medium" | "complex";
  lightsProvided: boolean;
  storageNeeded: boolean;
  tipAmountCents?: number;
}

export interface PricingResult {
  basePriceCents: number;
  complexityAddonCents: number;
  optionsAddonCents: number;
  totalPriceCents: number;
  contractorPayoutCents: number;
}

export async function calculateJobPricing(
  inputs: PricingInputs
): Promise<PricingResult> {
  // Fetch region pricing data
  const { data: region, error } = await supabaseAdmin
    .from("regions")
    .select("*")
    .eq("id", inputs.regionId)
    .single();

  if (error || !region) {
    throw new Error("Region not found");
  }

  // Calculate base price
  const basePriceCents =
    inputs.estimatedLengthFeet * (region.labor_rate_per_foot_cents ?? 0);

  // Calculate complexity addon
  let complexityAddonCents = 0;
  switch (inputs.complexity) {
    case "simple":
      complexityAddonCents = region.complexity_simple_cents ?? 0;
      break;
    case "medium":
      complexityAddonCents = region.complexity_medium_cents ?? 0;
      break;
    case "complex":
      complexityAddonCents = region.complexity_complex_cents ?? 0;
      break;
  }

  // Calculate options addons
  let optionsAddonCents = 0;
  if (inputs.lightsProvided) {
    optionsAddonCents += region.lights_provided_addon_cents ?? 0;
  }
  if (inputs.storageNeeded) {
    optionsAddonCents += region.storage_addon_cents ?? 0;
  }

  // Calculate total
  const subtotalCents =
    basePriceCents + complexityAddonCents + optionsAddonCents;

  const tipCents = inputs.tipAmountCents || 0;
  const totalPriceCents = subtotalCents + tipCents;

  // Calculate contractor payout (80%)
  const contractorPayoutCents = Math.floor(totalPriceCents * 0.8);

  return {
    basePriceCents,
    complexityAddonCents,
    optionsAddonCents,
    totalPriceCents,
    contractorPayoutCents,
  };
}
