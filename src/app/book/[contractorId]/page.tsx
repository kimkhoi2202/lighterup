"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StickyBox from "react-sticky-box";
import { EventMeta } from "@/components/booking/event-meta";
import { DatePicker } from "@/components/booking/date-picker";
import { AvailableTimeSlots } from "@/components/booking/available-time-slots";
import { BookingForm, type BookingFormValues } from "@/components/booking/booking-form";
import { BookingSuccess } from "@/components/booking/booking-success";
import { DatePickerSkeleton, EventMetaSkeleton, TimeSlotsSkeleton } from "@/components/booking/booking-skeletons";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { LocationSettings } from "@/lib/location-settings";

dayjs.extend(utc);
dayjs.extend(timezone);

interface BookingConfig {
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
}

interface TimeSlot {
  time: string;
}

// Batch API response format (Cal.com style)
interface BatchSlotsResponse {
  slots: Record<string, TimeSlot[]>;
  timezone: string;
}

type BookingStage = "selecting" | "form" | "confirmation" | "success";

// Booking API response type
interface BookingResult {
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
  calendarLinks: {
    googleCalendarUrl: string;
    icsContent: string;
  };
}

/**
 * Booking Page - Cal.com style booking interface
 * 
 * Optimized to fetch availability for entire date ranges in a single API call,
 * dramatically reducing load time from ~10s to ~1s.
 * 
 * Layout:
 * - Left: EventMeta (contractor info, event details)
 * - Center: DatePicker (month view calendar)
 * - Right: AvailableTimeSlots (time selection)
 */
export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractorId = params.contractorId as string;
  const jobId = searchParams.get("jobId");

  // User's timezone (detected from browser, but changeable)
  const [userTimezone, setUserTimezone] = useState(() => 
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  // Booking config state
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState<string | null>(null);
  const [bookingStage, setBookingStage] = useState<BookingStage>("selecting");
  const [formValues, setFormValues] = useState<BookingFormValues | null>(null);

  // Booking submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Slots cache: stores all fetched slots by date (Cal.com style)
  const [slotsCache, setSlotsCache] = useState<Record<string, TimeSlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Track which months have been fetched to avoid duplicate requests
  const fetchedMonthsRef = useRef<Set<string>>(new Set());

  // Derive date statuses from slots cache
  // Dates with slots = available, dates without = unavailable
  const dateStatuses = useCallback(() => {
    const statuses: Record<string, "available" | "unavailable" | "unknown"> = {};
    for (const [date, slots] of Object.entries(slotsCache)) {
      statuses[date] = slots.length > 0 ? "available" : "unavailable";
    }
    return statuses;
  }, [slotsCache])();

  /**
   * Fetch availability for a date range using the batch endpoint
   * This replaces the old per-day prefetch approach with a single API call
   */
  const fetchBatchAvailability = useCallback(
    async (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
      if (!contractorId) return;

      const startStr = startDate.format("YYYY-MM-DD");
      const endStr = endDate.format("YYYY-MM-DD");

      try {
        const response = await fetch(
          `/api/booking/${contractorId}/slots?startDate=${startStr}&endDate=${endStr}&timezone=${userTimezone}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data: BatchSlotsResponse = await response.json();
        
        // Merge new slots into cache
        setSlotsCache((prev) => ({
          ...prev,
          ...data.slots,
        }));
      } catch (error) {
        console.error("Error fetching batch availability:", error);
        setSlotsError(error instanceof Error ? error.message : "Failed to load availability");
      }
    },
    [contractorId, userTimezone]
  );

  /**
   * Fetch availability for the current month and surrounding months
   * Only fetches months that haven't been fetched yet
   */
  const fetchMonthsAvailability = useCallback(
    async (centerMonth: dayjs.Dayjs) => {
      // Determine which months to fetch (previous, current, next)
      const monthsToFetch = [
        centerMonth.subtract(1, "month").startOf("month"),
        centerMonth.startOf("month"),
        centerMonth.add(1, "month").startOf("month"),
      ];

      // Filter out already fetched months
      const unfetchedMonths = monthsToFetch.filter((m) => {
        const key = m.format("YYYY-MM");
        return !fetchedMonthsRef.current.has(key);
      });

      if (unfetchedMonths.length === 0) return;

      // Mark months as fetched (before the request to prevent duplicates)
      unfetchedMonths.forEach((m) => {
        fetchedMonthsRef.current.add(m.format("YYYY-MM"));
      });

      // Calculate the full date range to fetch
      const startDate = unfetchedMonths[0];
      const endDate = unfetchedMonths[unfetchedMonths.length - 1].endOf("month");

      setLoadingSlots(true);
      await fetchBatchAvailability(startDate, endDate);
      setLoadingSlots(false);
    },
    [fetchBatchAvailability]
  );

  // Fetch booking configuration on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true);
        setConfigError(null);

        const response = await fetch(`/api/booking/${contractorId}/config`);
        
        if (!response.ok) {
          throw new Error("Failed to load booking configuration");
        }

        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Error fetching config:", error);
        setConfigError(error instanceof Error ? error.message : "Failed to load booking page");
      } finally {
        setLoadingConfig(false);
      }
    }

    fetchConfig();
  }, [contractorId]);

  // Reset cache when contractor or timezone changes
  useEffect(() => {
    fetchedMonthsRef.current.clear();
    setSlotsCache({});
  }, [contractorId, userTimezone]);

  // Fetch initial availability when config is loaded
  useEffect(() => {
    if (!config) return;
    
    const initialMonth = dayjs().tz(userTimezone).startOf("month");
    fetchMonthsAvailability(initialMonth);
  }, [config, userTimezone, fetchMonthsAvailability]);

  // Handle month navigation - fetch additional months as needed
  const handleMonthChange = useCallback(
    (month: dayjs.Dayjs) => {
      fetchMonthsAvailability(month.startOf("month"));
    },
    [fetchMonthsAvailability]
  );

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeslot(null);
    setFormValues(null);
    setBookingStage("selecting");
  };

  // Handle time slot selection
  const handleTimeslotSelect = (time: string) => {
    if (!selectedDate || dateStatuses[selectedDate] !== "available") return;
    setSelectedTimeslot(time);
    setFormValues(null);
    setBookingStage("form");
  };

  // Handle form submission
  const handleFormSubmit = (values: BookingFormValues) => {
    setFormValues(values);
    setBookingStage("confirmation");
  };

  const handleBackToForm = () => {
    setBookingStage("form");
  };

  const handleBackToSelection = () => {
    setBookingStage("selecting");
    setSelectedTimeslot(null);
    setFormValues(null);
  };

  // Handle booking confirmation (API call)
  const handleConfirmBooking = async () => {
    if (!selectedTimeslot || !formValues) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/booking/${contractorId}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeslot: selectedTimeslot,
          fullName: formValues.fullName,
          email: formValues.email,
          phone: formValues.inviteePhone,
          notes: formValues.notes,
          locationType: formValues.locationType,
          address: formValues.address,
          timezone: userTimezone,
          // Pass job ID if coming from homeowner job creation flow
          jobId: jobId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingResult(data);
      setBookingStage("success");
    } catch (error) {
      console.error("Booking error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle done from success screen
  const handleDone = () => {
    // Reset to initial state for a new booking
    setSelectedDate(null);
    setSelectedTimeslot(null);
    setFormValues(null);
    setBookingResult(null);
    setBookingStage("selecting");
  };

  // Clear selection if selected date becomes unavailable
  useEffect(() => {
    if (selectedDate && dateStatuses[selectedDate] === "unavailable") {
      setSelectedDate(null);
      setSelectedTimeslot(null);
      setFormValues(null);
      setBookingStage("selecting");
    }
  }, [selectedDate, dateStatuses]);

  // Get slots for the selected date from cache
  const selectedDateSlots = selectedDate ? (slotsCache[selectedDate] || []) : [];

  // Loading state
  if (loadingConfig) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50">
        <div
          className="grid w-full max-w-[1200px] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
          style={{
            gridTemplateColumns: "320px 1fr",
            gridTemplateAreas: `"meta main"`,
            height: "calc(100vh - 100px)",
            maxHeight: "900px",
          }}>
          <div className="relative flex [grid-area:meta]">
            <EventMetaSkeleton />
          </div>
          <div className="border-l border-zinc-200 [grid-area:main]">
            <div className="flex h-full">
              <div className="flex w-[420px] flex-col border-r border-zinc-200 px-5 py-4">
                <DatePickerSkeleton />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
                <TimeSlotsSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (configError || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-zinc-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Unable to Load</h3>
              <p className="text-sm text-zinc-500">
                {configError || "This booking page could not be found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50">
      <div
        className="bg-white grid w-full max-w-[1200px] overflow-hidden rounded-md border border-zinc-200 shadow-sm"
        style={{
          gridTemplateColumns: "320px 1fr",
          gridTemplateAreas: `"meta main"`,
          height: "calc(100vh - 100px)",
          maxHeight: "900px",
        }}>
        {/* Left Panel - Event Meta (Sticky) */}
        <div className="relative flex [grid-area:meta]">
          <StickyBox className="flex w-full flex-col">
            <div className="flex h-full w-full flex-col overflow-y-auto">
              <EventMeta
                contractor={config.contractor}
                eventType={config.eventType}
                timezone={userTimezone}
                selectedTimeslot={selectedTimeslot}
                onTimezoneChange={setUserTimezone}
              />
            </div>
          </StickyBox>
        </div>

        {/* Right Panel - Date & Time Selection */}
        <div className="border-l border-zinc-200 overflow-hidden [grid-area:main]">
          <AnimatePresence mode="wait">
            {bookingStage === "selecting" && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full">
                {/* Date Picker Column */}
                <div className="flex w-[420px] flex-col border-r border-zinc-200 px-5 py-4">
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    timezone={userTimezone}
                    dateStatuses={dateStatuses}
                    onMonthChange={handleMonthChange}
                  />
                </div>

                {/* Time Slots Column */}
                <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
                  {!selectedDate ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-zinc-500">Select a date to see available times</p>
                    </div>
                  ) : loadingSlots && selectedDateSlots.length === 0 ? (
                    <TimeSlotsSkeleton />
                  ) : slotsError ? (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{slotsError}</p>
                    </div>
                  ) : (
                    <AvailableTimeSlots
                      slots={selectedDateSlots}
                      selectedSlot={bookingStage === "selecting" ? selectedTimeslot : null}
                      onSlotSelect={handleTimeslotSelect}
                      timezone={userTimezone}
                      loading={loadingSlots}
                      date={selectedDate}
                      timeFormat={timeFormat}
                      onTimeFormatChange={setTimeFormat}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {bookingStage === "form" && selectedTimeslot && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col overflow-y-auto p-6">
                <div className="mx-auto w-full max-w-xl">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-zinc-900">Your Information</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Provide your details so we can confirm the booking.
                    </p>
                  </div>

                  <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs font-medium uppercase text-zinc-500">Selected Time</p>
                    <p className="mt-1 text-sm text-zinc-900">
                      {dayjs(selectedTimeslot).tz(userTimezone).format("dddd, MMMM D, YYYY [at] h:mm A")}
                    </p>
                  </div>

                  <BookingForm
                    locationSettings={config.eventType.locationSettings}
                    defaultValues={formValues}
                    onSubmit={handleFormSubmit}
                    onBack={handleBackToSelection}
                  />
                </div>
              </motion.div>
            )}

            {bookingStage === "confirmation" && selectedTimeslot && formValues && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900">Confirm Booking</h2>
                    <p className="mt-1 text-sm text-zinc-500">Review and confirm your reservation.</p>
                  </div>

                  <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">Contractor</p>
                      <p className="mt-1 text-sm text-zinc-900">{config.contractor.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">Service</p>
                      <p className="mt-1 text-sm text-zinc-900">{config.eventType.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">Date &amp; time</p>
                      <p className="mt-1 text-sm text-zinc-900">
                        {dayjs(selectedTimeslot).tz(userTimezone).format("dddd, MMMM D, YYYY [at] h:mm A")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">Duration</p>
                      <p className="mt-1 text-sm text-zinc-900">{config.eventType.durationMinutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">Location</p>
                      <p className="mt-1 text-sm text-zinc-900">
                        {formValues.locationType === "phone" ? "Phone Call" : "Physical Location"}
                      </p>
                      {formValues.locationType === "phone" && (
                        <div className="mt-2 space-y-1 text-sm text-zinc-700">
                          {config.eventType.locationSettings.phone.hostProvidesNumber &&
                            config.eventType.locationSettings.phone.hostPhoneNumber && (
                              <p>
                                We&apos;ll call you from{" "}
                                <span className="font-medium">
                                  {config.eventType.locationSettings.phone.hostPhoneNumber}
                                </span>
                              </p>
                            )}
                        </div>
                      )}
                      {formValues.locationType === "physical" && formValues.address && (
                        <div className="mt-2 space-y-1 text-sm text-zinc-700">
                          <p>{formValues.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-zinc-700">
                    <p>
                      <span className="font-medium">Guest:</span> {formValues.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {formValues.email}
                    </p>
                    {formValues.inviteePhone && formValues.locationType === "phone" && (
                      <p>
                        <span className="font-medium">Phone:</span> {formValues.inviteePhone}
                      </p>
                    )}
                    {formValues.notes && (
                      <p className="whitespace-pre-wrap">
                        <span className="font-medium">Notes:</span> {formValues.notes}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={handleBackToForm}
                      disabled={isSubmitting}
                    >
                      Go Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConfirmBooking}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {bookingStage === "success" && bookingResult && formValues && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col overflow-y-auto p-8">
                <div className="mx-auto w-full max-w-xl">
                  <BookingSuccess
                    booking={bookingResult.booking}
                    bookerName={formValues.fullName}
                    bookerEmail={formValues.email}
                    googleCalendarUrl={bookingResult.calendarLinks.googleCalendarUrl}
                    icsContent={bookingResult.calendarLinks.icsContent}
                    onDone={handleDone}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
