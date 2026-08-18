import { baseApi } from "./base-api";

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

export const pricingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    calculatePricing: builder.mutation<PricingResult, PricingInputs>({
      query: (inputs) => ({
        url: "/pricing/calculate",
        method: "POST",
        body: inputs,
      }),
      // No cache tags needed - this is a calculation endpoint
    }),
  }),
});

export const { useCalculatePricingMutation } = pricingApi;

