"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { formatCurrency, formatDate, capitalize } from "@/utils/format";
import { supabase } from "@/lib/supabase";
import { Pencil } from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<any[]>([]);

  // Check if job can be edited
  const canEdit = job && job.status === "open" && (!job.contractor_id || job.contractor_id === null);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  async function loadJobDetails() {
    const { data: jobData } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobData) {
      setJob(jobData);

      // Load contractor info if assigned
      if (jobData.contractor_id) {
        const { data: contractorData } = await supabase
          .from("profiles")
          .select("full_name, business_name, phone")
          .eq("id", jobData.contractor_id)
          .single();

        setContractor(contractorData);
      }

      // Load photos
      try {
        const photosResponse = await fetch(`/api/jobs/${jobId}/photos`);
        if (photosResponse.ok) {
          const { photos: photosData } = await photosResponse.json();
          setPhotos(photosData || []);
        }
      } catch (photoError) {
        console.error("Error loading photos:", photoError);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Job Not Found</h1>
        <Button asChild>
          <Link href="/app/homeowner/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{job.address}</h1>
          <p className="text-muted-foreground mt-1">
            {job.city}, {job.state} {job.zip}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/app/homeowner/jobs/${jobId}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Job
              </Link>
            </Button>
          )}
          <StatusBadge status={job.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos Section */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Reference Photos</h3>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                      photo.is_cover
                        ? "border-primary ring-2 ring-primary"
                        : "border-muted"
                    }`}
                  >
                    {photo.url && (
                      <Image
                        src={photo.url}
                        alt={`Job photo ${photo.id}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    )}
                    {photo.is_cover && (
                      <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 text-sm text-muted-foreground">No photos uploaded yet</p>
                {canEdit && (
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={`/app/homeowner/jobs/${jobId}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Add Photos
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Job Details Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Stories:</span>
                  <p className="font-medium">{job.num_stories}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">House Size:</span>
                  <p className="font-medium capitalize">{job.house_size}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Light Length:</span>
                  <p className="font-medium">{job.estimated_length_feet} ft</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Complexity:</span>
                  <p className="font-medium capitalize">{job.complexity}</p>
                </div>
              </div>
              <div className="flex gap-4">
                {job.lights_provided && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✓</span>
                    <span>Lights Provided</span>
                  </div>
                )}
                {job.storage_needed && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✓</span>
                    <span>Storage Needed</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Contractor Info (if assigned) */}
          {contractor && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Contractor Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Business Name:</span>
                  <p className="font-medium">{contractor.business_name || contractor.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact Name:</span>
                  <p className="font-medium">{contractor.full_name}</p>
                </div>
                {contractor.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{contractor.phone}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{formatDate(job.created_at)}</p>
              </div>
              {job.requested_date_start && (
                <div>
                  <span className="text-muted-foreground">Requested Start:</span>
                  <p className="font-medium">{formatDate(job.requested_date_start)}</p>
                </div>
              )}
              {job.assigned_at && (
                <div>
                  <span className="text-muted-foreground">Assigned:</span>
                  <p className="font-medium">{formatDate(job.assigned_at)}</p>
                </div>
              )}
              {job.completed_at && (
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">{formatDate(job.completed_at)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pricing Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price:</span>
                <span className="font-medium">{formatCurrency(job.base_price_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complexity:</span>
                <span className="font-medium">{formatCurrency(job.complexity_addon_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Options:</span>
                <span className="font-medium">{formatCurrency(job.options_addon_cents)}</span>
              </div>
              {job.tip_amount_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip:</span>
                  <span className="font-medium">{formatCurrency(job.tip_amount_cents)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(job.total_price_cents)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app/homeowner/jobs">Back to Jobs</Link>
            </Button>
            {job.status === "open" && (
              <Button variant="destructive" className="w-full">
                Cancel Job
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
