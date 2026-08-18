"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Loader2,
  CalendarX,
  ExternalLink,
  FileText,
} from "lucide-react";

interface Booking {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  booker_name: string;
  booker_email: string;
  booker_phone: string | null;
  booker_notes: string | null;
  meeting_location_type: "phone" | "physical";
  meeting_location_details: string;
  address: string | null;
  city: string | null;
  state: string | null;
  total_price_cents: number;
  google_calendar_event_id: string | null;
  created_at: string;
}

interface BookingsData {
  bookings: Booking[];
  counts: {
    upcoming: number;
    past: number;
    cancelled: number;
    total: number;
  };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  const fetchBookings = async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/contractor/bookings?status=${status}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string, scheduledDate: string) => {
    const today = new Date().toISOString().split("T")[0];
    const isPast = scheduledDate < today;

    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (isPast) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all your booking appointments.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upcoming" className="relative">
            Upcoming
            {data?.counts.upcoming ? (
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {data.counts.upcoming}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
            {data?.counts.past ? (
              <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {data.counts.past}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            {data?.counts.cancelled ? (
              <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                {data.counts.cancelled}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-6 mt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fetchBookings(activeTab)}
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            <TabsContent value="upcoming" className="mt-6">
              <BookingsList
                bookings={data?.bookings || []}
                emptyMessage="No upcoming bookings"
                emptyDescription="When clients book appointments with you, they'll appear here."
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <BookingsList
                bookings={data?.bookings || []}
                emptyMessage="No past bookings"
                emptyDescription="Your completed appointments will appear here."
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              <BookingsList
                bookings={data?.bookings || []}
                emptyMessage="No cancelled bookings"
                emptyDescription="Cancelled appointments will appear here."
                formatDate={formatDate}
                formatTime={formatTime}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

interface BookingsListProps {
  bookings: Booking[];
  emptyMessage: string;
  emptyDescription: string;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  formatPrice: (cents: number) => string;
  getStatusBadge: (status: string, date: string) => React.ReactNode;
}

function BookingsList({
  bookings,
  emptyMessage,
  emptyDescription,
  formatDate,
  formatTime,
  formatPrice,
  getStatusBadge,
}: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-zinc-100 p-4 mb-4">
            <CalendarX className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {emptyDescription}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left: Main Info */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {booking.booker_name}
                    </h3>
                    {getStatusBadge(booking.status, booking.scheduled_date)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Booked {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-zinc-900">
                    {formatPrice(booking.total_price_cents)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{formatDate(booking.scheduled_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  {booking.meeting_location_type === "phone" ? (
                    <>
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Phone Call: {booking.meeting_location_details}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {booking.address}, {booking.city}, {booking.state}
                      </span>
                    </>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${booking.booker_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {booking.booker_email}
                  </a>
                </div>
              </div>

              {/* Notes */}
              {booking.booker_notes && (
                <div className="flex items-start gap-2 text-sm bg-zinc-50 rounded-lg p-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-700">Notes:</p>
                    <p className="text-zinc-600">{booking.booker_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

