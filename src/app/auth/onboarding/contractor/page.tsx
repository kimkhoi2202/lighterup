"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ContractorOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceBaseAddress, setServiceBaseAddress] = useState("");
  const [serviceBaseCity, setServiceBaseCity] = useState("");
  const [serviceBaseState, setServiceBaseState] = useState("");
  const [serviceBaseZip, setServiceBaseZip] = useState("");
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState("25");
  const [baseHourlyRate, setBaseHourlyRate] = useState("");

  useEffect(() => {
    // Load existing profile data if available
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setBusinessName(profile.business_name || "");
        setPhone(profile.phone || "");
        setServiceBaseAddress(profile.service_base_address || "");
        setServiceBaseCity(profile.service_base_city || "");
        setServiceBaseState(profile.service_base_state || "");
        setServiceBaseZip(profile.service_base_zip || "");
        setServiceRadiusMiles(profile.service_radius_miles?.toString() || "25");
        setBaseHourlyRate(
          profile.base_hourly_rate_cents
            ? (profile.base_hourly_rate_cents / 100).toString()
            : ""
        );
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Convert hourly rate to cents
      const rateCents = baseHourlyRate
        ? Math.round(parseFloat(baseHourlyRate) * 100)
        : null;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          business_name: businessName,
          phone: phone,
          service_base_address: serviceBaseAddress,
          service_base_city: serviceBaseCity,
          service_base_state: serviceBaseState,
          service_base_zip: serviceBaseZip,
          service_radius_miles: parseInt(serviceRadiusMiles),
          base_hourly_rate_cents: rateCents,
          is_active: true,
          profile_completed_at: new Date().toISOString(),
          onboarding_step: "completed",
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Redirect to contractor dashboard
      router.push("/app/contractor/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Left Column - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background overflow-y-auto">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-[#EA2831] text-white flex size-6 items-center justify-center rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            Lighter Up
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">Set Up Your Business</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Tell us about your light installation services
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Festive Lights Co."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 202-555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseHourlyRate">Base Hourly Rate ($)</Label>
                  <Input
                    id="baseHourlyRate"
                    type="number"
                    placeholder="75"
                    value={baseHourlyRate}
                    onChange={(e) => setBaseHourlyRate(e.target.value)}
                    required
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Service Area</h3>

                  <div className="space-y-2">
                    <Label htmlFor="serviceBaseAddress">Base Address</Label>
                    <Input
                      id="serviceBaseAddress"
                      type="text"
                      placeholder="123 Main Street"
                      value={serviceBaseAddress}
                      onChange={(e) => setServiceBaseAddress(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceBaseCity">City</Label>
                      <Input
                        id="serviceBaseCity"
                        type="text"
                        placeholder="Austin"
                        value={serviceBaseCity}
                        onChange={(e) => setServiceBaseCity(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceBaseState">State</Label>
                      <Input
                        id="serviceBaseState"
                        type="text"
                        placeholder="TX"
                        value={serviceBaseState}
                        onChange={(e) => setServiceBaseState(e.target.value)}
                        required
                        disabled={loading}
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceBaseZip">ZIP Code</Label>
                    <Input
                      id="serviceBaseZip"
                      type="text"
                      placeholder="78701"
                      value={serviceBaseZip}
                      onChange={(e) => setServiceBaseZip(e.target.value)}
                      required
                      disabled={loading}
                      maxLength={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceRadiusMiles">Service Radius (miles)</Label>
                    <Input
                      id="serviceRadiusMiles"
                      type="number"
                      placeholder="25"
                      value={serviceRadiusMiles}
                      onChange={(e) => setServiceRadiusMiles(e.target.value)}
                      required
                      disabled={loading}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Complete Setup"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Background Image */}
      <div className="relative hidden lg:block bg-[#0098e4]">
        <img
          src="/snow-globe-city-animation.svg"
          alt="Snow globe city animation"
          className="absolute inset-0 h-full w-full object-cover object-[30%]"
        />
      </div>
    </>
  );
}
