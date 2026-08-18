import { NextRequest, NextResponse } from "next/server";
import { calculateAvailableSlots, getContractorAvailabilityForRange } from "@/lib/scheduling/slot-calculator";
import { parseISO, isValid } from "date-fns";

/**
 * @swagger
 * /api/availability/slots:
 *   post:
 *     summary: Get available time slots for a contractor
 *     description: Calculate available booking slots for a contractor on a specific date or date range
 *     tags: [Availability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractorId
 *               - date
 *             properties:
 *               contractorId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 description: ISO date string (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Optional end date for range query
 *               duration:
 *                 type: number
 *                 description: Job duration in minutes (default 240)
 *               scheduleId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional specific schedule ID
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date-time
 *                           end:
 *                             type: string
 *                             format: date-time
 *                           available:
 *                             type: boolean
 *                           conflictReason:
 *                             type: string
 *                 - type: object
 *                   properties:
 *                     availability:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractorId, date, endDate, duration = 240, scheduleId } = body;

    // Validation
    if (!contractorId) {
      return NextResponse.json(
        { error: "contractorId is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Parse date
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Check if range query
    if (endDate) {
      const parsedEndDate = parseISO(endDate);
      if (!isValid(parsedEndDate)) {
        return NextResponse.json(
          { error: "Invalid endDate format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }

      // Get availability for date range
      const availabilityMap = await getContractorAvailabilityForRange(
        contractorId,
        parsedDate,
        parsedEndDate,
        duration
      );

      // Convert Map to plain object
      const availability: Record<string, any[]> = {};
      availabilityMap.forEach((slots, dateKey) => {
        availability[dateKey] = slots.map((slot) => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          available: slot.available,
          conflictReason: slot.conflictReason,
        }));
      });

      return NextResponse.json({ availability });
    }

    // Single date query
    const slots = await calculateAvailableSlots({
      contractorId,
      date: parsedDate,
      duration,
      scheduleId,
    });

    // Format response
    const formattedSlots = slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      available: slot.available,
      conflictReason: slot.conflictReason,
    }));

    return NextResponse.json({
      date: date,
      contractorId,
      duration,
      totalSlots: slots.length,
      availableSlots: slots.filter((s) => s.available).length,
      slots: formattedSlots,
    });
  } catch (error: any) {
    console.error("Error calculating available slots:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to calculate available slots",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/availability/slots:
 *   get:
 *     summary: Check if contractor has availability
 *     description: Quick check if a contractor has any availability on a specific date
 *     tags: [Availability]
 *     parameters:
 *       - in: query
 *         name: contractorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: duration
 *         schema:
 *           type: number
 *           default: 240
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAvailability:
 *                   type: boolean
 *                 date:
 *                   type: string
 *                 contractorId:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractorId = searchParams.get("contractorId");
    const date = searchParams.get("date");
    const duration = parseInt(searchParams.get("duration") || "240");

    // Validation
    if (!contractorId) {
      return NextResponse.json(
        { error: "contractorId is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Parse date
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Calculate slots
    const slots = await calculateAvailableSlots({
      contractorId,
      date: parsedDate,
      duration,
    });

    // Check if any slots are available
    const hasAvailability = slots.some((slot) => slot.available);

    return NextResponse.json({
      hasAvailability,
      date,
      contractorId,
      availableSlotCount: slots.filter((s) => s.available).length,
      totalSlotCount: slots.length,
    });
  } catch (error: any) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to check availability",
      },
      { status: 500 }
    );
  }
}

