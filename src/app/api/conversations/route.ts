import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get user's conversations
 *     description: Retrieve all conversations for the authenticated user (as homeowner or contractor)
 *     tags: [Messaging]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch conversations
 */
export async function GET(req: NextRequest) {
  try {
    // Create response object for cookie handling
    let response = NextResponse.json({});

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: "",
              ...options,
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch conversations where user is either homeowner or contractor
    // Fetch as homeowner first
    const { data: asHomeowner, error: error1 } = await supabase
      .from("conversations")
      .select(
        `
        id,
        job_id,
        homeowner_id,
        contractor_id,
        created_at,
        updated_at,
        last_message_at
      `
      )
      .eq("homeowner_id", user.id)
      .order("last_message_at", { ascending: false });

    // Fetch as contractor
    const { data: asContractor, error: error2 } = await supabase
      .from("conversations")
      .select(
        `
        id,
        job_id,
        homeowner_id,
        contractor_id,
        created_at,
        updated_at,
        last_message_at
      `
      )
      .eq("contractor_id", user.id)
      .order("last_message_at", { ascending: false });

    if (error1 || error2) {
      console.error("Error fetching conversations:", error1 || error2);
      return NextResponse.json(
        { error: "Failed to fetch conversations", details: (error1 || error2)?.message },
        { status: 500 }
      );
    }

    // Combine and deduplicate conversations, then sort by last_message_at
    const allConversations = [...(asHomeowner || []), ...(asContractor || [])];
    const uniqueConversations = Array.from(
      new Map(allConversations.map((conv) => [conv.id, conv])).values()
    );
    const conversations = uniqueConversations.sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
    );

    // Enrich conversations with job and profile data
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Fetch job details
        const { data: job } = await supabase
          .from("jobs")
          .select("id, address, city, state, zip, status, contractor_payout_cents, total_price_cents")
          .eq("id", conv.job_id)
          .single();

        // Fetch homeowner profile
        const { data: homeowner } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", conv.homeowner_id)
          .single();

        // Fetch contractor profile
        const { data: contractor } = await supabase
          .from("profiles")
          .select("id, full_name, business_name")
          .eq("id", conv.contractor_id)
          .single();

        return {
          ...conv,
          jobs: job || null,
          homeowner: homeowner || null,
          contractor: contractor || null,
        };
      })
    );

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      enrichedConversations.map(async (conv) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        return {
          ...conv,
          unread_count: count || 0,
        };
      })
    );

    return NextResponse.json(
      { conversations: conversationsWithUnread },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

