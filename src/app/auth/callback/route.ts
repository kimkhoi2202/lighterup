import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth?error=auth_callback_error`
        );
      }

      // Get the user after successful exchange
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists and is complete
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, profile_completed_at")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // No profile yet, redirect to role selection
          return NextResponse.redirect(
            `${requestUrl.origin}/auth/onboarding/role`
          );
        } else if (!profile.profile_completed_at) {
          // Profile exists but not complete
          return NextResponse.redirect(
            `${requestUrl.origin}/auth/onboarding/${profile.role}`
          );
        } else {
          // Profile complete, redirect to dashboard or next URL
          const redirectUrl = next.startsWith("/")
            ? `${requestUrl.origin}${next}`
            : `${requestUrl.origin}/app/${profile.role}/dashboard`;
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error("Callback error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=auth_callback_error`
      );
    }
  }

  // No code provided, redirect to auth page
  return NextResponse.redirect(`${requestUrl.origin}/auth`);
}
