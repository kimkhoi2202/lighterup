"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetMyJobsQuery } from "@/store/api/jobs-api";

export default function HomeownerDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const { data: jobsData = [], isLoading: jobsLoading } = useGetMyJobsQuery();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);
      }
    }

    loadProfile();
  }, []);

  // Check progress
  const hasCreatedJob = useMemo(() => jobsData.length > 0, [jobsData]);
  const hasAssignedJob = useMemo(
    () => jobsData.some((job) => job.contractor_id !== null),
    [jobsData]
  );

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome to Lighter Up, {profile?.full_name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Your homeowner dashboard - manage your holiday light installation jobs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EA2831]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6 text-[#EA2831]"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create a Job</h3>
              <p className="text-sm text-muted-foreground">
                Post a new light installation job
              </p>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href="/app/homeowner/jobs/new">Create Job</Link>
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6 text-blue-500"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Jobs</h3>
              <p className="text-sm text-muted-foreground">
                View your active and past jobs
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/homeowner/jobs">View Jobs</Link>
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Getting Started</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-500 text-xs font-bold mt-0.5">
              ✓
            </div>
            <div>
              <p className="font-medium">Profile Complete</p>
              <p className="text-muted-foreground">
                Your account is set up and ready to go
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                hasCreatedJob
                  ? "bg-green-500/10 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {hasCreatedJob ? "✓" : "2"}
            </div>
            <div>
              <p className="font-medium">Create Your First Job</p>
              <p className="text-muted-foreground">
                {hasCreatedJob
                  ? "Great! You've created your first job"
                  : "Post a job with details about your light installation needs"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                hasAssignedJob
                  ? "bg-green-500/10 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {hasAssignedJob ? "✓" : "3"}
            </div>
            <div>
              <p className="font-medium">Get Matched with Contractors</p>
              <p className="text-muted-foreground">
                {hasAssignedJob
                  ? "A contractor has accepted your job!"
                  : "Professional contractors in your area will be able to accept your job"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
