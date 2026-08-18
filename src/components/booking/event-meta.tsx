"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, MapPin, DollarSign, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocationSettings } from "@/lib/location-settings";

interface EventMetaProps {
  contractor: {
    id: string;
    name: string;
    businessName?: string | null;
    avatarUrl?: string | null;
    tagline?: string | null;
    bio?: string | null;
  };
  eventType: {
    title: string;
    description?: string;
    durationMinutes: number;
    locationSettings: LocationSettings;
    priceCents: number;
    currency: string;
  };
  timezone: string;
  selectedTimeslot?: string | null;
  onTimezoneChange?: (timezone: string) => void;
}

/**
 * EventMeta - Left panel of the booking page (Cal.com style)
 * 
 * Displays:
 * - Contractor name/avatar
 * - Event title and description
 * - Duration
 * - Selected time (if any)
 * - Location options
 * - Price (if any)
 * - Timezone selector
 */
export function EventMeta({
  contractor,
  eventType,
  timezone,
  selectedTimeslot,
  onTimezoneChange,
}: EventMetaProps) {
  const [localTimezone, setLocalTimezone] = useState(timezone);
  const COMMON_TIMEZONES = useMemo(
    () => [
      { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles" },
      { label: "Mountain Time (US & Canada)", value: "America/Denver" },
      { label: "Central Time (US & Canada)", value: "America/Chicago" },
      { label: "Eastern Time (US & Canada)", value: "America/New_York" },
      { label: "Atlantic Time (Canada)", value: "America/Halifax" },
      { label: "Hawaii–Aleutian Time", value: "Pacific/Honolulu" },
      { label: "Western European Time", value: "Europe/London" },
      { label: "Central European Time", value: "Europe/Berlin" },
      { label: "Eastern European Time", value: "Europe/Bucharest" },
      { label: "Japan Standard Time", value: "Asia/Tokyo" },
      { label: "India Standard Time", value: "Asia/Kolkata" },
      { label: "Gulf Standard Time", value: "Asia/Dubai" },
      { label: "Australian Eastern Time", value: "Australia/Sydney" },
      { label: "Brazil Time", value: "America/Sao_Paulo" },
      { label: "South Africa Standard Time", value: "Africa/Johannesburg" },
    ],
    []
  );

  // Sync with external timezone changes
  useEffect(() => {
    setLocalTimezone(timezone);
  }, [timezone]);

  const handleTimezoneChange = (newTimezone: string) => {
    setLocalTimezone(newTimezone);
    onTimezoneChange?.(newTimezone);
  };
  const formatTimezoneLabel = (tz: string) => tz.replace(/_/g, " ");

  const timezoneOptions = useMemo(() => {
    const existing = new Set(COMMON_TIMEZONES.map((tz) => tz.value));
    return existing.has(localTimezone)
      ? COMMON_TIMEZONES
      : [{ label: formatTimezoneLabel(localTimezone), value: localTimezone }, ...COMMON_TIMEZONES];
  }, [COMMON_TIMEZONES, localTimezone]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatLocationOptions = (settings: LocationSettings) => {
    const locations: string[] = [];
    if (settings.phone.enabled) {
      locations.push("Phone Call");
    }
    if (settings.physical.enabled) {
      locations.push("Physical Location");
    }
    return locations.join(", ");
  };

  return (
    <div className="flex h-full w-full flex-col p-5">
      {/* Contractor Info */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          {contractor.avatarUrl ? (
            <img
              src={contractor.avatarUrl}
              alt={contractor.name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EA2831] to-[#d42329] text-sm font-semibold text-white">
              {contractor.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{contractor.name}</p>
            {contractor.businessName && (
              <p className="truncate text-xs text-zinc-500">{contractor.businessName}</p>
            )}
          </div>
        </div>

        {/* Tagline */}
        {contractor.tagline && (
          <p className="text-sm italic text-zinc-500">{contractor.tagline}</p>
        )}

        {/* Event Title */}
        <h1 className="text-lg font-semibold leading-tight text-zinc-900">{eventType.title}</h1>

        {/* Event Description */}
        {eventType.description && (
          <p className="text-sm leading-relaxed text-zinc-600">{eventType.description}</p>
        )}

        {/* Bio excerpt */}
        {contractor.bio && (
          <p className="text-xs leading-relaxed text-zinc-500 line-clamp-3">{contractor.bio}</p>
        )}
      </div>

      {/* Event Details */}
      <div className="space-y-4 border-t border-zinc-100 pt-4">
        {/* Duration */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
          <p className="text-sm text-zinc-700">{formatDuration(eventType.durationMinutes)}</p>
        </div>

        {/* Location Options */}
        {(eventType.locationSettings.phone.enabled || eventType.locationSettings.physical.enabled) && (
          <div className="flex flex-col gap-2 text-sm text-zinc-700">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
              <p>{formatLocationOptions(eventType.locationSettings)}</p>
            </div>
            {eventType.locationSettings.phone.enabled &&
              eventType.locationSettings.phone.hostProvidesNumber &&
              eventType.locationSettings.phone.hostPhoneNumber && (
                <div className="ml-7 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                  We&apos;ll call you from{" "}
                  <span className="font-medium text-zinc-800">
                    {eventType.locationSettings.phone.hostPhoneNumber}
                  </span>
                </div>
              )}
            {eventType.locationSettings.physical.enabled &&
              eventType.locationSettings.physical.instructions && (
                <div className="ml-7 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                  {eventType.locationSettings.physical.instructions}
                </div>
              )}
          </div>
        )}

        {/* Timezone - Cal.com style with hover effect */}
        <div className="flex items-start gap-3 cursor-pointer [&_.current-timezone:before]:focus-within:opacity-100 [&_.current-timezone:before]:hover:opacity-100">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div className="relative min-w-0 flex-1 max-w-[90%]">
            <span className="current-timezone pointer-events-none before:bg-zinc-100 flex min-w-32 -mt-[2px] h-6 max-w-full items-center justify-start before:absolute before:inset-0 before:bottom-[-3px] before:left-[-30px] before:top-[-3px] before:w-[calc(100%+35px)] before:rounded-md before:py-3 before:opacity-0 before:transition-opacity">
              <Select value={localTimezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger className="pointer-events-auto h-auto w-auto min-w-0 border-0 bg-transparent px-1 py-0.5 -mx-1 rounded-md text-sm text-zinc-900 shadow-none transition-colors hover:bg-zinc-100 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
                  <SelectValue placeholder="Select timezone">
                    {formatTimezoneLabel(localTimezone)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72 w-[260px]">
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-sm">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </div>
        </div>

        {/* Price */}
        {eventType.priceCents > 0 && (
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 shrink-0 text-zinc-400" />
            <p className="text-sm text-zinc-700">
              {formatPrice(eventType.priceCents, eventType.currency)}
            </p>
          </div>
        )}
      </div>

      {/* Selected Timeslot (if any) */}
      {selectedTimeslot && (
        <div className="mt-6 rounded-md border border-[#EA2831]/20 bg-[#EA2831]/5 p-3">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#EA2831]" />
            <div>
              <p className="text-xs font-medium text-zinc-900">Selected Time</p>
              <p className="mt-1 text-xs text-zinc-600">
                {new Date(selectedTimeslot).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: timezone,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

