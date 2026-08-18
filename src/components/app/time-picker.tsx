"use client";

import { Input } from "@/components/ui/input";
import { format, parse } from "date-fns";

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  // Convert HH:mm to display format (h:mm AM/PM)
  function formatDisplayTime(time: string): string {
    if (!time) return "";
    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch {
      return time;
    }
  }

  // Convert display format back to HH:mm
  function parseDisplayTime(displayTime: string): string {
    if (!displayTime) return "";
    try {
      const parsed = parse(displayTime, "h:mm a", new Date());
      return format(parsed, "HH:mm");
    } catch {
      // If parsing fails, try to parse as HH:mm directly
      if (/^\d{1,2}:\d{2}$/.test(displayTime)) {
        const [hours, minutes] = displayTime.split(":");
        const h = parseInt(hours).toString().padStart(2, "0");
        const m = parseInt(minutes).toString().padStart(2, "0");
        return `${h}:${m}`;
      }
      return displayTime;
    }
  }

  const displayValue = formatDisplayTime(value);

  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-32"
      step="300" // 5 minute increments
    />
  );
}

