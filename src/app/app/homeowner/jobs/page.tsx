"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard } from "@/components/app/job-card";
import { useGetMyJobsQuery } from "@/store/api/jobs-api";

export default function JobsListPage() {
  const { data: jobsData = [], isLoading } = useGetMyJobsQuery();

  const activeJobs = useMemo(
    () => jobsData.filter((job) => !["completed", "cancelled"].includes(job.status)),
    [jobsData]
  );
  const pastJobs = useMemo(
    () => jobsData.filter((job) => ["completed", "cancelled"].includes(job.status)),
    [jobsData]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your light installation jobs
          </p>
        </div>
        <Button asChild>
          <Link href="/app/homeowner/jobs/new">Create New Job</Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Jobs ({pastJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeJobs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No Active Jobs</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any active jobs yet. Create your first job to get started!
              </p>
              <Button asChild>
                <Link href="/app/homeowner/jobs/new">Create Job</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job} role="homeowner" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don't have any completed or cancelled jobs yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastJobs.map((job) => (
                <JobCard key={job.id} job={job} role="homeowner" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
