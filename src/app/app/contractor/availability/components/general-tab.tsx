"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Json } from "@/lib/database.types";
import {
  getDefaultLocationSettings,
  normalizeLocationSettings,
  type LocationSettings,
} from "@/lib/location-settings";

interface GeneralTabProps {
  contractorId: string;
  initialData?: any;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface GeneralTabHandle {
  save: () => Promise<void>;
}

export const GeneralTab = forwardRef<GeneralTabHandle, GeneralTabProps>(
  ({ contractorId, initialData, onDirtyChange }, ref) => {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    event_type_title: "",
    event_type_description: "",
    event_type_duration_minutes: 60,
    event_type_price_cents: 0,
    event_type_currency: "USD",
    locationSettings: getDefaultLocationSettings(),
  });
  const [initialConfig, setInitialConfig] = useState<typeof config | null>(null);

  // Initialize from initialData
  useEffect(() => {
    if (initialData) {
      const newConfig = {
        event_type_title: initialData.event_type_title || "Consultation",
        event_type_description: initialData.event_type_description || "",
        event_type_duration_minutes: initialData.event_type_duration_minutes || 60,
        event_type_price_cents: initialData.event_type_price_cents || 0,
        event_type_currency: initialData.event_type_currency || "USD",
        locationSettings: normalizeLocationSettings(initialData.event_type_location_options),
      };
      setConfig(newConfig);
      setInitialConfig(newConfig);
    }
  }, [initialData]);

  // Track dirty state
  useEffect(() => {
    if (initialConfig && onDirtyChange) {
      const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
      onDirtyChange(isDirty);
    }
  }, [config, initialConfig, onDirtyChange]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          event_type_title: config.event_type_title,
          event_type_description: config.event_type_description,
          event_type_duration_minutes: config.event_type_duration_minutes,
          event_type_price_cents: config.event_type_price_cents,
          event_type_currency: config.event_type_currency,
          event_type_location_options: config.locationSettings as unknown as Json,
        })
        .eq("id", contractorId);

      if (error) throw error;

      // Update initial config to reset dirty state
      setInitialConfig({ ...config });
      toast.success("Event configuration saved successfully!");
    } catch (error) {
      console.error("Error saving event configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const parsePriceInput = (value: string) => {
    const numValue = parseFloat(value) || 0;
    return Math.round(numValue * 100);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        {/* Event Title */}
        <div>
          <Label htmlFor="event_type_title">Event Title *</Label>
          <Input
            id="event_type_title"
            value={config.event_type_title}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, event_type_title: e.target.value }))
            }
            placeholder="e.g., Consultation, 1-on-1 Call"
          />
          <p className="mt-1 text-xs text-zinc-500">The name of your event as it appears to clients</p>
        </div>

        {/* Event Description */}
        <div>
          <Label htmlFor="event_type_description">Event Description</Label>
          <Textarea
            id="event_type_description"
            value={config.event_type_description}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, event_type_description: e.target.value }))
            }
            placeholder="Describe what clients can expect from this meeting..."
            rows={4}
          />
          <p className="mt-1 text-xs text-zinc-500">
            A brief description to help clients understand what the meeting is about
          </p>
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="event_type_duration_minutes">Duration (minutes) *</Label>
          <Select
            value={config.event_type_duration_minutes.toString()}
            onValueChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                event_type_duration_minutes: parseInt(value, 10),
              }))
            }>
            <SelectTrigger id="event_type_duration_minutes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Options */}
        <div>
          <Label>Location Options *</Label>
          <div className="space-y-3">
            <div className="rounded-md border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-medium">Phone Call</p>
                  <p className="text-xs text-zinc-500">
                    Share your number or collect the invitee&apos;s phone to coordinate the call.
                  </p>
                </div>
                <Switch
                  checked={config.locationSettings.phone.enabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      locationSettings: {
                        ...prev.locationSettings,
                        phone: { ...prev.locationSettings.phone, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              {config.locationSettings.phone.enabled && (
                <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                  <div>
                    <Label htmlFor="host-phone">Your phone number</Label>
                    <Input
                      id="host-phone"
                      placeholder="e.g. +1 202-555-0100"
                      value={config.locationSettings.phone.hostPhoneNumber}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            phone: {
                              ...prev.locationSettings.phone,
                              hostPhoneNumber: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      This number is shown to invitees when you choose to share it.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Share my phone number</p>
                      <p className="text-xs text-zinc-500">
                        Display the number above in the booking confirmation.
                      </p>
                    </div>
                    <Switch
                      checked={config.locationSettings.phone.hostProvidesNumber}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            phone: {
                              ...prev.locationSettings.phone,
                              hostProvidesNumber: checked,
                            },
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Collect invitee phone number</p>
                      <p className="text-xs text-zinc-500">
                        Ask the invitee for their best number so you can reach them.
                      </p>
                    </div>
                    <Switch
                      checked={config.locationSettings.phone.collectInviteeNumber}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            phone: {
                              ...prev.locationSettings.phone,
                              collectInviteeNumber: checked,
                              requireInviteeNumber: checked
                                ? prev.locationSettings.phone.requireInviteeNumber
                                : false,
                            },
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <div>
                      <p className="text-sm font-medium">Require invitee phone number</p>
                      <p className="text-xs text-zinc-500">
                        Make this field mandatory on the booking form.
                      </p>
                    </div>
                    <Switch
                      checked={config.locationSettings.phone.requireInviteeNumber}
                      disabled={!config.locationSettings.phone.collectInviteeNumber}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            phone: {
                              ...prev.locationSettings.phone,
                              requireInviteeNumber: checked,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-md border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-medium">Physical Location</p>
                  <p className="text-xs text-zinc-500">
                    Collect the service address from the invitee for on-site visits.
                  </p>
                </div>
                <Switch
                  checked={config.locationSettings.physical.enabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      locationSettings: {
                        ...prev.locationSettings,
                        physical: { ...prev.locationSettings.physical, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              {config.locationSettings.physical.enabled && (
                <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                  <div>
                    <Label htmlFor="address-label">Address field label</Label>
                    <Input
                      id="address-label"
                      value={config.locationSettings.physical.addressLabel}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            physical: {
                              ...prev.locationSettings.physical,
                              addressLabel: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Shown above the address input on the booking form.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require address</p>
                      <p className="text-xs text-zinc-500">
                        The invitee must provide an address to complete the booking.
                      </p>
                    </div>
                    <Switch
                      checked={config.locationSettings.physical.requireAddress}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            physical: {
                              ...prev.locationSettings.physical,
                              requireAddress: checked,
                            },
                          },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="address-instructions">Additional instructions</Label>
                    <Textarea
                      id="address-instructions"
                      rows={3}
                      placeholder="Any notes to help the invitee prepare their location..."
                      value={config.locationSettings.physical.instructions}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          locationSettings: {
                            ...prev.locationSettings,
                            physical: {
                              ...prev.locationSettings.physical,
                              instructions: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Optional message shown alongside the address field.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="event_type_price">Price (optional)</Label>
          <div className="flex items-center gap-2">
            <Select
              value={config.event_type_currency}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, event_type_currency: value }))
              }>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="event_type_price"
              type="number"
              step="0.01"
              min="0"
              value={formatPrice(config.event_type_price_cents)}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  event_type_price_cents: parsePriceInput(e.target.value),
                }))
              }
              placeholder="0.00"
              className="flex-1"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Set to 0 for free consultations</p>
        </div>
      </Card>
    </div>
  );
});

GeneralTab.displayName = "GeneralTab";

