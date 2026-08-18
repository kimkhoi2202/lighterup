"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { useGetAvailableJobsQuery, useAcceptJobMutation, type Job } from "@/store/api/jobs-api";

export default function ContractorJobFeedPage() {
  const [contractorLocation, setContractorLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // RTK Query hooks
  const { data: jobsData = [], isLoading, isFetching } = useGetAvailableJobsQuery();
  const [acceptJob, { isLoading: isAccepting }] = useAcceptJobMutation();

  // Haversine formula to calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchContractorProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Get contractor's location from profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("service_base_latitude, service_base_longitude")
        .eq("id", user.id)
        .single();

      if (!error && profile?.service_base_latitude && profile?.service_base_longitude) {
        setContractorLocation({
          latitude: profile.service_base_latitude,
          longitude: profile.service_base_longitude,
        });
      }
    };

    fetchContractorProfile();
  }, []);

  // Calculate distance and sort jobs
  const jobs = useMemo(() => {
    if (!jobsData.length) return [];

    // Calculate distance for each job if contractor location is available
    const jobsWithDistance = jobsData.map((job) => {
      if (
        contractorLocation &&
        job.latitude !== null &&
        job.longitude !== null
      ) {
        const distance = calculateDistance(
          contractorLocation.latitude,
          contractorLocation.longitude,
          job.latitude,
          job.longitude
        );
        return { ...job, distance_miles: distance };
      }
      return job;
    });

    // Sort by distance if available
    if (contractorLocation) {
      jobsWithDistance.sort((a, b) => {
        const distA = (a as Job).distance_miles;
        const distB = (b as Job).distance_miles;
        if (distA === undefined) return 1;
        if (distB === undefined) return -1;
        return distA - distB;
      });
    }

    return jobsWithDistance as Job[];
  }, [jobsData, contractorLocation]);

  const handleAccept = async (jobId: string) => {
    try {
      await acceptJob(jobId).unwrap();
      toast.success("Job accepted successfully!");
    } catch (error: any) {
      console.error("Error accepting job:", error);
      toast.error(error?.data?.error || error?.message || "Failed to accept job. Please try again.");
    }
  };

  const handleSkip = (jobId: string) => {
    // In production, you might want to track skipped jobs
    // For now, we'll just let the cache handle it
  };

  const complexityColors = {
    simple: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    complex: "bg-red-100 text-red-800 border-red-200",
  };

  const loading = isLoading || isFetching;

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Loading jobs...
          </p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Browse and accept jobs in your area
          </p>
        </div>

        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
          <p className="text-muted-foreground">
            There are currently no open jobs in your area. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground mt-2">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"} available
            {contractorLocation && " • Sorted by distance"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="p-6 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            {/* Content */}
            <div className="space-y-4 flex-1">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{job.address}</h3>
                  <p className="text-sm text-muted-foreground">
                    {job.city}, {job.state}
                  </p>
                </div>
                {job.distance_miles !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {job.distance_miles.toFixed(1)} mi
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div>
                <p className="text-xs text-muted-foreground">Your Payout</p>
                <p className="text-2xl font-bold text-[#EA2831]">
                  {formatCurrency(job.contractor_payout_cents)}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Complexity</p>
                  <Badge className={complexityColors[job.complexity]}>
                    {job.complexity.charAt(0).toUpperCase() + job.complexity.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Length</p>
                  <p className="text-sm font-medium">{job.estimated_length_feet} ft</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex gap-2 flex-wrap">
                {job.lights_provided && (
                  <Badge variant="outline" className="text-xs">
                    Lights Provided
                  </Badge>
                )}
                {job.storage_needed && (
                  <Badge variant="outline" className="text-xs">
                    Storage Needed
                  </Badge>
                )}
              </div>

              {/* Description */}
              {job.description && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm line-clamp-2">{job.description}</p>
                </div>
              )}
            </div>

            {/* Actions - Always at bottom */}
            <div className="flex gap-2 pt-4 mt-auto">
              <Button
                onClick={() => handleSkip(job.id)}
                variant="outline"
                className="flex-1"
                disabled={isAccepting}
              >
                Skip
              </Button>
              <Button
                onClick={() => handleAccept(job.id)}
                className="flex-1 bg-[#EA2831] hover:bg-[#EA2831]/90"
                disabled={isAccepting}
              >
                {isAccepting ? "Accepting..." : "Accept Job"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
