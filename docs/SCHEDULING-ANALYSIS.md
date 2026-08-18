# Cal.com Scheduling System Analysis & Recommendations

**Date:** November 19, 2025  
**Purpose:** Analyze Cal.com's scheduling system to build a similar feature for Festly

---

## 📋 Executive Summary

Cal.com is a **full-featured, enterprise-grade scheduling infrastructure** with 38.9k GitHub stars. After analyzing the codebase, I've identified the key components we can adapt for Festly's contractor-homeowner booking system.

**Good News:** Your current Festly database already has ~60% of what Cal.com uses for scheduling! We can build on top of it.

---

## 🔍 Cal.com Architecture Analysis

### **Database Schema - Key Models**

#### 1. **Schedule** (We already have similar: `availability_schedules`)
```prisma
model Schedule {
  id           Int            @id @default(autoincrement())
  userId       Int
  name         String
  timeZone     String?
  availability Availability[] // Time windows
}
```

#### 2. **Availability** (We already have similar: `availability_windows`)
```prisma
model Availability {
  id          Int       @id @default(autoincrement())
  scheduleId  Int       // Links to Schedule
  days        Int[]     // [0,1,2,3,4] for Mon-Fri
  startTime   DateTime  @db.Time
  endTime     DateTime  @db.Time
  date        DateTime? @db.Date  // For date overrides
}
```

#### 3. **EventType** (Similar to our `jobs` but for recurring event types)
```prisma
model EventType {
  id                      Int
  title                   String
  slug                    String
  length                  Int  // Duration in minutes
  scheduleId              Int
  minimumBookingNotice    Int  // Minutes before booking allowed
  beforeEventBuffer       Int  // Buffer time before
  afterEventBuffer        Int  // Buffer time after
}
```

#### 4. **Booking** (Similar to our `jobs`)
```prisma
model Booking {
  id          Int
  eventTypeId Int
  userId      Int
  startTime   DateTime
  endTime     DateTime
  status      BookingStatus
}
```

---

## 🎯 Key Features We Can Adopt

### **1. ✅ Weekly Recurring Availability (You Already Have This!)**
- Contractors set weekly schedules (Mon-Fri, 9am-5pm)
- Multiple time windows per day
- Timezone support
- **Your current implementation:** `availability_schedules` + `availability_windows` ✅

### **2. ✅ Date Overrides / Blackouts (You Already Have This!)**
- Block specific dates (holidays, vacations)
- **Your current implementation:** `availability_blackouts` ✅

### **3. ⚠️ Time Slot Calculation (NEEDS BUILDING)**
Cal.com's approach:
- Calculate available slots based on:
  - Contractor's weekly schedule
  - Existing bookings
  - Buffer times
  - Minimum booking notice
- Return available time slots for booking

**Components:**
- `packages/features/schedules/lib/slots.ts` - Slot calculation logic
- `packages/features/schedules/lib/use-schedule/` - Hooks for fetching slots
- `packages/features/availability/lib/getAggregatedAvailability.ts` - Aggregation

### **4. 📅 Interactive Booking Calendar (NEEDS BUILDING)**
Cal.com's booking flow:
1. User selects date on calendar
2. System shows available time slots for that date
3. User picks a slot
4. Booking confirmed

**Components:**
- `packages/features/bookings/Booker/` - Main booking component
- `packages/features/bookings/Booker/components/DatePicker.tsx` - Calendar UI
- `packages/features/bookings/Booker/components/AvailableTimeSlots.tsx` - Time slots

### **5. 🔄 Booking Buffer Times (NEEDS BUILDING)**
- Add time before/after appointments
- Prevents back-to-back scheduling
- Example: 15 min buffer after each job

### **6. ⏰ Minimum Booking Notice (NEEDS BUILDING)**
- "Must book at least 24 hours in advance"
- Prevents last-minute bookings

---

## 📊 Comparison: Cal.com vs Festly

| Feature | Cal.com | Festly Current | Status |
|---------|---------|----------------|--------|
| **Weekly Schedule** | ✅ Full support | ✅ `availability_schedules` + `availability_windows` | ✅ Done |
| **Date Blackouts** | ✅ Full support | ✅ `availability_blackouts` | ✅ Done |
| **Time Slot Calculator** | ✅ Advanced | ❌ Not implemented | 🚧 Need to Build |
| **Interactive Calendar** | ✅ React component | ❌ Not implemented | 🚧 Need to Build |
| **Buffer Times** | ✅ Before/After | ❌ Not implemented | 🚧 Need to Build |
| **Min Booking Notice** | ✅ Configurable | ❌ Not implemented | 🚧 Need to Build |
| **Timezone Support** | ✅ Full support | ⚠️ Partial | 🚧 Enhance |
| **Multiple Schedules** | ✅ Per user | ⚠️ Limited | 🚧 Enhance |
| **Date Overrides** | ✅ One-off changes | ❌ Not implemented | 💡 Future |

---

## 🛠️ What We Need to Build for Festly

### **Priority 1: Slot Calculation Engine**

**Purpose:** Calculate available time slots based on contractor availability and existing bookings.

**Database Changes:**
```sql
-- Add to jobs table (if not already present)
ALTER TABLE jobs ADD COLUMN duration_minutes INT DEFAULT 240; -- 4 hours default
ALTER TABLE jobs ADD COLUMN buffer_before_minutes INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN buffer_after_minutes INT DEFAULT 30;
```

**Backend Logic:**
```typescript
// src/lib/scheduling/slot-calculator.ts

interface SlotCalculationInput {
  contractorId: string;
  date: Date;
  duration: number; // minutes
  bufferBefore?: number;
  bufferAfter?: number;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export async function calculateAvailableSlots(
  input: SlotCalculationInput
): Promise<TimeSlot[]> {
  // 1. Get contractor's availability windows for this date
  const dayOfWeek = input.date.getDay();
  const availabilityWindows = await getAvailabilityForDay(
    input.contractorId,
    dayOfWeek
  );

  // 2. Check for date blackouts
  const isBlackedOut = await checkBlackout(
    input.contractorId,
    input.date
  );

  if (isBlackedOut) return [];

  // 3. Get existing bookings for this contractor on this date
  const existingBookings = await getBookingsForDate(
    input.contractorId,
    input.date
  );

  // 4. Generate slots based on availability windows
  const allPossibleSlots = generateSlotsFromWindows(
    availabilityWindows,
    input.duration
  );

  // 5. Filter out slots that conflict with existing bookings
  const availableSlots = filterConflictingSlots(
    allPossibleSlots,
    existingBookings,
    input.bufferBefore,
    input.bufferAfter
  );

  return availableSlots;
}
```

### **Priority 2: Interactive Booking Calendar Component**

**Component Structure:**
```typescript
// src/components/app/booking-calendar.tsx

export function BookingCalendar({
  contractorId,
  jobDuration,
  onSlotSelect,
}: {
  contractorId: string;
  jobDuration: number;
  onSlotSelect: (slot: { start: Date; end: Date }) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(contractorId, selectedDate, jobDuration)
        .then(setAvailableSlots);
    }
  }, [selectedDate, contractorId, jobDuration]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left: Calendar for date selection */}
      <Calendar
        selected={selectedDate}
        onSelect={setSelectedDate}
        // Highlight dates with availability
        modifiers={{
          available: (date) => hasAvailability(date),
        }}
      />

      {/* Right: Available time slots */}
      <div className="space-y-2">
        <h3>Available Times</h3>
        {selectedDate && (
          <div className="space-y-2">
            {availableSlots.map((slot) => (
              <button
                key={slot.start.toISOString()}
                onClick={() => onSlotSelect(slot)}
                className="w-full px-4 py-2 border rounded hover:bg-festive-green hover:text-white"
              >
                {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### **Priority 3: Job Creation with Booking**

**Update Job Creation Flow:**
```typescript
// src/app/app/homeowner/jobs/new/page.tsx

export default function CreateJobPage() {
  const [jobData, setJobData] = useState({...});
  const [selectedContractor, setSelectedContractor] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing job details fields */}
      <JobDetailsFields onChange={setJobData} />

      {/* NEW: Contractor selection */}
      <ContractorSelector
        onSelect={setSelectedContractor}
        serviceRadius={jobData.address}
      />

      {/* NEW: Booking calendar */}
      {selectedContractor && (
        <BookingCalendar
          contractorId={selectedContractor}
          jobDuration={jobData.estimatedDuration || 240}
          onSlotSelect={setSelectedSlot}
        />
      )}

      {/* Display selected slot */}
      {selectedSlot && (
        <div className="p-4 bg-green-50 rounded">
          <p>Scheduled for:</p>
          <p className="font-semibold">
            {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="font-semibold">
            {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
          </p>
        </div>
      )}

      <button type="submit">Create Job</button>
    </form>
  );
}
```

---

## 🗺️ Implementation Roadmap

### **Phase 1: Backend Slot Calculation (3-5 days)**
- [ ] Create slot calculation engine
- [ ] Add API endpoint `/api/availability/slots`
- [ ] Test with existing availability data
- [ ] Add buffer time support
- [ ] Add minimum booking notice

### **Phase 2: Calendar UI Component (3-4 days)**
- [ ] Build date picker component
- [ ] Build time slot selector
- [ ] Add loading states
- [ ] Style with Festly theme
- [ ] Make responsive (mobile-friendly)

### **Phase 3: Integration with Job Flow (2-3 days)**
- [ ] Update job creation to include booking
- [ ] Add contractor selection to job flow
- [ ] Update database schema for scheduled times
- [ ] Test end-to-end booking flow

### **Phase 4: Enhanced Features (2-3 days)**
- [ ] Add timezone display/conversion
- [ ] Show contractor's timezone
- [ ] Add "buffer time" preferences for contractors
- [ ] Add "minimum notice" settings
- [ ] Calendar sync integrations (future)

### **Total Estimated Time: 10-15 days**

---

## 💡 Recommendations

### **Approach 1: Build Custom (Recommended for Festly)**
**Pros:**
- Full control and customization
- Lighter weight (no unnecessary features)
- Already have 60% of the database schema
- Can integrate perfectly with existing Festly UI

**Cons:**
- Need to build slot calculation logic
- Need to build calendar UI

**Recommended:** ✅ This approach, using Cal.com as a **reference**, not a dependency.

### **Approach 2: Use Cal.com as Embedded Widget**
**Pros:**
- Instant scheduling functionality
- Battle-tested code

**Cons:**
- Heavy dependency (full Cal.com infrastructure)
- Requires separate Cal.com accounts for contractors
- Harder to customize
- Extra complexity

**Recommended:** ❌ Too heavy for our use case.

### **Approach 3: Hybrid - Use Cal.com Components**
**Pros:**
- Can cherry-pick specific components
- Proven UI patterns

**Cons:**
- Cal.com is a monorepo with complex dependencies
- Might be harder to extract just what we need

**Recommended:** ⚠️ Possible, but more complex than building custom.

---

## 🎨 Suggested UI/UX Flow

### **For Homeowners (Creating Job with Booking):**

1. **Job Details** (existing flow)
   - Address, description, photos, etc.

2. **NEW: Select Contractor** (if not auto-assigned)
   - Show contractors within service radius
   - Display availability indicators

3. **NEW: Choose Date & Time**
   - Interactive calendar (month view)
   - Dates with availability highlighted in green
   - Select date → see available time slots
   - Click time slot to book

4. **Review & Confirm**
   - Job details + scheduled time
   - Pricing
   - Submit

### **For Contractors:**

**Availability Management** (existing page: `/app/contractor/availability`)
- Weekly schedule setup ✅ (already built)
- Blackout dates ✅ (already built)
- NEW: Set buffer times
- NEW: Set minimum booking notice
- NEW: Set default job duration

---

## 📦 Cal.com Components We Can Reference

### **Study These Files:**

1. **Slot Calculation Logic:**
   - `packages/features/schedules/lib/slots.ts`
   - `packages/features/availability/lib/getAggregatedAvailability.ts`

2. **Booking Calendar UI:**
   - `packages/features/bookings/Booker/components/DatePicker.tsx`
   - `packages/features/bookings/Booker/components/AvailableTimeSlots.tsx`

3. **Availability Management:**
   - `packages/features/schedules/components/Schedule.tsx`
   - `packages/features/schedules/components/DateOverrideList.tsx`

4. **Hooks for Data Fetching:**
   - `packages/features/schedules/lib/use-schedule/useSchedule.ts`
   - `packages/features/bookings/Booker/components/hooks/useAvailableTimeSlots.ts`

---

## 🚀 Next Steps

1. **Clone Successfully Completed** ✅
2. **Analysis Complete** ✅
3. **Start Building:**
   - Begin with Phase 1: Slot Calculation Engine
   - Create `/src/lib/scheduling/` directory
   - Implement slot calculator
   - Add API endpoints
   - Build calendar UI
   - Integrate into job creation flow

---

## 📝 Additional Notes

- Cal.com is **AGPLv3 licensed** - we can study it but should build our own implementation
- Their codebase is **massive** (~9,000 files) - we only need ~5% of it
- Focus on **simplicity** - we have a simpler use case than Cal.com
- Leverage existing Festly infrastructure (Supabase, Next.js, ShadCN)

---

**Ready to start building?** Let me know and I'll begin implementing Phase 1! 🎯

