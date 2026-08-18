import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import type { PricingResult } from "@/lib/pricing-engine";

interface PricingSummaryProps {
  pricing: PricingResult | null;
  loading?: boolean;
}

export function PricingSummary({ pricing, loading }: PricingSummaryProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Pricing Summary</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          Calculating...
        </div>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Pricing Summary</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          Fill out the form to see pricing
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Pricing Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Price:</span>
          <span className="font-medium">
            {formatCurrency(pricing.basePriceCents)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Complexity Addon:</span>
          <span className="font-medium">
            {formatCurrency(pricing.complexityAddonCents)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Options Addons:</span>
          <span className="font-medium">
            {formatCurrency(pricing.optionsAddonCents)}
          </span>
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">
              {formatCurrency(pricing.totalPriceCents)}
            </span>
          </div>
        </div>
        <div className="bg-muted/50 rounded-md p-3 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contractor Payout:</span>
            <span className="font-medium">
              {formatCurrency(pricing.contractorPayoutCents)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            (80% of total price)
          </p>
        </div>
      </div>
    </Card>
  );
}
