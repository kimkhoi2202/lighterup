"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function HomeownerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">Full Name:</span>
            <p className="font-medium">{profile?.full_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="font-medium">{profile?.phone || "Not provided"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Home Address:</span>
            <p className="font-medium">
              {profile?.home_address}
              <br />
              {profile?.home_city}, {profile?.home_state} {profile?.home_zip}
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-muted/50 rounded-md p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Profile editing functionality will be added in a future update.
        </p>
      </div>
    </div>
  );
}
