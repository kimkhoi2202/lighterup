"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCreateBlackoutMutation } from "@/store/api/availability-api";

interface AvailabilityBlackout {
  id: string;
  schedule_id: string;
  blackout_date: string;
  reason: string | null;
  is_all_day: boolean;
}

interface DateOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  existingBlackouts: AvailabilityBlackout[];
  onSuccess: (newBlackouts: AvailabilityBlackout[]) => void;
}

export function DateOverrideModal({
  open,
  onOpenChange,
  scheduleId,
  existingBlackouts,
  onSuccess,
}: DateOverrideModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>([
    { start: "12:00", end: "02:00" },
  ]);
  const [isAllDay, setIsAllDay] = useState(false);
  const [createBlackout, { isLoading }] = useCreateBlackoutMutation();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const isSelected = selectedDates.some(
      (d) => format(d, "yyyy-MM-dd") === dateStr
    );

    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => format(d, "yyyy-MM-dd") !== dateStr));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  }

  function handleAddTimeSlot() {
    setTimeSlots([...timeSlots, { start: "10:00", end: "17:00" }]);
  }

  function handleRemoveTimeSlot(index: number) {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  }

  function handleTimeChange(index: number, field: "start" | "end", value: string) {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  }

  async function handleSave() {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }

    if (!isAllDay && timeSlots.length === 0) {
      toast.error("Please add at least one time slot or mark as all day unavailable");
      return;
    }

    try {
      const dates = selectedDates.map((d) => format(d, "yyyy-MM-dd"));

      // Create blackouts for each date
      const promises = dates.map((date) =>
        createBlackout({
          scheduleId,
          data: {
            blackout_date: date,
            reason: isAllDay ? "Unavailable" : undefined,
          },
        }).unwrap()
      );

      await Promise.all(promises);
      toast.success(`${dates.length} date override${dates.length > 1 ? "s" : ""} added`);
      
      // Reset form
      setSelectedDates([]);
      setTimeSlots([{ start: "12:00", end: "02:00" }]);
      setIsAllDay(false);
      
      // Fetch updated blackouts (will be done automatically by RTK Query)
      onSuccess([]);
    } catch (error: any) {
      console.error("Error creating blackouts:", error);
      toast.error(error?.data?.error || error?.message || "Failed to create date overrides");
    }
  }

  // Get disabled dates (already have blackouts)
  const disabledDates = existingBlackouts.map((b) => new Date(b.blackout_date));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Date Override</DialogTitle>
          <DialogDescription>
            Select dates when your availability changes from your daily hours.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left: Calendar */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Select the dates to override
              </Label>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates) {
                    const dateArray = Array.isArray(dates) ? dates : dates ? [dates] : [];
                    setSelectedDates(dateArray);
                  } else {
                    setSelectedDates([]);
                  }
                }}
                disabled={(date) => {
                  // Disable dates that already have blackouts
                  return disabledDates.some(
                    (disabledDate) =>
                      format(disabledDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                  );
                }}
                className="rounded-md border"
              />
              {selectedDates.length > 0 && (
                <div className="mt-2 text-sm text-zinc-600">
                  {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} selected
                </div>
              )}
            </div>
          </div>

          {/* Right: Time Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Which hours are you free?
              </Label>

              {!isAllDay && (
                <div className="space-y-2">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => handleTimeChange(index, "start", e.target.value)}
                        className="w-32"
                        step="300"
                      />
                      <span className="text-zinc-500">to</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => handleTimeChange(index, "end", e.target.value)}
                        className="w-32"
                        step="300"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTimeSlot(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimeSlot}
                    className="w-full"
                  >
                    + Add Time
                  </Button>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Switch
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                />
                <Label>Mark unavailable (All day)</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isLoading || selectedDates.length === 0}>
            {isLoading ? "Saving..." : "Save Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

