"use client";

import { Card } from "@/components/ui/card";

export default function EarningsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Track your income and analytics
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No earnings data yet</p>
          <p className="text-sm mt-2">
            Complete jobs to start tracking your income and performance
          </p>
        </div>
      </Card>
    </div>
  );
}
