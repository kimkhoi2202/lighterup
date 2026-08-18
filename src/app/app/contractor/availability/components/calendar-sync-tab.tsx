"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Info, Loader2, CheckCircle2, XCircle, CalendarPlus } from "lucide-react";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { supabase } from "@/lib/supabase";
import { CalendarListItem } from "./calendar-list-item";

interface CalendarStatus {
  isConnected: boolean;
  calendarId: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  selectedCalendarIds?: string[];
}

interface GoogleCalendar {
  id: string;
  name: string;
  isPrimary: boolean;
  backgroundColor?: string;
  accessRole?: string;
  // Legacy fields for backward compatibility
  externalId?: string;
  primary?: boolean;
  readOnly?: boolean;
  email?: string;
}

interface CalendarSyncTabProps {
  scheduleId?: string;
}

export function CalendarSyncTab({ scheduleId }: CalendarSyncTabProps) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Calendar list state
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Destination calendar state (where new bookings are added)
  const [destinationCalendarId, setDestinationCalendarId] = useState<string>("primary");
  const [savingDestination, setSavingDestination] = useState(false);

  // Fetch user ID and calendar connection status
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        await fetchStatus();
      } else {
        setError("User not authenticated");
        setLoading(false);
      }
    }
    
    init();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/contractor/calendar/status");
      if (!response.ok) {
        throw new Error("Failed to fetch calendar status");
      }
      const data = await response.json();
      setStatus(data);
      
      // Set selected calendar IDs from status
      if (data.selectedCalendarIds && Array.isArray(data.selectedCalendarIds)) {
        setSelectedCalendarIds(data.selectedCalendarIds);
      }
      
      // If connected, fetch calendar list and destination
      if (data.isConnected) {
        await Promise.all([fetchCalendars(), fetchDestination()]);
      }
    } catch (err: any) {
      console.error("Error fetching calendar status:", err);
      setError(err.message || "Failed to load calendar status");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCalendars = async () => {
    try {
      setLoadingCalendars(true);
      const response = await fetch("/api/contractor/calendar/list");
      if (!response.ok) {
        throw new Error("Failed to fetch calendars");
      }
      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (err: any) {
      console.error("Error fetching calendars:", err);
      setError(err.message || "Failed to load calendars");
    } finally {
      setLoadingCalendars(false);
    }
  };
  
  const fetchDestination = async () => {
    try {
      const response = await fetch("/api/contractor/calendar/destination");
      if (!response.ok) {
        throw new Error("Failed to fetch destination calendar");
      }
      const data = await response.json();
      setDestinationCalendarId(data.destinationCalendarId || "primary");
    } catch (err: any) {
      console.error("Error fetching destination calendar:", err);
      // Don't set error, just use default
    }
  };
  
  const handleDestinationChange = async (calendarId: string) => {
    try {
      setSavingDestination(true);
      setError(null);
      setDestinationCalendarId(calendarId);
      
      const response = await fetch("/api/contractor/calendar/destination", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendarId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update destination calendar");
      }
    } catch (err: any) {
      console.error("Error updating destination calendar:", err);
      setError(err.message || "Failed to update destination calendar");
    } finally {
      setSavingDestination(false);
    }
  };
  
  const handleToggleCalendar = (externalId: string, checked: boolean) => {
    setSelectedCalendarIds((prev) =>
      checked ? [...prev, externalId] : prev.filter((id) => id !== externalId)
    );
  };
  
  const handleSaveSelection = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/contractor/calendar/update-selected", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendarIds: selectedCalendarIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to save calendar selection");
      }

      // Refresh status to confirm save
      await fetchStatus();
    } catch (err: any) {
      console.error("Error saving calendar selection:", err);
      setError(err.message || "Failed to save calendar selection");
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    // Redirect to Google OAuth flow, passing scheduleId to return to the same page
    const authUrl = getGoogleAuthUrl(userId, scheduleId);
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar? This will remove all calendar sync settings.")) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      const response = await fetch("/api/contractor/calendar/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect calendar");
      }

      // Refresh status
      await fetchStatus();
    } catch (err: any) {
      console.error("Error disconnecting calendar:", err);
      setError(err.message || "Failed to disconnect calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-900">Calendar Sync</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to automatically block busy times and sync bookings.
          </p>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-festive-green" />
            <p className="text-sm text-muted-foreground">Loading calendar status...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">Calendar Sync</h3>
        <p className="text-sm text-muted-foreground">
          Connect your Google Calendar to automatically block busy times and sync bookings.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Status Card */}
      {status?.isConnected ? (
        <>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-900">
                      Google Calendar Connected
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your calendar is synced and ready to use
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calendar ID:</span>
                  <span className="font-medium text-zinc-900">{status.calendarId || "primary"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connected:</span>
                  <span className="font-medium text-zinc-900">
                    {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                {status.lastSyncAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-medium text-zinc-900">
                      {new Date(status.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect Google Calendar"
                )}
              </Button>
            </div>
          </Card>

          {/* Destination Calendar Section */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                Add Events To
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which calendar new booking events will be added to.
              </p>
            </div>

            <Card className="p-4">
              {loadingCalendars ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-festive-green" />
                </div>
              ) : calendars.length === 0 ? (
                <p className="text-sm text-muted-foreground">No calendars found</p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="destination-calendar" className="mb-0 text-sm font-medium">
                    Destination Calendar
                  </Label>
                  <Select
                    value={destinationCalendarId}
                    onValueChange={handleDestinationChange}
                    disabled={savingDestination}
                  >
                    <SelectTrigger id="destination-calendar" className="w-full">
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center gap-2">
                            {calendar.backgroundColor && (
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: calendar.backgroundColor }}
                              />
                            )}
                            <span>{calendar.name}</span>
                            {calendar.isPrimary && (
                              <span className="text-xs text-muted-foreground">(Primary)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {savingDestination && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Calendar Selection Section */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900">
                Check for Conflicts
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Select calendars to check for conflicts when showing available time slots.
              </p>
            </div>

            <Card className="p-4">
              {loadingCalendars ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-festive-green" />
                </div>
              ) : calendars.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No calendars found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {calendars.map((calendar) => (
                    <CalendarListItem
                      key={calendar.id}
                      externalId={calendar.id}
                      name={calendar.name}
                      primary={calendar.isPrimary}
                      readOnly={calendar.accessRole === "reader"}
                      isSelected={selectedCalendarIds.includes(calendar.id)}
                      onToggle={(checked) => handleToggleCalendar(calendar.id, checked)}
                      disabled={saving}
                    />
                  ))}
                </div>
              )}
            </Card>

            {calendars.length > 0 && (
              <Button
                onClick={handleSaveSelection}
                disabled={saving || loadingCalendars}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save Selection (${selectedCalendarIds.length} selected)`
                )}
              </Button>
            )}
          </div>
        </>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-festive-green/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-festive-green" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-zinc-900">
                Google Calendar Integration
              </h4>
              <p className="text-sm text-muted-foreground max-w-md">
                Connect your Google Calendar and Lighter Up will automatically manage your availability
                based on your existing calendar events.
              </p>
            </div>

            <Button onClick={handleConnect} className="mt-4">
              <Calendar className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box - Only show if not connected */}
      {!status?.isConnected && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Secure OAuth Connection
              </p>
              <p className="text-xs text-blue-700">
                We use Google's secure OAuth 2.0 protocol. You can revoke access at any time from
                your Google Account settings or by disconnecting here.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

