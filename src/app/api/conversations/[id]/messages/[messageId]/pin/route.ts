import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type RouteParams = { id: string; messageId: string };

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

    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: true })
      .eq("id", messageId)
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Error pinning message:", error);
      return NextResponse.json(
        { error: "Failed to pin message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    console.error("Pin message error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to pin message" },
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

    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("id", messageId)
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Error unpinning message:", error);
      return NextResponse.json(
        { error: "Failed to unpin message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    console.error("Unpin message error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unpin message" },
      { status: 500 }
    );
  }
}


