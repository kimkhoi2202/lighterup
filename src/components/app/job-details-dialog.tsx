"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/utils/format";
import { supabase } from "@/lib/supabase";
import { MessageSquare } from "lucide-react";

interface JobDetailsDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: "homeowner" | "contractor";
}

export function JobDetailsDialog({
  jobId,
  open,
  onOpenChange,
  role = "contractor",
}: JobDetailsDialogProps) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [homeowner, setHomeowner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (open && jobId) {
      loadJobDetails();
    } else {
      // Reset state when dialog closes
      setJob(null);
      setHomeowner(null);
    }
  }, [open, jobId]);

  async function loadJobDetails() {
    if (!jobId) return;

    setLoading(true);
    try {
      const { data: jobData, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;

      if (jobData) {
        setJob(jobData);

        // Load homeowner info for contractors
        if (role === "contractor" && jobData.homeowner_id) {
          const { data: homeownerData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", jobData.homeowner_id)
            .single();

          setHomeowner(homeownerData);
        }

        // Check if conversation exists
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          try {
            // Check as homeowner first
            const { data: convAsHomeowner } = await (supabase as any)
              .from("conversations")
              .select("id")
              .eq("job_id", jobData.id)
              .eq("homeowner_id", user.id)
              .maybeSingle();

            // Check as contractor if not found
            let convAsContractor = null;
            if (!convAsHomeowner) {
              const result = await (supabase as any)
                .from("conversations")
                .select("id")
                .eq("job_id", jobData.id)
                .eq("contractor_id", user.id)
                .maybeSingle();
              convAsContractor = result.data;
            }

            setConversationId(convAsHomeowner?.id || convAsContractor?.id || null);
          } catch (error) {
            // Conversation might not exist yet
            setConversationId(null);
          }
        }
      }
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setLoading(false);
    }
  }

  const complexityColors = {
    simple: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    complex: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {loading ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Loading Job Details</DialogTitle>
              <DialogDescription>
                Please wait while we load the job information...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-12 px-6">
              <p className="text-muted-foreground">Loading job details...</p>
            </div>
          </>
        ) : job ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b pr-12">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-bold mb-1">
                    {job.address}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {job.city}, {job.state} {job.zip}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  {conversationId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        router.push(
                          role === "contractor"
                            ? "/app/contractor/messaging"
                            : "/app/homeowner/messaging"
                        );
                        // Small delay to ensure navigation happens
                        setTimeout(() => {
                          // The conversation will be selected by ID in the messaging page
                          // We can use URL params or state management for this
                        }, 100);
                      }}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Button>
                  )}
                  <StatusBadge status={job.status} />
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-6 space-y-6">
              {/* Job Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Job Details</h3>
                {job.description && (
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-2">
                      Description
                    </p>
                    <p className="text-sm leading-relaxed">{job.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Stories
                    </p>
                    <p className="text-lg font-semibold">{job.num_stories}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      House Size
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {job.house_size || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Light Length
                    </p>
                    <p className="text-lg font-semibold">
                      {job.estimated_length_feet} ft
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Complexity
                    </p>
                    <Badge className={complexityColors[job.complexity as keyof typeof complexityColors]} variant="outline">
                      {job.complexity.charAt(0).toUpperCase() +
                        job.complexity.slice(1)}
                    </Badge>
                  </div>
                </div>

                {(job.lights_provided || job.storage_needed) && (
                  <div className="flex gap-6 pt-4 border-t">
                    {job.lights_provided && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                          <span className="text-xs text-green-700">✓</span>
                        </div>
                        <span className="text-sm font-medium">Lights Provided</span>
                      </div>
                    )}
                    {job.storage_needed && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                          <span className="text-xs text-green-700">✓</span>
                        </div>
                        <span className="text-sm font-medium">Storage Needed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Homeowner Info (for contractors) */}
              {role === "contractor" && homeowner && (
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold">Homeowner Contact</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Name
                      </p>
                      <p className="text-base font-semibold">{homeowner.full_name}</p>
                    </div>
                    {homeowner.phone && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Phone
                        </p>
                        <p className="text-base font-semibold">{homeowner.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Pricing Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Base Price</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(job.base_price_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Complexity Addon</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(job.complexity_addon_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Options Addon</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(job.options_addon_cents)}
                    </span>
                  </div>
                  {job.tip_amount_cents > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Tip</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(job.tip_amount_cents)}
                      </span>
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold">
                      {role === "contractor" ? "Your Payout" : "Total Price"}
                    </span>
                    <span className="text-2xl font-bold text-[#EA2831]">
                      {formatCurrency(
                        role === "contractor"
                          ? job.contractor_payout_cents
                          : job.total_price_cents
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Timeline</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Created
                    </p>
                    <p className="text-sm font-semibold">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  {job.requested_date_start && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Requested Start
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(job.requested_date_start)}
                      </p>
                    </div>
                  )}
                  {job.requested_date_end && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Requested End
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(job.requested_date_end)}
                      </p>
                    </div>
                  )}
                  {job.assigned_at && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Assigned
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(job.assigned_at)}
                      </p>
                    </div>
                  )}
                  {job.completed_at && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Completed
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(job.completed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Job Not Found</DialogTitle>
              <DialogDescription>
                The requested job could not be found.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              <p className="text-muted-foreground text-center py-12">
                Please try again later.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

