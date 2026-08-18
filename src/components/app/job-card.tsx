"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { JobDetailsDialog } from "./job-details-dialog";
import { formatCurrency, formatDateShort } from "@/utils/format";
import { Pencil } from "lucide-react";

interface Job {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  total_price_cents: number;
  contractor_payout_cents: number;
  created_at: string;
  requested_date_start: string | null;
  complexity: string;
  contractor_id?: string | null;
  cover_image_url?: string | null;
}

interface JobCardProps {
  job: Job;
  role?: "homeowner" | "contractor";
}

export function JobCard({ job, role = "homeowner" }: JobCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const baseUrl = role === "homeowner" ? "/app/homeowner/jobs" : "/app/contractor/jobs";
  
  // Check if job can be edited (homeowner only, unassigned, open status)
  const canEdit = role === "homeowner" && 
                  job.status === "open" && 
                  (!job.contractor_id || job.contractor_id === null);

  // For contractors, show dialog on click
  if (role === "contractor") {
    const cardContent = (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer pt-0! pb-0!">
        {/* Cover image or default placeholder */}
        <div className="relative h-48 w-full bg-linear-to-br from-gray-100 to-gray-200">
          {job.cover_image_url ? (
            <Image
              src={job.cover_image_url}
              alt={`${job.address} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <p className="mt-2 text-xs text-gray-500">No cover image</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {job.address}
              </h3>
              <p className="text-sm text-muted-foreground">
                {job.city}, {job.state} {job.zip}
              </p>
            </div>
            <StatusBadge status={job.status as any} />
          </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Your Payout</p>
            <p className="text-lg font-semibold">
              {formatCurrency(job.contractor_payout_cents)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Complexity</p>
            <p className="text-sm font-medium capitalize">{job.complexity}</p>
          </div>
        </div>

        {job.requested_date_start && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Requested Date</p>
            <p className="text-sm">{formatDateShort(job.requested_date_start)}</p>
          </div>
        )}
        </div>
      </Card>
    );

    return (
      <>
        <div onClick={() => setDialogOpen(true)}>{cardContent}</div>
        <JobDetailsDialog
          jobId={job.id}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          role="contractor"
        />
      </>
    );
  }

  // For homeowners, show card with edit button
  // Determine the link destination: edit page if editable, detail page otherwise
  const cardLink = canEdit ? `${baseUrl}/${job.id}/edit` : `${baseUrl}/${job.id}`;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow pt-0! pb-0!">
      <Link href={cardLink} className="block">
        {/* Cover image or default placeholder */}
        <div className="relative h-48 w-full bg-linear-to-br from-gray-100 to-gray-200">
          {job.cover_image_url ? (
            <Image
              src={job.cover_image_url}
              alt={`${job.address} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <p className="mt-2 text-xs text-gray-500">No cover image</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {job.address}
              </h3>
              <p className="text-sm text-muted-foreground">
                {job.city}, {job.state} {job.zip}
              </p>
            </div>
            <StatusBadge status={job.status as any} />
          </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {role === "homeowner" ? "Total Price" : "Your Payout"}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(
                role === "homeowner"
                  ? job.total_price_cents
                  : job.contractor_payout_cents
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Complexity</p>
            <p className="text-sm font-medium capitalize">{job.complexity}</p>
          </div>
        </div>

        {job.requested_date_start && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Requested Date</p>
            <p className="text-sm">{formatDateShort(job.requested_date_start)}</p>
          </div>
        )}
        </div>
      </Link>
    </Card>
  );
}
