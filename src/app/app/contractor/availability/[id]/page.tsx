"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Trash2, Save, Clock, Calendar, Settings, RefreshCw, ExternalLink, Link as LinkIcon, Code, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  useGetScheduleQuery,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
} from "@/store/api/availability-api";
import { GeneralTab, type GeneralTabHandle } from "../components/general-tab";
import { WeeklyScheduleTab, type WeeklyScheduleTabHandle } from "../components/weekly-schedule-tab";
import { DateOverridesTab } from "../components/date-overrides-tab";
import { LimitsBuffersTab, type LimitsBuffersTabHandle } from "../components/limits-buffers-tab";
import { CalendarSyncTab } from "../components/calendar-sync-tab";
import { supabase } from "@/lib/supabase";

interface AvailabilityWindow {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityBlackout {
  id: string;
  schedule_id: string;
  blackout_date: string;
  reason: string | null;
  is_all_day: boolean;
}

interface Schedule {
  id: string;
  name: string;
  is_default: boolean;
  timezone: string;
}

export default function ScheduleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [initialScheduleName, setInitialScheduleName] = useState("");
  const [contractorId, setContractorId] = useState<string>("");
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Dirty state tracking for each tab
  const [generalTabDirty, setGeneralTabDirty] = useState(false);
  const [limitsTabDirty, setLimitsTabDirty] = useState(false);
  const [weeklyScheduleDirty, setWeeklyScheduleDirty] = useState(false);

  // Refs for tab components
  const generalTabRef = useRef<GeneralTabHandle>(null);
  const limitsBuffersTabRef = useRef<LimitsBuffersTabHandle>(null);
  const weeklyScheduleRef = useRef<WeeklyScheduleTabHandle>(null);
  
  // Compute if there are unsaved changes
  const hasUnsavedChanges = 
    scheduleName !== initialScheduleName || 
    generalTabDirty || 
    limitsTabDirty ||
    weeklyScheduleDirty;

  // RTK Query hooks
  const { data: scheduleData, isLoading } = useGetScheduleQuery(scheduleId);
  const schedule = scheduleData?.schedule || null;
  const windows = scheduleData?.windows || [];
  const blackouts = scheduleData?.blackouts || [];

  // Initialize schedule name when schedule loads
  useEffect(() => {
    if (schedule) {
      if (!scheduleName) {
        setScheduleName(schedule.name);
      }
      if (!initialScheduleName) {
        setInitialScheduleName(schedule.name);
      }
    }
  }, [schedule, scheduleName, initialScheduleName]);

  // Fetch contractor profile data
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setContractorId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfileData(profile);
      }
    }
    fetchProfile();
  }, []);

  // Mutations
  const [updateSchedule] = useUpdateScheduleMutation();
  const [deleteSchedule] = useDeleteScheduleMutation();

  async function handleSave() {
    if (!schedule) return;

    setSaving(true);
    try {
      // Update schedule name if changed
      if (scheduleName !== initialScheduleName) {
        await updateSchedule({
          id: scheduleId,
          data: {
            name: scheduleName,
            timezone: schedule.timezone,
            is_default: schedule.is_default,
          },
        }).unwrap();
        // Update the initial name to the new name after saving
        setInitialScheduleName(scheduleName);
      }

      // Call appropriate tab's save function based on active tab
      if (activeTab === "general" && generalTabRef.current) {
        await generalTabRef.current.save();
        setGeneralTabDirty(false);
      } else if (activeTab === "limits" && limitsBuffersTabRef.current) {
        await limitsBuffersTabRef.current.save();
        setLimitsTabDirty(false);
      }
      
      // Save all dirty tabs regardless of active tab
      if (generalTabDirty && generalTabRef.current) {
        await generalTabRef.current.save();
        setGeneralTabDirty(false);
      }
      if (limitsTabDirty && limitsBuffersTabRef.current) {
        await limitsBuffersTabRef.current.save();
        setLimitsTabDirty(false);
      }
      if (weeklyScheduleDirty && weeklyScheduleRef.current) {
        await weeklyScheduleRef.current.save();
        setWeeklyScheduleDirty(false);
      }

      if (hasUnsavedChanges) {
        toast.success("Changes saved");
      }

      setEditingName(false);
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.error(error?.data?.error || error?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault() {
    if (!schedule) return;

    const newDefaultValue = !schedule.is_default;

    try {
      await updateSchedule({
        id: scheduleId,
        data: {
          name: schedule.name,
          timezone: schedule.timezone,
          is_default: newDefaultValue,
        },
      }).unwrap();

      toast.success(
        newDefaultValue 
          ? "Set as default schedule" 
          : "Removed as default schedule"
      );
    } catch (error: any) {
      console.error("Error setting default:", error);
      toast.error(error?.data?.error || error?.message || "Failed to update default");
    }
  }

  async function handleDeleteSchedule() {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await deleteSchedule(scheduleId).unwrap();
      toast.success("Schedule deleted");
      router.push("/app/contractor/availability");
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error(error?.data?.error || error?.message || "Failed to delete schedule");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-zinc-500">Loading schedule...</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-zinc-500">Schedule not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/app/contractor/availability")}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-64"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    } else if (e.key === "Escape") {
                      setScheduleName(schedule.name);
                      setEditingName(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <h1 className="text-2xl font-semibold text-zinc-900">{schedule.name}</h1>
            )}
            <p className="text-sm text-zinc-500 mt-1">
              {windows.length > 0
                ? `${windows.filter((w) => w.is_active).length} time slots configured`
                : "No hours set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Label htmlFor="default-toggle" className="mb-0 text-sm">
              Set as Default
            </Label>
            <Switch
              id="default-toggle"
              checked={schedule.is_default}
              onCheckedChange={() => handleSetDefault()}
            />
          </div>
          <div className="hidden sm:block w-px h-6 bg-zinc-200" />
          
          {/* Action Buttons - Preview, Copy Link, Embed */}
          <TooltipProvider>
            <div className="hidden lg:flex items-center border border-zinc-200 rounded-md overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const url = `${window.location.origin}/book/${contractorId}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="rounded-none border-r border-zinc-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <p>Preview booking page</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const url = `${window.location.origin}/book/${contractorId}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Booking link copied to clipboard!");
                    }}
                    className="rounded-none border-r border-zinc-200"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <p>Copy booking link</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const url = `${window.location.origin}/book/${contractorId}`;
                      const embedCode = `<iframe src="${url}" width="100%" height="800" frameborder="0"></iframe>`;
                      navigator.clipboard.writeText(embedCode);
                      toast.success("Embed code copied to clipboard!");
                    }}
                    className="rounded-none"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <p>Copy embed code</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          
          <div className="hidden sm:block w-px h-6 bg-zinc-200" />
          <Button variant="ghost" size="sm" onClick={handleDeleteSchedule}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="hidden sm:block w-px h-6 bg-zinc-200" />
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="overrides" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Date Overrides</span>
            <span className="sm:hidden">Overrides</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Limits & Buffers</span>
            <span className="sm:hidden">Limits</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar Sync</span>
            <span className="sm:hidden">Sync</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-4">
            {contractorId && (
              <GeneralTab
                ref={generalTabRef}
                contractorId={contractorId}
                initialData={profileData}
                onDirtyChange={setGeneralTabDirty}
              />
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <WeeklyScheduleTab 
              ref={weeklyScheduleRef}
              scheduleId={scheduleId} 
              windows={windows} 
              timezone={schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              onDirtyChange={setWeeklyScheduleDirty}
            />
          </TabsContent>

          <TabsContent value="overrides" className="space-y-4">
            <DateOverridesTab scheduleId={scheduleId} blackouts={blackouts} />
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            {contractorId && (
              <LimitsBuffersTab
                ref={limitsBuffersTabRef}
                contractorId={contractorId}
                initialData={profileData}
                onDirtyChange={setLimitsTabDirty}
              />
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarSyncTab scheduleId={scheduleId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
