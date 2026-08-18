"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import HouseFilled from "@/components/icons/house-filled";
import HouseOutline from "@/components/icons/house-outline";
import WrenchFilled from "@/components/icons/wrench-filled";
import WrenchOutline from "@/components/icons/wrench-outline";

type Role = "homeowner" | "contractor";

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<SignUpFormData>();

  const selectedRole = watch("role");
  const password = watch("password");

  async function onSubmit(data: SignUpFormData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned");

      // Check if profile already exists (created by database trigger)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role, onboarding_step")
        .eq("id", authData.user.id)
        .single();

      if (existingProfile) {
        // Profile already exists (auto-created by trigger)
        // Update it with the selected role and onboarding step
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: data.role,
            onboarding_step: `${data.role}_profile`,
          })
          .eq("id", authData.user.id);

        if (updateError) throw updateError;
      } else {
        // Profile doesn't exist yet, create it
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          role: data.role,
          full_name: "",
          onboarding_step: `${data.role}_profile`,
        });

        // Handle duplicate key error gracefully (race condition with trigger)
        if (profileError) {
          if (profileError.code === "23505") {
            // Profile was just created by trigger, update it instead
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                role: data.role,
                onboarding_step: `${data.role}_profile`,
              })
              .eq("id", authData.user.id);

            if (updateError) throw updateError;
          } else {
            throw profileError;
          }
        }
      }

      // Redirect to verify email page
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setError("root", { message: err.message || "Failed to sign up" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Light Up Your Season</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Join the brightest community in Austin
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="user@example.com"
          disabled={isSubmitting}
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="pr-10"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="pr-10"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-center">
          Choose your account type
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Homeowner Card */}
          <Card
            onClick={() => setValue("role", "homeowner")}
            className={`cursor-pointer transition-all p-4 ${
              selectedRole === "homeowner"
                ? "border-primary ring-2 ring-primary"
                : "hover:border-muted-foreground/50"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center rounded-full bg-primary/10 p-2">
                {selectedRole === "homeowner" ? (
                  <HouseFilled
                    className="h-6 w-6 text-primary"
                    fill="currentColor"
                    secondaryfill="currentColor"
                  />
                ) : (
                  <HouseOutline
                    className="h-6 w-6 text-primary"
                    fill="currentColor"
                    secondaryfill="currentColor"
                  />
                )}
              </div>
              <p className="text-xs font-semibold">Homeowner</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Find installers
              </p>
            </div>
          </Card>

          {/* Contractor Card */}
          <Card
            onClick={() => setValue("role", "contractor")}
            className={`cursor-pointer transition-all p-4 ${
              selectedRole === "contractor"
                ? "border-primary ring-2 ring-primary"
                : "hover:border-muted-foreground/50"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center rounded-full bg-primary/10 p-2">
                {selectedRole === "contractor" ? (
                  <WrenchFilled
                    className="h-6 w-6 text-primary"
                    fill="currentColor"
                    secondaryfill="currentColor"
                  />
                ) : (
                  <WrenchOutline
                    className="h-6 w-6 text-primary"
                    fill="currentColor"
                    secondaryfill="currentColor"
                  />
                )}
              </div>
              <p className="text-xs font-semibold">Contractor</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Grow business
              </p>
            </div>
          </Card>
        </div>
        <input
          type="hidden"
          {...register("role", { required: "Please select an account type" })}
        />
        {errors.role && (
          <p className="text-xs text-destructive text-center">
            {errors.role.message}
          </p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
