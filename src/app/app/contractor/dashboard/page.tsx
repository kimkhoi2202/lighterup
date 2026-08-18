"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContractorDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
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
          Welcome back, {profile?.business_name || profile?.full_name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Your contractor dashboard - find jobs and manage your business
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EA2831]/10">
              <svg
                className="size-[18px]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m4,13v7c0,1.105.895,2,2,2h12c1.105,0,2-.895,2-2v-7"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeMiterlimit="10"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="stroke-[#EA2831]"
                />
                <polyline
                  points="10 22 10 16 14 16 14 22"
                  fill="none"
                  stroke="currentColor"
                  strokeMiterlimit="10"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="stroke-[#EA2831]"
                />
                <path
                  d="m21.874,7l-2.874-5H5l-2.874,5c.444,1.725,2.01,3,3.874,3,1.202,0,2.267-.541,3-1.38.733.839,1.798,1.38,3,1.38s2.267-.541,3-1.38c.733.839,1.798,1.38,3,1.38,1.864,0,3.43-1.275,3.874-3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeMiterlimit="10"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="stroke-[#EA2831]"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Available Jobs</h3>
              <p className="text-sm text-muted-foreground">
                Browse open jobs in your area
              </p>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href="/app/contractor/jobs/feed">View Jobs</Link>
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <svg
                className="size-[18px]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 6V2H16V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  fill="none"
                  strokeLinejoin="round"
                  className="stroke-blue-500"
                />
                <path
                  d="M10 13H4C2.89543 13 2 12.1046 2 11V6H22V11C22 12.1046 21.1046 13 20 13H14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  fill="none"
                  strokeLinejoin="round"
                  className="stroke-blue-500"
                />
                <path
                  d="M2 17V21H22V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  fill="none"
                  strokeLinejoin="round"
                  className="stroke-blue-500"
                />
                <path
                  d="M14 12H10V15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15V12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  strokeLinejoin="round"
                  className="stroke-blue-500"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Jobs</h3>
              <p className="text-sm text-muted-foreground">
                View your active jobs
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/contractor/my-jobs">My Jobs</Link>
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6 text-green-500"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Availability</h3>
              <p className="text-sm text-muted-foreground">
                Manage your schedule
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/contractor/availability">Set Availability</Link>
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
                Your contractor profile is set up
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Set Your Availability</p>
              <p className="text-muted-foreground">
                Let homeowners know when you're available to work
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Browse Available Jobs</p>
              <p className="text-muted-foreground">
                Find and accept jobs in your service area
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-muted-foreground"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Service Area</h4>
            <p className="text-sm text-muted-foreground">
              You're serving within {profile?.service_radius_miles} miles of{" "}
              {profile?.service_base_city}, {profile?.service_base_state}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
