"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCreateScheduleMutation } from "@/store/api/availability-api";

interface CreateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SCHEDULE_NAME_SUGGESTIONS = [
  "Working Hours",
  "Weekend Availability",
  "Holiday Schedule",
  "Summer Hours",
  "Part-Time Schedule",
  "Full-Time Schedule",
];

export function CreateScheduleModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateScheduleModalProps) {
  const [name, setName] = useState("");
  const [createSchedule, { isLoading }] = useCreateScheduleMutation();

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    try {
      await createSchedule({
        name: name.trim(),
        timezone: "America/Chicago", // Default timezone
        is_default: false,
      }).unwrap();
      toast.success("Schedule created");
      setName("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      toast.error(error?.data?.error || error?.message || "Failed to create schedule");
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setName(suggestion);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new schedule</DialogTitle>
          <DialogDescription>
            Give your availability schedule a name to help you organize different
            working hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Name</Label>
            <Input
              id="schedule-name"
              placeholder="Working Hours"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          {name.trim().length === 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {SCHEDULE_NAME_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
            {isLoading ? "Creating..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

