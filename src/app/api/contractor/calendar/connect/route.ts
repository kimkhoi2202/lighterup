import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

/**
 * Initiate Google Calendar OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            req.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a contractor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "contractor") {
      return NextResponse.json(
        { error: "Only contractors can connect calendars" },
        { status: 403 }
      );
    }

    // Generate OAuth URL
    const authUrl = getGoogleAuthUrl(user.id);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error initiating OAuth:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}

