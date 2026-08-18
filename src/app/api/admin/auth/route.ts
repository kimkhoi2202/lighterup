import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/admin/auth:
 *   post:
 *     summary: Authenticate as admin
 *     description: Authenticate with admin password to get admin access cookie
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Check if password matches the admin password from env
        if (password === process.env.ADMIN_PASSWORD) {
            // Set a secure cookie for authentication
            const cookieStore = await cookies();
            cookieStore.set("admin_authenticated", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
    } catch (error) {
        console.error("Error in admin auth:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

