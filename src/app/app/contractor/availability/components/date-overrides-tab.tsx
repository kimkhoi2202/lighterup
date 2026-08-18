"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DateOverrideModal } from "@/components/app/date-override-modal";
import { format } from "date-fns";
import {
  useDeleteBlackoutMutation,
  type AvailabilityBlackout,
} from "@/store/api/availability-api";

interface DateOverridesTabProps {
  scheduleId: string;
  blackouts: AvailabilityBlackout[];
}

export function DateOverridesTab({ scheduleId, blackouts }: DateOverridesTabProps) {
  const [showDateOverrideModal, setShowDateOverrideModal] = useState(false);
  const [deleteBlackout] = useDeleteBlackoutMutation();

  async function handleDeleteBlackout(blackoutId: string) {
    try {
      await deleteBlackout({ scheduleId, blackoutId }).unwrap();
      toast.success("Blackout date removed");
    } catch (error: any) {
      console.error("Error deleting blackout:", error);
      toast.error(
        error?.data?.error || error?.message || "Failed to delete blackout"
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">Date Overrides</h3>
        <p className="text-sm text-muted-foreground">
          Add dates when your availability changes from your daily hours. Perfect for holidays,
          vacations, or special events.
        </p>
      </div>

      {/* Add Override Button */}
      <Button
        onClick={() => setShowDateOverrideModal(true)}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Date Override
      </Button>

      {/* Blackout Dates List */}
      {blackouts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <h4 className="font-semibold text-zinc-900">No date overrides</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't added any date overrides yet. Add dates when you're unavailable or
              have special availability.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">
            {blackouts.length} {blackouts.length === 1 ? "override" : "overrides"} set
          </p>
          <div className="space-y-2">
            {blackouts
              .sort((a, b) => new Date(a.blackout_date).getTime() - new Date(b.blackout_date).getTime())
              .map((blackout) => (
                <Card key={blackout.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">
                        {format(new Date(blackout.blackout_date), "EEEE, MMMM d, yyyy")}
                      </p>
                      {blackout.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {blackout.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {blackout.is_all_day ? "All day unavailable" : "Custom hours"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlackout(blackout.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Date Override Modal */}
      <DateOverrideModal
        open={showDateOverrideModal}
        onOpenChange={setShowDateOverrideModal}
        scheduleId={scheduleId}
        existingBlackouts={blackouts}
        onSuccess={() => {
          setShowDateOverrideModal(false);
        }}
      />
    </div>
  );
}

