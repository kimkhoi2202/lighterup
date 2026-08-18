"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TimeFormatToggle } from "./time-format-toggle";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface TimeSlot {
  time: string; // ISO string
  // Note: All returned slots are available (filtering done server-side)
}

interface AvailableTimeSlotsProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  timezone: string;
  loading?: boolean;
  date: string; // YYYY-MM-DD
  timeFormat?: "12h" | "24h";
  onTimeFormatChange?: (format: "12h" | "24h") => void;
}

/**
 * AvailableTimeSlots - Displays a list of available time slots for a selected date
 * 
 * Features:
 * - Shows time slots in user's timezone
 * - Highlights selected slot
 * - Loading state
 * - Empty state when no slots available
 */
export function AvailableTimeSlots({
  slots,
  selectedSlot,
  onSlotSelect,
  timezone,
  loading = false,
  date,
  timeFormat = "12h",
  onTimeFormatChange,
}: AvailableTimeSlotsProps) {
  const formatTime = (isoString: string) => {
    const format = timeFormat === "12h" ? "h:mm A" : "HH:mm";
    return dayjs(isoString).tz(timezone).format(format);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#EA2831]" />
        <p className="mt-2 text-xs text-zinc-500">Loading times...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-900">No times available</p>
        <p className="mt-1 text-xs text-zinc-500">Please select a different date</p>
      </div>
    );
  }

  // Get the actual selected date, not the current date
  const selectedDateFormatted = dayjs(date).tz(timezone);

  return (
    <div className="flex h-full flex-col">
      {/* Header with date and time format toggle - Cal.com style */}
      <header className="mb-3 flex w-full flex-row items-center font-medium">
        <span className="text-sm font-semibold text-zinc-900">
          {selectedDateFormatted.format("dddd, MMMM D, YYYY")}
        </span>
        {onTimeFormatChange && (
          <div className="ml-auto">
            <TimeFormatToggle value={timeFormat} onChange={onTimeFormatChange} />
          </div>
        )}
      </header>

      <div className="grid flex-1 auto-rows-max grid-cols-2 gap-2 overflow-y-auto pr-1">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.time;
          return (
            <button
              key={slot.time}
              onClick={() => onSlotSelect(slot.time)}
              className={`
                rounded-md border px-3 py-2 text-sm font-medium transition-all
                ${
                  isSelected
                    ? "border-[#EA2831] bg-[#EA2831] text-white hover:bg-[#d42329]"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }
              `}>
              {formatTime(slot.time)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

