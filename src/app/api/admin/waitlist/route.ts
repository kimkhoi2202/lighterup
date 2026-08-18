import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * @swagger
 * /api/admin/waitlist:
 *   get:
 *     summary: Get all waitlist entries
 *     description: Retrieve all waitlist entries. Requires admin authentication.
 *     tags: [Admin]
 *     security:
 *       - adminCookieAuth: []
 *     responses:
 *       200:
 *         description: Waitlist entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WaitlistEntry'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch waitlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated
        const cookieStore = await cookies();
        const isAuthenticated = cookieStore.get("admin_authenticated")?.value === "true";

        if (!isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all waitlist entries using admin client (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from("waitlist")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching waitlist:", error);
            return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error in waitlist API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

