"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  ExternalLink,
  User,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Shield,
  Link as LinkIcon,
  Check,
  X,
  Upload,
  Trash2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  business_name: string | null;
  bio: string | null;
  tagline: string | null;
  avatar_url: string | null;
  website_url: string | null;
  years_in_business: number | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  business_email: string | null;
  license_number: string | null;
  insurance_info: string | null;
  public_slug: string | null;
  is_profile_public: boolean;
  service_base_address: string | null;
  service_base_city: string | null;
  service_base_state: string | null;
  service_base_zip: string | null;
  service_radius_miles: number | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Slug availability
  const [slugInput, setSlugInput] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/contractor/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data.profile);
      setSlugInput(data.profile.public_slug || "");
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch("/api/contractor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          public_slug: slugInput || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      const data = await response.json();
      setProfile(data.profile);
      setSlugInput(data.profile.public_slug || "");
      toast.success("Profile saved successfully");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    try {
      setCheckingSlug(true);
      const response = await fetch(
        `/api/contractor/profile/check-slug?slug=${encodeURIComponent(slug)}`
      );
      const data = await response.json();
      setSlugAvailable(data.available);
      setSlugInput(data.sanitizedSlug);
    } catch (err) {
      console.error("Error checking slug:", err);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contractor/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload image");
      }

      const data = await response.json();
      if (profile) {
        setProfile({ ...profile, avatar_url: data.avatarUrl });
      }
      toast.success("Profile picture updated!");
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    try {
      setUploadingAvatar(true);
      const response = await fetch("/api/contractor/profile/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove image");
      }

      if (profile) {
        setProfile({ ...profile, avatar_url: null });
      }
      toast.success("Profile picture removed");
    } catch (err: any) {
      console.error("Error deleting avatar:", err);
      toast.error(err.message || "Failed to remove image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{error || "Profile not found"}</p>
          <Button variant="outline" className="mt-4" onClick={fetchProfile}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const publicUrl = profile.public_slug
    ? `${window.location.origin}/contractor/${profile.public_slug}`
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your public profile information
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Personal Info */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Personal Info</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name" className="mb-0">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name || ""}
              onChange={(e) => updateField("full_name", e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tagline" className="mb-0">Tagline</Label>
            <Input
              id="tagline"
              value={profile.tagline || ""}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="e.g., Professional Christmas lights since 2015"
            />
            <p className="text-xs text-muted-foreground">
              A short one-liner about your business
            </p>
          </div>
          {/* Profile Picture Upload */}
          <div className="grid gap-2">
            <Label className="mb-0">Profile Picture</Label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-zinc-200"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
                    <User className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Upload/Delete Buttons */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profile.avatar_url ? "Change Photo" : "Upload Photo"}
                </Button>
                {profile.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={uploadingAvatar}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP or GIF. Max 5MB.
            </p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">About</h2>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="bio" className="mb-0">Bio / Description</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Tell potential clients about yourself and your business..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed on your public profile
            </p>
          </div>
        </div>
      </Card>

      {/* Business Info */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Business Info</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="business_name" className="mb-0">Business Name</Label>
            <Input
              id="business_name"
              value={profile.business_name || ""}
              onChange={(e) => updateField("business_name", e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="website_url" className="mb-0">Website</Label>
              <Input
                id="website_url"
                value={profile.website_url || ""}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="years_in_business" className="mb-0">Years in Business</Label>
              <Input
                id="years_in_business"
                type="number"
                min="0"
                value={profile.years_in_business || ""}
                onChange={(e) =>
                  updateField("years_in_business", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="e.g., 5"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Contact & Social */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Contact & Social</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone" className="mb-0 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+1 202-555-0100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business_email" className="mb-0 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Business Email
              </Label>
              <Input
                id="business_email"
                type="email"
                value={profile.business_email || ""}
                onChange={(e) => updateField("business_email", e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="instagram_handle" className="mb-0 flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram
              </Label>
              <Input
                id="instagram_handle"
                value={profile.instagram_handle || ""}
                onChange={(e) => updateField("instagram_handle", e.target.value)}
                placeholder="@yourusername"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebook_url" className="mb-0 flex items-center gap-1">
                <Facebook className="h-3 w-3" /> Facebook
              </Label>
              <Input
                id="facebook_url"
                value={profile.facebook_url || ""}
                onChange={(e) => updateField("facebook_url", e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Service Area */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Service Area</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="service_base_address" className="mb-0">Address</Label>
            <Input
              id="service_base_address"
              value={profile.service_base_address || ""}
              onChange={(e) => updateField("service_base_address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="service_base_city" className="mb-0">City</Label>
              <Input
                id="service_base_city"
                value={profile.service_base_city || ""}
                onChange={(e) => updateField("service_base_city", e.target.value)}
                placeholder="Austin"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service_base_state" className="mb-0">State</Label>
              <Input
                id="service_base_state"
                value={profile.service_base_state || ""}
                onChange={(e) => updateField("service_base_state", e.target.value)}
                placeholder="TX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service_base_zip" className="mb-0">ZIP</Label>
              <Input
                id="service_base_zip"
                value={profile.service_base_zip || ""}
                onChange={(e) => updateField("service_base_zip", e.target.value)}
                placeholder="78701"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service_radius_miles" className="mb-0">Service Radius (miles)</Label>
            <Input
              id="service_radius_miles"
              type="number"
              min="1"
              value={profile.service_radius_miles || ""}
              onChange={(e) =>
                updateField("service_radius_miles", e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="25"
            />
          </div>
        </div>
      </Card>

      {/* Professional Details */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Professional Details</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="license_number" className="mb-0">License Number</Label>
              <Input
                id="license_number"
                value={profile.license_number || ""}
                onChange={(e) => updateField("license_number", e.target.value)}
                placeholder="e.g., EC123456"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="insurance_info" className="mb-0">Insurance Info</Label>
              <Input
                id="insurance_info"
                value={profile.insurance_info || ""}
                onChange={(e) => updateField("insurance_info", e.target.value)}
                placeholder="e.g., Insured up to $1M"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Public Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-2">
          <LinkIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Public Profile</h2>
        </div>
        <div className="grid gap-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Make Profile Public</p>
              <p className="text-sm text-muted-foreground">
                Allow homeowners to view your profile and book appointments
              </p>
            </div>
            <Switch
              checked={profile.is_profile_public}
              onCheckedChange={(checked) => updateField("is_profile_public", checked)}
            />
          </div>

          {/* Custom URL */}
          <div className="grid gap-2">
            <Label htmlFor="public_slug" className="mb-0">Custom URL</Label>
            <div className="flex gap-2">
              <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                {window.location.origin}/contractor/
              </div>
              <div className="relative flex-1">
                <Input
                  id="public_slug"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value);
                    setSlugAvailable(null);
                  }}
                  onBlur={() => checkSlugAvailability(slugInput)}
                  placeholder="your-business-name"
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {!checkingSlug && slugAvailable === true && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
            {slugAvailable === false && (
              <p className="text-xs text-red-600">This URL is already taken</p>
            )}
            {slugAvailable === true && (
              <p className="text-xs text-green-600">This URL is available</p>
            )}
          </div>

          {/* Preview Link */}
          {publicUrl && profile.is_profile_public && (
            <div className="rounded-lg border bg-zinc-50 p-4">
              <p className="text-sm font-medium mb-2">Your public profile:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-sm border">
                  {publicUrl}
                </code>
                <Button variant="outline" size="sm" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}

