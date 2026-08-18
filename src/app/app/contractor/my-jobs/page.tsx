"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard } from "@/components/app/job-card";
import { useGetMyJobsQuery } from "@/store/api/jobs-api";

export default function MyJobsPage() {
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your accepted and in-progress installations
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your accepted and in-progress installations
          </p>
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
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No active jobs yet</p>
                  <p className="text-sm mt-2">
                    Accept jobs from the Available Jobs page to get started
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} role="contractor" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No past jobs</p>
                  <p className="text-sm mt-2">
                    Completed and cancelled jobs will appear here
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pastJobs.map((job) => (
                  <JobCard key={job.id} job={job} role="contractor" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
