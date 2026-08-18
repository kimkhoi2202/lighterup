"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface DatePickerProps {
  selectedDate: string | null; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  timezone: string;
  dateStatuses: Record<string, "available" | "unavailable" | "unknown">;
  onMonthChange?: (month: dayjs.Dayjs) => void;
}

/**
 * DatePicker - Month view calendar for selecting booking dates
 * 
 * Features:
 * - Month navigation
 * - Highlights available dates
 * - Disables past dates and dates without availability
 * - Shows selected date
 */
export function DatePicker({
  selectedDate,
  onDateSelect,
  timezone,
  dateStatuses,
  onMonthChange,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs().tz(timezone));

  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  const startDate = startOfMonth.startOf("week"); // Start from Sunday
  const endDate = endOfMonth.endOf("week"); // End on Saturday

  // Generate calendar days
  const calendarDays: dayjs.Dayjs[] = [];
  let day = startDate;
  while (day.isBefore(endDate) || day.isSame(endDate, "day")) {
    calendarDays.push(day);
    day = day.add(1, "day");
  }

  const today = dayjs().tz(timezone);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    
    // Don't allow past dates
    if (date.isBefore(today, "day")) return;
    
    const status = getAvailabilityStatus(date);
    if (status !== "available") return;

    onDateSelect(dateStr);
  };

  const getAvailabilityStatus = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return dateStatuses[dateStr] || "unknown";
  };
  useEffect(() => {
    onMonthChange?.(currentMonth);
  }, [currentMonth, onMonthChange]);


  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-gray-900">{currentMonth.format("MMMM YYYY")}</h3>
        <Button variant="ghost" size="icon-sm" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="py-1.5 text-center text-xs font-medium text-gray-500">
            {day.charAt(0)}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date) => {
          const dateStr = date.format("YYYY-MM-DD");
          const isCurrentMonth = date.month() === currentMonth.month();
          const isToday = date.isSame(today, "day");
          const isSelected = selectedDate === dateStr;
          const isPast = date.isBefore(today, "day");
          const availabilityStatus = getAvailabilityStatus(date);
          const isAvailable = availabilityStatus === "available";
          const isUnavailable = availabilityStatus === "unavailable";
          const isUnknown = availabilityStatus === "unknown";
          const isFuture = date.isAfter(today, "day");
          const showSelectedState = isSelected && !isUnavailable;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(date)}
              disabled={isPast || isUnavailable || isUnknown}
              className={`
                relative flex aspect-square items-center justify-center rounded-md border-2 border-transparent text-sm font-medium transition-all
                ${isPast ? "cursor-default text-gray-300 font-light" : ""}
                ${!isPast && isUnavailable ? "cursor-default text-gray-400 font-light" : ""}
                ${isAvailable && !isPast && !showSelectedState ? "bg-[#F5E9EA] text-gray-900 hover:border-[#EA2831]" : ""}
                ${isUnknown && !isPast ? "cursor-wait text-gray-400" : ""}
                ${showSelectedState ? "bg-[#EA2831] text-white border-transparent" : ""}
                ${!isCurrentMonth && !isFuture && "text-gray-300 font-light"}
              `}>
              {date.date()}
              {/* Today indicator */}
              {isToday && (
                <span
                  className={`absolute left-1/2 top-1/2 flex h-[5px] w-[5px] -translate-x-1/2 translate-y-[10px] items-center justify-center rounded-full sm:translate-y-[14px] ${
                    isSelected ? "bg-white" : "bg-[#EA2831]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

