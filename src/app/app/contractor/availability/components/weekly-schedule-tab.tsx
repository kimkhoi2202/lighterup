"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Trash2, Globe } from "lucide-react";
import { TimeSelect } from "@/components/app/time-select";
import { toast } from "sonner";
import {
  useCreateWindowMutation,
  useUpdateWindowMutation,
  useDeleteWindowMutation,
  useUpdateScheduleMutation,
  type AvailabilityWindow,
} from "@/store/api/availability-api";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// US-focused timezone list with IANA identifiers
const TIMEZONES = {
  pacific: [
    { value: "Pacific/Pago_Pago", label: "Pago Pago", offset: "GMT -11:00" },
    { value: "Pacific/Midway", label: "Midway", offset: "GMT -11:00" },
    { value: "Pacific/Honolulu", label: "Honolulu", offset: "GMT -10:00" },
    { value: "Pacific/Johnston", label: "Johnston", offset: "GMT -10:00" },
    { value: "Pacific/Guam", label: "Guam", offset: "GMT +10:00" },
    { value: "Pacific/Saipan", label: "Saipan", offset: "GMT +10:00" },
    { value: "Pacific/Wake", label: "Wake Island", offset: "GMT +12:00" },
  ],
  alaska: [
    { value: "America/Adak", label: "Adak", offset: "GMT -10:00" },
    { value: "America/Anchorage", label: "Anchorage", offset: "GMT -09:00" },
    { value: "America/Juneau", label: "Juneau", offset: "GMT -09:00" },
    { value: "America/Sitka", label: "Sitka", offset: "GMT -09:00" },
    { value: "America/Yakutat", label: "Yakutat", offset: "GMT -09:00" },
    { value: "America/Nome", label: "Nome", offset: "GMT -09:00" },
    { value: "America/Metlakatla", label: "Metlakatla", offset: "GMT -09:00" },
  ],
  pacific_us: [
    { value: "America/Los_Angeles", label: "Los Angeles (Pacific)", offset: "GMT -08:00" },
  ],
  mountain: [
    { value: "America/Denver", label: "Denver (Mountain)", offset: "GMT -07:00" },
    { value: "America/Boise", label: "Boise", offset: "GMT -07:00" },
    { value: "America/Phoenix", label: "Phoenix (Arizona)", offset: "GMT -07:00" },
  ],
  central: [
    { value: "America/Chicago", label: "Chicago (Central)", offset: "GMT -06:00" },
    { value: "America/Indiana/Tell_City", label: "Tell City, IN", offset: "GMT -06:00" },
    { value: "America/Indiana/Knox", label: "Knox, IN", offset: "GMT -06:00" },
    { value: "America/Menominee", label: "Menominee", offset: "GMT -06:00" },
    { value: "America/North_Dakota/Center", label: "Center, ND", offset: "GMT -06:00" },
    { value: "America/North_Dakota/New_Salem", label: "New Salem, ND", offset: "GMT -06:00" },
    { value: "America/North_Dakota/Beulah", label: "Beulah, ND", offset: "GMT -06:00" },
  ],
  eastern: [
    { value: "America/New_York", label: "New York (Eastern)", offset: "GMT -05:00" },
    { value: "America/Detroit", label: "Detroit", offset: "GMT -05:00" },
    { value: "America/Kentucky/Louisville", label: "Louisville, KY", offset: "GMT -05:00" },
    { value: "America/Kentucky/Monticello", label: "Monticello, KY", offset: "GMT -05:00" },
    { value: "America/Indiana/Indianapolis", label: "Indianapolis, IN", offset: "GMT -05:00" },
    { value: "America/Indiana/Vincennes", label: "Vincennes, IN", offset: "GMT -05:00" },
    { value: "America/Indiana/Winamac", label: "Winamac, IN", offset: "GMT -05:00" },
    { value: "America/Indiana/Marengo", label: "Marengo, IN", offset: "GMT -05:00" },
    { value: "America/Indiana/Petersburg", label: "Petersburg, IN", offset: "GMT -05:00" },
    { value: "America/Indiana/Vevay", label: "Vevay, IN", offset: "GMT -05:00" },
  ],
  atlantic: [
    { value: "America/Puerto_Rico", label: "Puerto Rico", offset: "GMT -04:00" },
    { value: "America/St_Thomas", label: "St. Thomas (USVI)", offset: "GMT -04:00" },
  ],
};

// Local window type for tracking pending changes (includes temp IDs for new windows)
interface LocalWindow {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  isNew?: boolean; // Flag for windows that need to be created
  isDeleted?: boolean; // Flag for windows that need to be deleted
  isModified?: boolean; // Flag for windows that have been modified
}

export interface WeeklyScheduleTabHandle {
  save: () => Promise<void>;
}

interface WeeklyScheduleTabProps {
  scheduleId: string;
  windows: AvailabilityWindow[];
  timezone: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const WeeklyScheduleTab = forwardRef<WeeklyScheduleTabHandle, WeeklyScheduleTabProps>(
  ({ scheduleId, windows, timezone, onDirtyChange }, ref) => {
    const [createWindow] = useCreateWindowMutation();
    const [updateWindow] = useUpdateWindowMutation();
    const [deleteWindow] = useDeleteWindowMutation();
    const [updateSchedule] = useUpdateScheduleMutation();

    // Local state for pending changes
    const [localWindows, setLocalWindows] = useState<LocalWindow[]>([]);
    const [localTimezone, setLocalTimezone] = useState<string>(
      timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    
    // Track initial values for dirty checking
    const initialWindowsRef = useRef<string>("");
    const initialTimezoneRef = useRef<string>(timezone);
    
    // Track saving state to prevent useEffect from resetting during save
    const isSavingRef = useRef(false);

    // Initialize local state from props (skip during save to prevent flashing)
    useEffect(() => {
      if (isSavingRef.current) return;
      
      const windowsWithFlags: LocalWindow[] = windows.map((w) => ({
        ...w,
        isNew: false,
        isDeleted: false,
        isModified: false,
      }));
      setLocalWindows(windowsWithFlags);
      initialWindowsRef.current = JSON.stringify(windows);
    }, [windows]);

    // Sync timezone from props (skip during save)
    useEffect(() => {
      if (isSavingRef.current) return;
      
      setLocalTimezone(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      initialTimezoneRef.current = timezone;
    }, [timezone]);

    // Check if there are unsaved changes
    const checkDirty = useCallback(() => {
      // Check timezone changed
      if (localTimezone !== initialTimezoneRef.current) {
        return true;
      }

      // Check if any windows were added, deleted, or modified
      const hasNewWindows = localWindows.some((w) => w.isNew && !w.isDeleted);
      const hasDeletedWindows = localWindows.some((w) => w.isDeleted && !w.isNew);
      const hasModifiedWindows = localWindows.some((w) => w.isModified && !w.isNew && !w.isDeleted);

      return hasNewWindows || hasDeletedWindows || hasModifiedWindows;
    }, [localWindows, localTimezone]);

    // Notify parent of dirty state changes
    useEffect(() => {
      onDirtyChange?.(checkDirty());
    }, [checkDirty, onDirtyChange]);

    // Expose save method to parent via ref
    useImperativeHandle(ref, () => ({
      async save() {
        // Prevent useEffect from resetting state during save
        isSavingRef.current = true;
        
        try {
          // Save timezone if changed
          if (localTimezone !== initialTimezoneRef.current) {
            await updateSchedule({
              id: scheduleId,
              data: { timezone: localTimezone },
            }).unwrap();
          }

          // Process deleted windows (that existed before)
          const deletedWindows = localWindows.filter((w) => w.isDeleted && !w.isNew);
          for (const window of deletedWindows) {
            await deleteWindow({ scheduleId, windowId: window.id }).unwrap();
          }

          // Process new windows
          const newWindows = localWindows.filter((w) => w.isNew && !w.isDeleted);
          for (const window of newWindows) {
            await createWindow({
              scheduleId,
              data: {
                day_of_week: window.day_of_week,
                start_time: window.start_time,
                end_time: window.end_time,
                is_active: window.is_active,
              },
            }).unwrap();
          }

          // Process modified windows (that existed before)
          const modifiedWindows = localWindows.filter(
            (w) => w.isModified && !w.isNew && !w.isDeleted
          );
          for (const window of modifiedWindows) {
            await updateWindow({
              scheduleId,
              windowId: window.id,
              data: {
                day_of_week: window.day_of_week,
                start_time: window.start_time,
                end_time: window.end_time,
                is_active: window.is_active,
              },
            }).unwrap();
          }

          // Update refs to reflect saved state
          initialTimezoneRef.current = localTimezone;
          
          // Clear all dirty flags on local windows (keep current values as baseline)
          setLocalWindows((prev) =>
            prev
              .filter((w) => !w.isDeleted) // Remove deleted windows
              .map((w) => ({
                ...w,
                isNew: false,
                isDeleted: false,
                isModified: false,
              }))
          );
        } catch (error: any) {
          console.error("Error saving weekly schedule:", error);
          throw error;
        } finally {
          // Allow useEffect to sync again after a short delay
          // This ensures RTK Query has time to refetch with final state
          setTimeout(() => {
            isSavingRef.current = false;
          }, 500);
        }
      },
    }));

    function getWindowsForDay(dayOfWeek: number): LocalWindow[] {
      return localWindows.filter(
        (w) => w.day_of_week === dayOfWeek && w.is_active && !w.isDeleted
      );
    }

    function handleTimezoneChange(tzValue: string) {
      setLocalTimezone(tzValue);
    }

    function handleAddTimeSlot(dayOfWeek: number) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newWindow: LocalWindow = {
        id: tempId,
        schedule_id: scheduleId,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        is_active: true,
        isNew: true,
        isDeleted: false,
        isModified: false,
      };
      setLocalWindows((prev) => [...prev, newWindow]);
    }

    function handleUpdateTimeSlot(windowId: string, updates: Partial<LocalWindow>) {
      setLocalWindows((prev) =>
        prev.map((w) => {
          if (w.id !== windowId) return w;
          return {
            ...w,
            ...updates,
            isModified: w.isNew ? false : true, // Only mark as modified if not new
          };
        })
      );
    }

    function handleDeleteTimeSlot(windowId: string) {
      setLocalWindows((prev) =>
        prev.map((w) => {
          if (w.id !== windowId) return w;
          // If it's a new window (not yet saved), just mark for removal
          // If it's an existing window, mark as deleted
          return { ...w, isDeleted: true };
        }).filter((w) => !(w.isNew && w.isDeleted)) // Remove new windows that were deleted
      );
    }

    function handleCopyTimesToDays(sourceDay: number, targetDays: number[]) {
      const sourceWindows = getWindowsForDay(sourceDay);

      setLocalWindows((prev) => {
        let updated = [...prev];

        for (const targetDay of targetDays) {
          // Mark existing windows for this day as deleted
          updated = updated.map((w) => {
            if (w.day_of_week === targetDay && w.is_active && !w.isDeleted) {
              return { ...w, isDeleted: true };
            }
            return w;
          });

          // Remove new windows that were just marked for deletion
          updated = updated.filter((w) => !(w.isNew && w.isDeleted));

          // Add new windows copied from source
          for (const sourceWindow of sourceWindows) {
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            updated.push({
              id: tempId,
              schedule_id: scheduleId,
              day_of_week: targetDay,
              start_time: sourceWindow.start_time,
              end_time: sourceWindow.end_time,
              is_active: true,
              isNew: true,
              isDeleted: false,
              isModified: false,
            });
          }
        }

        return updated;
      });
    }

    function handleToggleDay(dayOfWeek: number, enabled: boolean) {
      if (!enabled) {
        // Mark all windows for this day as inactive/deleted
        setLocalWindows((prev) =>
          prev.map((w) => {
            if (w.day_of_week !== dayOfWeek) return w;
            if (w.isNew) {
              // New windows: mark for removal
              return { ...w, isDeleted: true };
            }
            // Existing windows: mark as modified with is_active = false
            return { ...w, is_active: false, isModified: true };
          }).filter((w) => !(w.isNew && w.isDeleted))
        );
      } else {
        // Check if there are any windows for this day (including inactive ones)
        const dayWindows = localWindows.filter(
          (w) => w.day_of_week === dayOfWeek && !w.isDeleted
        );

        if (dayWindows.length === 0) {
          // No windows exist, add a default one
          handleAddTimeSlot(dayOfWeek);
        } else {
          // Re-enable existing windows
          setLocalWindows((prev) =>
            prev.map((w) => {
              if (w.day_of_week !== dayOfWeek || w.isDeleted) return w;
              return { ...w, is_active: true, isModified: w.isNew ? false : true };
            })
          );
        }
      }
    }

    return (
      <div className="space-y-6">
        {/* Timezone Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-zinc-500" />
            <Label htmlFor="timezone" className="mb-0 text-sm font-medium text-zinc-900">
              Schedule Timezone
            </Label>
          </div>
          <Select value={localTimezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Pacific Time</SelectLabel>
                {TIMEZONES.pacific_us.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Mountain Time</SelectLabel>
                {TIMEZONES.mountain.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Central Time</SelectLabel>
                {TIMEZONES.central.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Eastern Time</SelectLabel>
                {TIMEZONES.eastern.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Atlantic Time</SelectLabel>
                {TIMEZONES.atlantic.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Alaska</SelectLabel>
                {TIMEZONES.alaska.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Pacific Islands & Territories</SelectLabel>
                {TIMEZONES.pacific.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-500">
            All times in your weekly schedule are set in this timezone. Customers will see times converted to their local timezone.
          </p>
        </div>

        {/* Working Hours */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-900">Working Hours</h3>
          <p className="text-sm text-muted-foreground">
            Set your regular weekly schedule. You can have multiple time ranges per day.
          </p>
        </div>

        <div className="space-y-3">
          {DAY_NAMES.map((dayName, dayIndex) => {
            const dayWindows = getWindowsForDay(dayIndex);
            const hasWindows = dayWindows.length > 0;

            return (
              <div key={dayIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={hasWindows}
                      onCheckedChange={(enabled) => handleToggleDay(dayIndex, enabled)}
                    />
                    <Label className="font-medium text-zinc-900">{dayName}</Label>
                  </div>
                  {hasWindows && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const otherDays = DAY_NAMES.map((_, i) => i).filter(
                          (i) => i !== dayIndex
                        );
                        handleCopyTimesToDays(dayIndex, otherDays);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy to All
                    </Button>
                  )}
                </div>

                {hasWindows && (
                  <div className="space-y-2 pl-11">
                    {dayWindows.map((window) => (
                      <div key={window.id} className="flex items-center gap-2">
                        <TimeSelect
                          value={window.start_time}
                          onChange={(value) =>
                            handleUpdateTimeSlot(window.id, { start_time: value })
                          }
                        />
                        <span className="text-zinc-500">-</span>
                        <TimeSelect
                          value={window.end_time}
                          onChange={(value) =>
                            handleUpdateTimeSlot(window.id, { end_time: value })
                          }
                          min={window.start_time}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTimeSlot(window.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeSlot(dayIndex)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Time
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

WeeklyScheduleTab.displayName = "WeeklyScheduleTab";
