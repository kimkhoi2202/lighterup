"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Info } from "lucide-react";
import { toast } from "sonner";

// Validation schema
const limitsSchema = z.object({
  bufferBeforeMinutes: z.number().min(0).max(180),
  bufferAfterMinutes: z.number().min(0).max(180),
  minimumNoticeValue: z.number().min(0),
  minimumNoticeUnit: z.enum(["hours", "days"]),
  slotIntervalMinutes: z
    .number()
    .min(5, { message: "Time-slot interval must be at least 5 minutes" })
    .max(480, { message: "Time-slot interval cannot exceed 8 hours" }),
  limitFutureBookings: z.boolean(),
  futureBookingValue: z.number().min(1).max(365),
  futureBookingType: z.enum(["rolling", "date_range"]),
  alwaysAvailable: z.boolean(),
  // For date range (future use)
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type LimitsFormData = z.infer<typeof limitsSchema>;

interface LimitsBuffersTabProps {
  contractorId: string;
  initialData?: {
    buffer_before_minutes?: number;
    buffer_after_minutes?: number;
    minimum_notice_hours?: number;
    slot_interval_minutes?: number;
    future_booking_days?: number;
  };
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface LimitsBuffersTabHandle {
  save: () => Promise<void>;
}

export const LimitsBuffersTab = forwardRef<LimitsBuffersTabHandle, LimitsBuffersTabProps>(
  ({ contractorId, initialData, onDirtyChange }, ref) => {
  const [saving, setSaving] = useState(false);

  // Convert initial data to form format
  const getInitialMinimumNotice = () => {
    const hours = initialData?.minimum_notice_hours || 48;
    if (hours >= 24 && hours % 24 === 0) {
      return { value: hours / 24, unit: "days" as const };
    }
    return { value: hours, unit: "hours" as const };
  };

  const initialMinimumNotice = getInitialMinimumNotice();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LimitsFormData>({
    resolver: zodResolver(limitsSchema),
    defaultValues: {
      bufferBeforeMinutes: initialData?.buffer_before_minutes || 30,
      bufferAfterMinutes: initialData?.buffer_after_minutes || 30,
      minimumNoticeValue: initialMinimumNotice.value,
      minimumNoticeUnit: initialMinimumNotice.unit,
      slotIntervalMinutes: initialData?.slot_interval_minutes || 60,
      limitFutureBookings: true,
      futureBookingValue: initialData?.future_booking_days || 60,
      futureBookingType: "rolling",
      alwaysAvailable: true,
    },
  });

  const limitFutureBookings = watch("limitFutureBookings");
  const futureBookingType = watch("futureBookingType");

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  async function onSubmit(data: LimitsFormData) {
    setSaving(true);

    try {
      // Convert minimum notice to hours
      const minimumNoticeHours =
        data.minimumNoticeUnit === "days"
          ? data.minimumNoticeValue * 24
          : data.minimumNoticeValue;

      const payload = {
        buffer_before_minutes: data.bufferBeforeMinutes,
        buffer_after_minutes: data.bufferAfterMinutes,
        minimum_notice_hours: minimumNoticeHours,
        slot_interval_minutes: data.slotIntervalMinutes,
        future_booking_days: data.futureBookingValue,
      };

      const response = await fetch("/api/contractor/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      await handleSubmit(onSubmit)();
    },
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Buffer Times Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Buffer Times</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add time between jobs for travel and preparation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Event */}
            <div className="space-y-2">
              <Label htmlFor="buffer-before">Before Event</Label>
              <Select
                value={watch("bufferBeforeMinutes").toString()}
                onValueChange={(value) => setValue("bufferBeforeMinutes", parseInt(value), { shouldDirty: true })}
              >
                <SelectTrigger id="buffer-before">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Travel time to the job site
              </p>
            </div>

            {/* After Event */}
            <div className="space-y-2">
              <Label htmlFor="buffer-after">After Event</Label>
              <Select
                value={watch("bufferAfterMinutes").toString()}
                onValueChange={(value) => setValue("bufferAfterMinutes", parseInt(value), { shouldDirty: true })}
              >
                <SelectTrigger id="buffer-after">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cleanup and travel back
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Minimum Notice Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Minimum Notice</h3>
            <p className="text-sm text-muted-foreground mt-1">
              How far in advance must customers book
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="min-notice-value" className="flex-1">Notice Required</Label>
              <Label htmlFor="min-notice-unit" className="w-32">Unit</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="min-notice-value"
                type="number"
                min="0"
                {...register("minimumNoticeValue")}
                className="flex-1"
              />
              <Select
                value={watch("minimumNoticeUnit")}
                onValueChange={(value: "hours" | "days") => setValue("minimumNoticeUnit", value, { shouldDirty: true })}
              >
                <SelectTrigger id="min-notice-unit" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {errors.minimumNoticeValue && (
            <p className="text-sm text-red-600">{errors.minimumNoticeValue.message}</p>
          )}
        </div>
      </Card>

      {/* Time-slot Intervals Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Time-slot Intervals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Duration between available time slots
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-interval">Interval (minutes)</Label>
            <Input
              id="slot-interval"
              type="number"
              min={5}
              max={480}
              step={5}
              {...register("slotIntervalMinutes", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Enter any interval in minutes. Most teams use 15, 30, or 60 minutes depending on job length.
            </p>
            {errors.slotIntervalMinutes && (
              <p className="text-sm text-red-600">{errors.slotIntervalMinutes.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Future Bookings Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Limit Future Bookings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Limit how far in advance customers can book
              </p>
            </div>
            <Switch
              checked={limitFutureBookings}
              onCheckedChange={(checked) => setValue("limitFutureBookings", checked, { shouldDirty: true })}
            />
          </div>

          {limitFutureBookings && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="future-booking-value">Booking Window</Label>
                  <Input
                    id="future-booking-value"
                    type="number"
                    min="1"
                    max="365"
                    {...register("futureBookingValue")}
                  />
                </div>
                <div className="text-sm text-muted-foreground pb-2">
                  calendar days into the future
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="always-available"
                  checked={watch("alwaysAvailable")}
                  onCheckedChange={(checked) => setValue("alwaysAvailable", checked as boolean, { shouldDirty: true })}
                />
                <Label htmlFor="always-available" className="text-sm font-normal flex items-center gap-1">
                  Always <span className="font-medium">{watch("futureBookingValue")}</span> days available
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
              </div>

              <RadioGroup
                value={futureBookingType}
                onValueChange={(value: "rolling" | "date_range") => setValue("futureBookingType", value, { shouldDirty: true })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rolling" id="rolling" />
                  <Label htmlFor="rolling" className="font-normal">
                    Rolling window (always {watch("futureBookingValue")} days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date_range" id="date_range" disabled />
                  <Label htmlFor="date_range" className="font-normal text-muted-foreground">
                    Within a date range (coming soon)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      </Card>
    </form>
  );
});

LimitsBuffersTab.displayName = "LimitsBuffersTab";
