"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Role = "homeowner" | "contractor";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Check if profile already exists (created by database trigger)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role, onboarding_step")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        // Profile already exists (auto-created by trigger)
        // Update it with the selected role and onboarding step
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: selectedRole,
            onboarding_step: `${selectedRole}_profile`,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      } else {
        // Profile doesn't exist yet, create it
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          role: selectedRole,
          full_name: "", // Will be filled in next step
          onboarding_step: `${selectedRole}_profile`,
        });

        // Handle duplicate key error gracefully (race condition with trigger)
        if (profileError) {
          if (profileError.code === "23505") {
            // Profile was just created by trigger, update it instead
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                role: selectedRole,
                onboarding_step: `${selectedRole}_profile`,
              })
              .eq("id", user.id);

            if (updateError) throw updateError;
          } else {
            throw profileError;
          }
        }
      }

      // Redirect to role-specific onboarding
      router.push(`/auth/onboarding/${selectedRole}`);
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Left Column - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
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
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="space-y-8">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">Choose Your Account Type</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Select how you'll be using Lighter Up
                </p>
              </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Homeowner Card */}
        <button
          onClick={() => setSelectedRole("homeowner")}
          className={`flex flex-col items-start gap-4 rounded-lg border p-6 text-left transition-all ${
            selectedRole === "homeowner"
              ? "border-secondary bg-secondary/5 ring-2 ring-secondary"
              : "border-border bg-card hover:border-secondary/50"
          }`}
          disabled={loading}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6 text-secondary"
            >
              <path d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">I'm a Homeowner</h3>
            <p className="text-sm text-muted-foreground">
              Find and hire the best holiday light installers in your area
            </p>
          </div>
        </button>

        {/* Contractor Card */}
        <button
          onClick={() => setSelectedRole("contractor")}
          className={`flex flex-col items-start gap-4 rounded-lg border p-6 text-left transition-all ${
            selectedRole === "contractor"
              ? "border-secondary bg-secondary/5 ring-2 ring-secondary"
              : "border-border bg-card hover:border-secondary/50"
          }`}
          disabled={loading}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6 text-secondary"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">I'm a Contractor</h3>
            <p className="text-sm text-muted-foreground">
              Get connected with homeowners and grow your installation business
            </p>
          </div>
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

              <Button
                onClick={handleContinue}
                className="w-full"
                disabled={!selectedRole || loading}
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
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
