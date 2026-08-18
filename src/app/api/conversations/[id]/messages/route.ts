import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     description: Retrieve all messages in a conversation
 *     tags: [Messaging]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not part of this conversation
 *       500:
 *         description: Failed to fetch messages
 *   post:
 *     summary: Send a message in a conversation
 *     description: Create a new message in a conversation
 *     tags: [Messaging]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not part of this conversation
 *       500:
 *         description: Failed to send message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

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

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("homeowner_id, contractor_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (
      conversation.homeowner_id !== user.id &&
      conversation.contractor_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get cursor from query params for pagination
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const MESSAGES_BATCH = 30;

    // Build query for cursor-based pagination
    // Note: Supabase doesn't support nested selects with foreign keys directly,
    // so we'll fetch replied_to_message separately if needed
    let query = supabase
      .from("messages")
      .select(
      `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at,
        edited_at,
        deleted_at,
        reply_to_message_id,
        reactions,
        is_pinned,
        sender:sender_id (
          id,
          full_name,
          business_name
        )
      `
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_BATCH);

    // If cursor exists, fetch messages before that cursor
    if (cursor) {
      // Get the cursor message to find its created_at timestamp
      const { data: cursorMessage } = await supabase
        .from("messages")
        .select("created_at")
        .eq("id", cursor)
        .single();

      if (cursorMessage) {
        query = query.lt("created_at", cursorMessage.created_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Determine next cursor
    let nextCursor = null;
    if (messages && messages.length === MESSAGES_BATCH) {
      nextCursor = messages[messages.length - 1].id;
    }

    // Reverse messages to show oldest first (for display)
    const reversedMessages = messages ? [...messages].reverse() : [];

    // Fetch replied-to messages for messages that have reply_to_message_id
    const replyIds = reversedMessages
      .filter((m: any) => m.reply_to_message_id)
      .map((m: any) => m.reply_to_message_id);

    let repliedToMessages: any[] = [];
    if (replyIds.length > 0) {
      const { data: repliedTo } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          sender:sender_id (
            id,
            full_name,
            business_name
          )
        `
        )
        .in("id", replyIds);

      repliedToMessages = repliedTo || [];
    }

    // Create a map for quick lookup
    const repliedToMap = new Map(
      repliedToMessages.map((m: any) => [m.id, m])
    );

    // Attach replied_to_message data to each message
    const messagesWithReplies = reversedMessages.map((message: any) => {
      if (message.reply_to_message_id && repliedToMap.has(message.reply_to_message_id)) {
        return {
          ...message,
          replied_to_message: repliedToMap.get(message.reply_to_message_id),
        };
      }
      return message;
    });

    // Mark messages as read
    await supabase.rpc("mark_messages_as_read", {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });

    return NextResponse.json(
      {
        items: messagesWithReplies,
        nextCursor,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { content, reply_to_message_id } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

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

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("homeowner_id, contractor_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (
      conversation.homeowner_id !== user.id &&
      conversation.contractor_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify reply_to_message_id if provided
    if (reply_to_message_id) {
      const { data: repliedToMessage } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .eq("id", reply_to_message_id)
        .single();

      if (!repliedToMessage || repliedToMessage.conversation_id !== conversationId) {
        return NextResponse.json(
          { error: "Invalid reply target" },
          { status: 400 }
        );
      }
    }

    // Create message
    const messageData: any = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    };

    // Only include reply_to_message_id if it's provided
    // Note: This requires the migration to be applied first
    if (reply_to_message_id) {
      messageData.reply_to_message_id = reply_to_message_id;
    }

    // Build select query - conditionally include reply_to_message_id
    // If migration hasn't been applied, we'll get an error, but we handle it below
    let selectFields = `
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      read_at,
      edited_at,
      deleted_at,
      reactions,
      is_pinned,
      sender:sender_id (
        id,
        full_name,
        business_name
      )
    `;

    // Try to include reply_to_message_id - if column doesn't exist, we'll catch the error
    // First attempt: try with reply_to_message_id
    let result = await supabase
      .from("messages")
      .insert(messageData)
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at,
        edited_at,
        deleted_at,
        reply_to_message_id,
        reactions,
        is_pinned,
        sender:sender_id (
          id,
          full_name,
          business_name
        )
      `)
      .single();

    let message: any = result.data;
    let error: any = result.error;

    // If error is due to missing column, retry without reply_to_message_id
    if (error && (error.message?.includes("reply_to_message_id") || error.code === "42703")) {
      // Remove reply_to_message_id from messageData if it was included
      const retryMessageData = { ...messageData };
      delete retryMessageData.reply_to_message_id;
      
      const retryResult = await supabase
        .from("messages")
        .insert(retryMessageData)
        .select(selectFields)
        .single();
      
      if (retryResult.data) {
        message = retryResult.data;
        error = retryResult.error;
      }
    }

    if (error) {
      console.error("Error creating message:", error);

      // Only treat as a reply_to_message_id migration issue if the error
      // explicitly references that column. Other column errors (e.g. new
      // fields like reactions / is_pinned) should surface their real message.
      const isReplyColumnMissing =
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("reply_to_message_id");

      if (isReplyColumnMissing) {
        return NextResponse.json(
          {
            error:
              "Database migration required. Please apply the migration to add reply_to_message_id column to messages table.",
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

