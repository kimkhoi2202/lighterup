"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  MapPin,
  Clock,
  Calendar,
  Award,
  Search,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  businessName: string | null;
  bio: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  location: {
    city: string | null;
    state: string | null;
    serviceRadius: number | null;
  };
  yearsInBusiness: number | null;
  eventType: {
    title: string | null;
    description: string | null;
    durationMinutes: number | null;
    priceCents: number | null;
    currency: string | null;
  };
  slug: string | null;
}

// Wrapper component with Suspense for useSearchParams
export default function BrowseContractorsPage() {
  return (
    <Suspense fallback={<BrowseContractorsLoading />}>
      <BrowseContractorsContent />
    </Suspense>
  );
}

function BrowseContractorsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Find a Contractor</h1>
        <p className="text-muted-foreground mt-2">
          Browse available contractors to help with your project
        </p>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function BrowseContractorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId");

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/homeowner/contractors");
      if (!response.ok) {
        throw new Error("Failed to load contractors");
      }

      const data = await response.json();
      setContractors(data.contractors);
    } catch (err: any) {
      console.error("Error fetching contractors:", err);
      setError(err.message || "Failed to load contractors");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Filter contractors by search query
  const filteredContractors = contractors.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.businessName?.toLowerCase().includes(query) ||
      c.location.city?.toLowerCase().includes(query) ||
      c.tagline?.toLowerCase().includes(query)
    );
  });

  const handleBookContractor = (contractorId: string) => {
    // Pass job ID to booking page if we have one
    const bookingUrl = jobId
      ? `/book/${contractorId}?jobId=${jobId}`
      : `/book/${contractorId}`;
    router.push(bookingUrl);
  };

  const handleViewProfile = (contractor: Contractor) => {
    // If contractor has a public slug, use that; otherwise use ID
    const profileUrl = contractor.slug
      ? `/contractor/${contractor.slug}${jobId ? `?jobId=${jobId}` : ""}`
      : `/book/${contractor.id}${jobId ? `?jobId=${jobId}` : ""}`;
    router.push(profileUrl);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Find a Contractor</h1>
          <p className="text-muted-foreground mt-2">
            Browse available contractors to help with your project
          </p>
        </div>

        {/* Loading state */}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Find a Contractor</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchContractors}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {jobId && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Job Created
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Find a Contractor</h1>
        <p className="text-muted-foreground mt-2">
          {jobId
            ? "Great! Your job has been created. Now select a contractor to book with."
            : "Browse available contractors to help with your project"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, business, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contractor Grid */}
      {filteredContractors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No contractors found matching your search."
              : "No contractors available at this time."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContractors.map((contractor) => {
            const displayName = contractor.businessName || contractor.name;

            return (
              <Card
                key={contractor.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header with Avatar */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {contractor.avatarUrl ? (
                        <img
                          src={contractor.avatarUrl}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl font-bold shadow">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {displayName}
                      </h3>
                      {contractor.tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {contractor.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location & Experience Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {contractor.location.city && contractor.location.state && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {contractor.location.city}, {contractor.location.state}
                      </Badge>
                    )}
                    {contractor.yearsInBusiness && (
                      <Badge variant="secondary" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {contractor.yearsInBusiness} yrs
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                {contractor.eventType.title && (
                  <div className="px-6 pb-4">
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {contractor.eventType.title}
                          </p>
                          {contractor.eventType.durationMinutes && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {contractor.eventType.durationMinutes} min
                            </p>
                          )}
                        </div>
                        {contractor.eventType.priceCents !== null && (
                          <p className="text-sm font-semibold text-zinc-900 shrink-0 ml-2">
                            {formatPrice(contractor.eventType.priceCents)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewProfile(contractor)}
                  >
                    View Profile
                  </Button>
                  <Button
                    className="flex-1 bg-[#EA2831] hover:bg-[#EA2831]/90"
                    onClick={() => handleBookContractor(contractor.id)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      {jobId && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">How it works</h3>
              <p className="text-sm text-blue-700 mt-1">
                When you book with a contractor, they&apos;ll receive your job details 
                and can schedule the installation at a time that works for both of you.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

