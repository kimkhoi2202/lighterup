"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Clock, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateScheduleModal } from "@/components/app/create-schedule-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useGetSchedulesQuery,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from "@/store/api/availability-api";

interface AvailabilitySchedule {
  id: string;
  name: string;
  is_default: boolean;
  timezone: string;
  created_at: string;
}

interface AvailabilityWindow {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function ContractorAvailabilityPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  // RTK Query hooks
  const { data: schedules = [], isLoading } = useGetSchedulesQuery();
  const [deleteSchedule] = useDeleteScheduleMutation();
  const [updateSchedule] = useUpdateScheduleMutation();

  async function handleDeleteSchedule(scheduleId: string) {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      await deleteSchedule(scheduleId).unwrap();
      toast.success("Schedule deleted");
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error(error?.data?.error || "Failed to delete schedule");
    }
  }

  async function handleSetDefault(scheduleId: string) {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    try {
      await updateSchedule({
        id: scheduleId,
        data: {
          name: schedule.name,
          timezone: schedule.timezone,
          is_default: true,
        },
      }).unwrap();
      toast.success("Default schedule updated");
    } catch (error: any) {
      console.error("Error setting default:", error);
      toast.error(error?.data?.error || "Failed to set default schedule");
    }
  }

  function formatTimeRanges(windows: any[]): string {
    if (!windows || windows.length === 0) return "No hours set";

    // Group by day ranges
    const dayGroups: { [key: string]: string[] } = {};
    
    windows.forEach((window) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[window.day_of_week];
      const timeRange = `${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
      
      if (!dayGroups[timeRange]) {
        dayGroups[timeRange] = [];
      }
      dayGroups[timeRange].push(dayName);
    });

    // Format day ranges
    const ranges: string[] = [];
    Object.entries(dayGroups).forEach(([timeRange, days]) => {
      if (days.length === 7) {
        ranges.push(`Sun - Sat, ${timeRange}`);
      } else if (days.length === 5 && days.includes("Mon") && days.includes("Fri")) {
        ranges.push(`Mon - Fri, ${timeRange}`);
      } else {
        ranges.push(`${days.join(", ")}, ${timeRange}`);
      }
    });

    return ranges.join(" • ");
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-zinc-500">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground mt-2">
            Configure times when you are available for bookings.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            No availability schedules
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Create your first schedule to set your working hours.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/app/contractor/availability/${schedule.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-zinc-900">{schedule.name}</h3>
                    {schedule.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-600">
                      Click to view and edit schedule
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Globe className="h-3 w-3" />
                      {schedule.timezone}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!schedule.is_default && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(schedule.id);
                        }}
                      >
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(schedule.id);
                      }}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

