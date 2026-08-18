"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * TimeSelect - A time picker using native input type="time"
 * 
 * Uses native browser time input with hidden picker indicator for:
 * - Consistent sizing
 * - Better UX with typed input support
 * - Simpler implementation
 */

interface TimeSelectProps {
  value: string; // HH:mm format (24-hour)
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Minimum time (HH:mm) - browser enforces this */
  min?: string;
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  className,
  min,
}: TimeSelectProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      min={min}
      step="900" // 15 minute increments
      className={cn(
        "w-[110px] bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
        className
      )}
    />
  );
}
