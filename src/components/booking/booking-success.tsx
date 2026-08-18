"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Download, ExternalLink } from "lucide-react";
import { downloadIcsFile, type CalendarEventDetails } from "@/lib/calendar-links";

interface BookingSuccessProps {
  booking: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    eventTitle: string;
    contractorName: string;
    locationType: "phone" | "physical";
    locationDetails: string;
  };
  bookerName: string;
  bookerEmail: string;
  googleCalendarUrl: string;
  icsContent: string;
  onDone: () => void;
}

/**
 * BookingSuccess - Confirmation screen after successful booking
 * 
 * Shows:
 * - Success message with booking details
 * - "Add to Google Calendar" button
 * - "Download .ics" button for other calendars
 * - Done button
 */
export function BookingSuccess({
  booking,
  bookerName,
  bookerEmail,
  googleCalendarUrl,
  icsContent,
  onDone,
}: BookingSuccessProps) {
  // Format date/time for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDownloadIcs = () => {
    // Create and download ICS file from the content provided by API
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${booking.eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenGoogleCalendar = () => {
    window.open(googleCalendarUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Success Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Booking Confirmed!</h2>
        <p className="text-sm text-zinc-500">
          Your appointment has been scheduled. A confirmation email will be sent to{" "}
          <span className="font-medium text-zinc-700">{bookerEmail}</span>.
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-left space-y-4">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">What</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{booking.eventTitle}</p>
          <p className="text-sm text-zinc-600">with {booking.contractorName}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">When</p>
          <p className="mt-1 text-sm text-zinc-900">
            {formatDate(booking.scheduledDate)}
          </p>
          <p className="text-sm text-zinc-600">
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)} ({booking.duration} min)
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Where</p>
          <p className="mt-1 text-sm text-zinc-900">
            {booking.locationType === "phone" ? "Phone Call" : "In Person"}
          </p>
          {booking.locationDetails && (
            <p className="text-sm text-zinc-600">{booking.locationDetails}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Who</p>
          <p className="mt-1 text-sm text-zinc-900">{bookerName}</p>
          <p className="text-sm text-zinc-600">{bookerEmail}</p>
        </div>
      </div>

      {/* Add to Calendar Buttons */}
      <div className="w-full max-w-md space-y-3">
        <p className="text-sm font-medium text-zinc-700">Add to your calendar</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleOpenGoogleCalendar}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Google Calendar
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadIcs}
          >
            <Download className="mr-2 h-4 w-4" />
            Download .ics
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          .ics files work with Apple Calendar, Outlook, and other calendar apps
        </p>
      </div>

      {/* Done Button */}
      <Button className="w-full max-w-md" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

