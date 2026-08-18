"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Clock,
  Globe,
  Phone,
  Mail,
  Instagram,
  ExternalLink,
  Calendar,
  Building2,
  Award,
} from "lucide-react";

interface PublicProfile {
  id: string;
  name: string;
  businessName: string | null;
  bio: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  yearsInBusiness: number | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  phone: string | null;
  location: {
    city: string | null;
    state: string | null;
    serviceRadius: number | null;
  };
  eventType: {
    title: string | null;
    description: string | null;
    durationMinutes: number | null;
    priceCents: number | null;
    currency: string | null;
    locationOptions: any;
  };
  slug: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const jobId = searchParams.get("jobId");

  // Build booking URL with optional jobId
  const getBookingUrl = (contractorId: string) => {
    return jobId ? `/book/${contractorId}?jobId=${jobId}` : `/book/${contractorId}`;
  };

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/public/contractor/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Contractor not found");
        } else {
          throw new Error("Failed to load profile");
        }
        return;
      }
      const data = await response.json();
      setProfile(data.profile);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">
            {error || "Profile not found"}
          </h1>
          <p className="text-muted-foreground mb-4">
            This contractor profile may not exist or is not public.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const displayName = profile.businessName || profile.name;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
                {displayName}
              </h1>
              {profile.tagline && (
                <p className="text-lg text-muted-foreground mt-1">
                  {profile.tagline}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4">
                {profile.location.city && profile.location.state && (
                  <Badge variant="secondary" className="text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.location.city}, {profile.location.state}
                  </Badge>
                )}
                {profile.yearsInBusiness && (
                  <Badge variant="secondary" className="text-sm">
                    <Award className="h-3 w-3 mr-1" />
                    {profile.yearsInBusiness} years experience
                  </Badge>
                )}
                {profile.location.serviceRadius && (
                  <Badge variant="secondary" className="text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.location.serviceRadius} mi radius
                  </Badge>
                )}
              </div>
            </div>

            {/* Book Button */}
            <div className="w-full md:w-auto">
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link href={getBookingUrl(profile.id)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  About
                </h2>
                <p className="text-zinc-700 whitespace-pre-wrap">{profile.bio}</p>
              </Card>
            )}

            {/* Services */}
            {profile.eventType.title && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Services
                </h2>
                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        {profile.eventType.title}
                      </h3>
                      {profile.eventType.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile.eventType.description}
                        </p>
                      )}
                    </div>
                    {profile.eventType.priceCents !== null && (
                      <div className="text-right">
                        <p className="text-lg font-semibold text-zinc-900">
                          {formatPrice(profile.eventType.priceCents)}
                        </p>
                      </div>
                    )}
                  </div>
                  {profile.eventType.durationMinutes && (
                    <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{profile.eventType.durationMinutes} minutes</span>
                    </div>
                  )}
                  <Button asChild className="w-full mt-4">
                    <Link href={getBookingUrl(profile.id)}>Book This Service</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3">Contact</h2>
              <div className="space-y-3">
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {profile.email}
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {profile.phone}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </Card>

            {/* Social */}
            {(profile.instagram || profile.facebook) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3">Social</h2>
                <div className="space-y-3">
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                    >
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      {profile.instagram}
                    </a>
                  )}
                  {profile.facebook && (
                    <a
                      href={profile.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                    >
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Book CTA */}
            <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
              <h2 className="text-lg font-semibold mb-2">Ready to book?</h2>
              <p className="text-sm text-red-100 mb-4">
                Schedule an appointment with {profile.businessName || profile.name}
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href={getBookingUrl(profile.id)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

