import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type RouteParams = { id: string; messageId: string };

interface ReactionPayload {
  emoji: string;
}

async function getSupabaseWithAuth(req: NextRequest) {
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
          req.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: conversationId, messageId } = await params;
    const { emoji } = (await req.json()) as ReactionPayload;

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    const { supabase, user, response } = await getSupabaseWithAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("homeowner_id, contractor_id")
      .eq("id", conversationId)
      .single();

    if (
      !conversation ||
      (conversation.homeowner_id !== user.id &&
        conversation.contractor_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch current reactions
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("reactions")
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const reactions = (message.reactions as any[]) || [];

    const existing = reactions.find((r) => r.emoji === emoji);
    let updatedReactions;

    if (existing) {
      if (existing.userIds?.includes(user.id)) {
        // Already reacted with this emoji – no-op
        updatedReactions = reactions;
      } else {
        updatedReactions = reactions.map((r) =>
          r.emoji === emoji
            ? {
                ...r,
                userIds: [...(r.userIds || []), user.id],
                count: (r.count || 0) + 1,
              }
            : r
        );
      }
    } else {
      updatedReactions = [
        ...reactions,
        { emoji, userIds: [user.id], count: 1 },
      ];
    }

    const { error: updateError } = await supabase
      .from("messages")
      .update({ reactions: updatedReactions })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error updating reactions:", updateError);
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    console.error("Add reaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add reaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: conversationId, messageId } = await params;
    const { emoji } = (await req.json()) as ReactionPayload;

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    const { supabase, user, response } = await getSupabaseWithAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("homeowner_id, contractor_id")
      .eq("id", conversationId)
      .single();

    if (
      !conversation ||
      (conversation.homeowner_id !== user.id &&
        conversation.contractor_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("reactions")
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const reactions = (message.reactions as any[]) || [];

    const updatedReactions = reactions
      .map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              userIds: (r.userIds || []).filter((id: string) => id !== user.id),
              count: Math.max((r.count || 1) - 1, 0),
            }
          : r
      )
      .filter((r) => r.count > 0);

    const { error: updateError } = await supabase
      .from("messages")
      .update({ reactions: updatedReactions })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error removing reaction:", updateError);
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    console.error("Remove reaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove reaction" },
      { status: 500 }
    );
  }
}


