# Festly Marketplace - Phase 1 Build Plan

**Version:** 1.0
**Last Updated:** January 9, 2025
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Context](#product-context)
3. [Phase 1 Scope](#phase-1-scope)
4. [Tech Stack](#tech-stack)
5. [Architecture Overview](#architecture-overview)
6. [Database Schema](#database-schema)
7. [Project Structure](#project-structure)
8. [Authentication & Authorization](#authentication--authorization)
9. [Pricing Engine](#pricing-engine)
10. [Scheduling System](#scheduling-system)
11. [Job Workflow & Status](#job-workflow--status)
12. [Distance Calculation](#distance-calculation)
13. [File Upload System](#file-upload-system)
14. [UI Design System](#ui-design-system)
15. [Page & Route Structure](#page--route-structure)
16. [Component Breakdown](#component-breakdown)
17. [Implementation Phases](#implementation-phases)
18. [Future Hooks](#future-hooks)
19. [Environment Variables](#environment-variables)
20. [Deployment](#deployment)

---

## Executive Summary

Festly is an AI-native marketplace for seasonal light installation, starting with Christmas lights in Austin, TX. Phase 1 focuses on building the core marketplace and job management system—connecting homeowners with contractors through an Uber-like matching experience.

**Key Features:**
- Role-based authentication (Homeowner, Contractor, Admin)
- Job creation with structured inputs and automated pricing
- Cal.com-style contractor availability scheduling
- Tinder/Uber-style job feed for contractors
- Distance-based job matching
- Job status tracking from creation to completion
- Photo upload for job references

**Out of Scope for Phase 1:**
- Visual drawing tool (future)
- Stripe/real payments (future)
- In-app messaging (placeholder UI only)
- Admin dashboard UI (manual DB management via Supabase Studio)

---

## Product Context

### Vision
Festly aims to be the go-to platform for seasonal light installation. Eventually, homeowners will use a visual design tool to draw lights on their exact house photo and get instant pricing. For Phase 1, we're building the marketplace foundation that this tool will plug into.

### Market Position
- **Concept:** "Uber for Christmas light installation"
- **Initial Market:** Austin, TX only
- **Currency:** USD
- **Target:** US addresses only

### User Personas

**Homeowner (Customer):**
- Wants professional holiday light installation
- Needs transparent pricing
- Values convenience and reliability
- Wants to schedule around their availability

**Contractor:**
- Runs a light installation business
- Wants flexible work scheduling
- Needs clear job details and fair pay
- Values efficient job matching

**Admin:**
- Oversees platform operations
- Manages users and resolves disputes
- Monitors job marketplace health

---

## Phase 1 Scope

### In Scope

#### 1. User Roles & Auth
- Three roles: Homeowner, Contractor, Admin
- Supabase Auth with email + password only (no magic links, no OTP, no OAuth)
- Role-based onboarding flow
- Protected routes per role
- Admin role set manually in DB

#### 2. Homeowner Experience
- Sign up / log in
- Profile with:
  - Name
  - Email
  - Home address (Austin, TX)
  - Optional phone
- Create job with:
  - Address (pre-filled, editable)
  - Description (areas: roofline, trees, yard, wreaths, etc.)
  - Number of stories
  - Approximate house size
  - Estimated length of lights (feet)
  - Complexity (simple/medium/complex)
  - Requested date or date range
  - Options: Lights provided? Storage needed?
  - Optional tip/top-up amount
  - Reference photos (uploadable)
- View active and past jobs
- See contractor contact info after job acceptance
- Cancel job up to 72 hours before scheduled date
- Confirm job completion

#### 3. Contractor Experience
- Sign up / log in
- Profile with:
  - Name / business name
  - Email
  - Service area (base address + radius)
  - Optional: base rate, max jobs per period
- Availability setup (Cal.com-style):
  - Weekly recurring availability windows
  - Blockout dates
- Job feed (Tinder/Uber-style cards):
  - See open jobs within service radius
  - Each card shows: address, payout, estimated time, description, options
  - Accept or skip jobs
  - First-come, first-served assignment
- Active jobs view:
  - See assigned/in-progress jobs
  - Mark job as "in progress"
  - Request completion (moves to pending_review)
- Past jobs view
- Contact info for homeowner after acceptance
- Can cancel job (logged for future credibility system)

#### 4. Pricing Engine
- Server-side calculation
- Formula: `job_price = (length_of_lights × region_labor_rate) + complexity_addon + options_addons + tip`
- Contractor payout: 80% of job_price
- Region labor rate stored in DB (Austin, TX default)
- All pricing fields entered manually by homeowner for Phase 1

#### 5. Scheduling System
- Contractors set weekly recurring availability
- Contractors can block specific dates
- Homeowners choose desired date or date range
- No real-time slot booking yet (planned for future)

#### 6. Geographic Features
- Distance calculation between contractor base address and job address
- Google Maps API integration
- Distance shown in miles
- Filter job feed by contractor service radius

#### 7. File Upload
- Supabase Storage integration
- Homeowners can upload reference photos for jobs
- Support common image formats (JPG, PNG, WebP)

### Out of Scope (Future)
- Visual drawing tool
- Stripe / real payments
- In-app messaging (placeholder UI only)
- Admin dashboard UI
- Tests, API docs, Docker setup
- Time-slot booking interface

---

## Tech Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Runtime:** Node.js 20+
- **Package Manager:** npm

### Frontend
- **UI Library (Landing):** Untitled UI + React Aria Components
- **UI Library (App):** ShadCN UI
- **Styling:** Tailwind CSS v4
- **Animation:** Motion (Framer Motion)
- **Icons:** Untitled UI Icons
- **Build Tool:** Turbopack

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Next.js API Routes (Server Actions)

### External Services
- **Maps:** Google Maps API (distance calculation)

### Deployment
- **Hosting:** Vercel
- **Database:** Supabase Cloud (production) / Local (development)
- **Environment:** Docker (local Supabase)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FESTLY APP                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐     ┌──────────────────────────┐  │
│  │   LANDING PAGES     │     │      APP PAGES           │  │
│  │  (Untitled UI)      │     │    (ShadCN UI)           │  │
│  ├─────────────────────┤     ├──────────────────────────┤  │
│  │ - / (waitlist)      │     │ - /app/homeowner/...     │  │
│  │ - /waitlist-signin  │     │ - /app/contractor/...    │  │
│  │                     │     │ - /auth/...              │  │
│  └─────────────────────┘     └──────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SHARED INFRASTRUCTURE                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ - Supabase Client (Auth, DB, Storage)                │  │
│  │ - Pricing Engine                                       │  │
│  │ - Distance Calculator (Google Maps API)               │  │
│  │ - Type-safe DB Types (Auto-generated)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │        SUPABASE BACKEND            │
         ├────────────────────────────────────┤
         │ - PostgreSQL Database              │
         │ - Authentication Service           │
         │ - Storage (S3-compatible)          │
         │ - Row Level Security (RLS)         │
         │ - Real-time Subscriptions          │
         └────────────────────────────────────┘
```

### Separation of Concerns

**Landing Pages (Untitled UI):**
- Public-facing marketing pages
- Waitlist feature (existing)
- Uses existing Untitled UI components
- Routes: `/`, `/waitlist-signin`

**App Pages (ShadCN UI):**
- Protected, authenticated application
- Role-specific dashboards and features
- All marketplace functionality
- Routes: `/app/*`, `/auth/*`

### Data Flow

```
User Action → Next.js Route Handler / Server Action
              ↓
         Supabase Client
              ↓
         PostgreSQL DB (with RLS)
              ↓
         Return Data → Update UI
```

---

## Database Schema

### Tables Overview

```
profiles
jobs
availability_windows
regions
job_photos
contractor_cancellations (future-ready)
```

### Detailed Schema

#### `profiles`

Extends Supabase `auth.users` with role-specific profile data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('homeowner', 'contractor', 'admin')),

  -- Common fields
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- Homeowner fields
  home_address TEXT,
  home_city TEXT DEFAULT 'Austin',
  home_state TEXT DEFAULT 'TX',
  home_zip TEXT,
  home_latitude DECIMAL(10, 8),
  home_longitude DECIMAL(11, 8),

  -- Contractor fields
  business_name TEXT,
  service_base_address TEXT,
  service_base_city TEXT DEFAULT 'Austin',
  service_base_state TEXT DEFAULT 'TX',
  service_base_zip TEXT,
  service_base_latitude DECIMAL(10, 8),
  service_base_longitude DECIMAL(11, 8),
  service_radius_miles INTEGER DEFAULT 25,
  base_hourly_rate_cents INTEGER, -- stored in cents
  max_jobs_per_week INTEGER DEFAULT 10,

  -- Profile completion
  profile_completed_at TIMESTAMPTZ,
  onboarding_step TEXT DEFAULT 'role_selection'
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_location ON profiles(home_latitude, home_longitude);
CREATE INDEX idx_profiles_contractor_location ON profiles(service_base_latitude, service_base_longitude);
```

**RLS Policies:**
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Homeowners can see contractor public info
CREATE POLICY "Homeowners can view contractor profiles"
  ON profiles FOR SELECT
  USING (
    role = 'contractor'
    AND is_active = true
  );

-- Admins can see all profiles (checked in app logic)
```

---

#### `regions`

Labor rates and service area definitions by region.

```sql
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  labor_rate_per_foot_cents INTEGER NOT NULL, -- cents per foot
  complexity_simple_cents INTEGER DEFAULT 0,
  complexity_medium_cents INTEGER DEFAULT 50000, -- $500
  complexity_complex_cents INTEGER DEFAULT 150000, -- $1500
  lights_provided_addon_cents INTEGER DEFAULT 25000, -- $250
  storage_addon_cents INTEGER DEFAULT 10000, -- $100
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regions_name ON regions(name);

-- Seed Austin region
INSERT INTO regions (name, state, labor_rate_per_foot_cents, complexity_simple_cents, complexity_medium_cents, complexity_complex_cents)
VALUES ('Austin', 'TX', 300, 0, 50000, 150000); -- $3/foot base
```

**RLS Policies:**
```sql
-- Everyone can read active regions
CREATE POLICY "Anyone can view active regions"
  ON regions FOR SELECT
  USING (is_active = true);
```

---

#### `jobs`

Core table for all job postings and assignments.

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  homeowner_id UUID NOT NULL REFERENCES profiles(id),
  contractor_id UUID REFERENCES profiles(id),
  region_id UUID NOT NULL REFERENCES regions(id),

  -- Job details
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Austin',
  state TEXT NOT NULL DEFAULT 'TX',
  zip TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Description
  description TEXT NOT NULL,
  areas TEXT[], -- e.g., ['roofline', 'trees', 'yard', 'wreaths']
  num_stories INTEGER NOT NULL DEFAULT 1,
  house_size TEXT, -- e.g., 'small', 'medium', 'large'

  -- Pricing inputs (entered by homeowner)
  estimated_length_feet INTEGER NOT NULL,
  complexity TEXT NOT NULL CHECK (complexity IN ('simple', 'medium', 'complex')),
  lights_provided BOOLEAN DEFAULT FALSE,
  storage_needed BOOLEAN DEFAULT FALSE,
  tip_amount_cents INTEGER DEFAULT 0,

  -- Calculated pricing (set by pricing engine)
  base_price_cents INTEGER NOT NULL,
  complexity_addon_cents INTEGER NOT NULL,
  options_addon_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL, -- includes tip
  contractor_payout_cents INTEGER NOT NULL, -- 80% of total_price_cents

  -- Scheduling
  requested_date_start DATE,
  requested_date_end DATE,
  scheduled_date DATE,
  completed_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'assigned',
    'in_progress',
    'pending_review',
    'completed',
    'cancelled',
    'disputed'
  )),

  -- Payment (for future)
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid',
    'pending',
    'paid',
    'refunded'
  )),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completion_requested_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),

  -- Distance (calculated when job is created)
  distance_miles DECIMAL(6, 2)
);

CREATE INDEX idx_jobs_homeowner ON jobs(homeowner_id);
CREATE INDEX idx_jobs_contractor ON jobs(contractor_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
```

**RLS Policies:**
```sql
-- Homeowners can create jobs
CREATE POLICY "Homeowners can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    auth.uid() = homeowner_id
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'homeowner'
  );

-- Homeowners can view their own jobs
CREATE POLICY "Homeowners can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = homeowner_id);

-- Homeowners can update their own unassigned jobs
CREATE POLICY "Homeowners can update own unassigned jobs"
  ON jobs FOR UPDATE
  USING (
    auth.uid() = homeowner_id
    AND status = 'open'
  );

-- Contractors can view open jobs (filtered by distance in app logic)
CREATE POLICY "Contractors can view open jobs"
  ON jobs FOR SELECT
  USING (
    status = 'open'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'contractor'
  );

-- Contractors can view jobs assigned to them
CREATE POLICY "Contractors can view assigned jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = contractor_id);

-- Contractors can update jobs assigned to them
CREATE POLICY "Contractors can update assigned jobs"
  ON jobs FOR UPDATE
  USING (
    auth.uid() = contractor_id
    AND contractor_id IS NOT NULL
  );
```

---

#### `availability_windows`

Contractor recurring weekly availability.

```sql
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Time windows (stored as TIME)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Active/inactive
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_contractor ON availability_windows(contractor_id);
CREATE INDEX idx_availability_day ON availability_windows(day_of_week);
```

**RLS Policies:**
```sql
-- Contractors can manage their own availability
CREATE POLICY "Contractors can manage own availability"
  ON availability_windows FOR ALL
  USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);

-- Homeowners can view contractor availability (for future scheduling UI)
CREATE POLICY "Homeowners can view contractor availability"
  ON availability_windows FOR SELECT
  USING (is_active = true);
```

---

#### `availability_blackouts`

Contractor-specific date blackouts.

```sql
CREATE TABLE availability_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  blackout_date DATE NOT NULL,
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contractor_id, blackout_date)
);

CREATE INDEX idx_blackouts_contractor ON availability_blackouts(contractor_id);
CREATE INDEX idx_blackouts_date ON availability_blackouts(blackout_date);
```

**RLS Policies:**
```sql
-- Contractors can manage their own blackouts
CREATE POLICY "Contractors can manage own blackouts"
  ON availability_blackouts FOR ALL
  USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);
```

---

#### `job_photos`

Reference photos uploaded by homeowners.

```sql
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),

  -- Supabase Storage path
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'job-photos',

  -- Metadata
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_photos_job ON job_photos(job_id);
```

**RLS Policies:**
```sql
-- Job owners can upload photos
CREATE POLICY "Job owners can upload photos"
  ON job_photos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE id = job_id AND homeowner_id = auth.uid()
    )
  );

-- Job participants can view photos
CREATE POLICY "Job participants can view photos"
  ON job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE id = job_id
      AND (homeowner_id = auth.uid() OR contractor_id = auth.uid())
    )
  );
```

---

#### `contractor_cancellations` (Future-Ready)

Log contractor cancellations for credibility system.

```sql
CREATE TABLE contractor_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  job_id UUID NOT NULL REFERENCES jobs(id),

  cancelled_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,

  -- Future: credibility score impact
  credibility_impact INTEGER DEFAULT -10
);

CREATE INDEX idx_cancellations_contractor ON contractor_cancellations(contractor_id);
```

---

### Database Functions

#### Calculate Distance (PostgreSQL function using Haversine formula)

```sql
CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius_miles DECIMAL := 3959.0;
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);

  c := 2 * atan2(sqrt(a), sqrt(1 - a));

  RETURN earth_radius_miles * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Project Structure

```
festly/
├── src/
│   ├── app/
│   │   ├── (landing)/              # Landing pages (Untitled UI)
│   │   │   ├── page.tsx            # Waitlist home
│   │   │   ├── waitlist-signin/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx          # Landing layout
│   │   │
│   │   ├── (app)/                  # Protected app (ShadCN UI)
│   │   │   ├── layout.tsx          # App layout with role-based nav
│   │   │   ├── homeowner/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx    # Jobs list
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx # Create job
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Job detail
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── contractor/
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       ├── jobs/
│   │   │       │   ├── feed/
│   │   │       │   │   └── page.tsx # Job marketplace feed
│   │   │       │   ├── active/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx # Job detail
│   │   │       ├── availability/
│   │   │       │   └── page.tsx
│   │   │       └── profile/
│   │   │           └── page.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── role/
│   │   │   │   │   └── page.tsx    # Choose role
│   │   │   │   ├── homeowner/
│   │   │   │   │   └── page.tsx    # Homeowner profile setup
│   │   │   │   └── contractor/
│   │   │   │       └── page.tsx    # Contractor profile setup
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   │
│   │   ├── api/
│   │   │   ├── jobs/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.ts    # Create job + pricing
│   │   │   │   ├── accept/
│   │   │   │   │   └── route.ts    # Contractor accepts job
│   │   │   │   └── distance/
│   │   │   │       └── route.ts    # Calculate distance
│   │   │   ├── pricing/
│   │   │   │   └── calculate/
│   │   │   │       └── route.ts    # Pricing engine
│   │   │   └── upload/
│   │   │       └── route.ts        # Photo upload handler
│   │   │
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── landing/                # Untitled UI components
│   │   │   └── ...existing components
│   │   │
│   │   ├── ui/                     # ShadCN components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...other ShadCN components
│   │   │
│   │   ├── app/                    # App-specific components
│   │   │   ├── role-selector.tsx
│   │   │   ├── job-card.tsx
│   │   │   ├── job-form.tsx
│   │   │   ├── availability-editor.tsx
│   │   │   ├── pricing-summary.tsx
│   │   │   ├── photo-uploader.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── messaging-placeholder.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── app-nav.tsx         # Role-based navigation
│   │   │   ├── app-header.tsx
│   │   │   └── app-sidebar.tsx
│   │   │
│   │   └── shared/
│   │       ├── protected-route.tsx
│   │       └── role-guard.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Public Supabase client
│   │   ├── supabase-admin.ts       # Admin Supabase client
│   │   ├── database.types.ts       # Auto-generated types
│   │   ├── pricing-engine.ts       # Pricing calculation logic
│   │   ├── distance-calculator.ts  # Google Maps API wrapper
│   │   └── constants.ts            # App constants
│   │
│   ├── utils/
│   │   ├── cn.ts                   # Tailwind merge utility
│   │   ├── format.ts               # Formatters (currency, date, etc.)
│   │   └── validation.ts           # Form validation helpers
│   │
│   └── types/
│       ├── job.ts
│       ├── profile.ts
│       └── api.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 20250108000000_create_waitlist.sql
│   │   ├── 20250109000001_create_profiles.sql
│   │   ├── 20250109000002_create_regions.sql
│   │   ├── 20250109000003_create_jobs.sql
│   │   ├── 20250109000004_create_availability.sql
│   │   ├── 20250109000005_create_job_photos.sql
│   │   └── 20250109000006_create_functions.sql
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│   ├── festly-marketplace-build-plan.md  # This document
│   └── README.md
│
├── public/
│   └── ...
│
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json              # ShadCN config
└── README.md
```

---

## Authentication & Authorization

### Flow Diagram

```
User lands on site
       ↓
   Click "Sign Up"
       ↓
   Enter email + password
       ↓
   Supabase creates auth.users record
       ↓
   Redirect to /auth/onboarding/role
       ↓
   User selects: "Homeowner" or "Contractor"
       ↓
   Create profile record with selected role
       ↓
   Redirect to role-specific onboarding:
     - Homeowner: /auth/onboarding/homeowner
     - Contractor: /auth/onboarding/contractor
       ↓
   Fill out profile information (forced completion)
       ↓
   Mark profile_completed_at timestamp
       ↓
   Redirect to role-specific dashboard:
     - Homeowner: /app/homeowner/dashboard
     - Contractor: /app/contractor/dashboard
```

### Role-Based Access Control

**Middleware:**
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed_at')
    .eq('id', user.id)
    .single();

  // Force onboarding completion
  if (!profile.profile_completed_at && !req.nextUrl.pathname.startsWith('/auth/onboarding')) {
    return NextResponse.redirect(new URL('/auth/onboarding/role', req.url));
  }

  // Role-based route protection
  if (req.nextUrl.pathname.startsWith('/app/homeowner') && profile.role !== 'homeowner') {
    return NextResponse.redirect(new URL('/app/' + profile.role + '/dashboard', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/app/contractor') && profile.role !== 'contractor') {
    return NextResponse.redirect(new URL('/app/' + profile.role + '/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/auth/onboarding/:path*']
};
```

---

## Pricing Engine

### Formula

```
job_price = base_price + complexity_addon + options_addons + tip

Where:
  base_price = estimated_length_feet × region_labor_rate_per_foot
  complexity_addon = region complexity rate based on selected level
  options_addons = sum of:
    - lights_provided ? region.lights_provided_addon : 0
    - storage_needed ? region.storage_addon : 0
  contractor_payout = job_price × 0.80 (80%)
```

### Implementation

**File:** `src/lib/pricing-engine.ts`

```typescript
export interface PricingInputs {
  regionId: string;
  estimatedLengthFeet: number;
  complexity: 'simple' | 'medium' | 'complex';
  lightsProvided: boolean;
  storageNeeded: boolean;
  tipAmountCents?: number;
}

export interface PricingResult {
  basePriceCents: number;
  complexityAddonCents: number;
  optionsAddonCents: number;
  totalPriceCents: number;
  contractorPayoutCents: number;
}

export async function calculateJobPricing(
  inputs: PricingInputs
): Promise<PricingResult> {
  // Fetch region pricing data
  const { data: region } = await supabaseAdmin
    .from('regions')
    .select('*')
    .eq('id', inputs.regionId)
    .single();

  if (!region) {
    throw new Error('Region not found');
  }

  // Calculate base price
  const basePriceCents =
    inputs.estimatedLengthFeet * region.labor_rate_per_foot_cents;

  // Calculate complexity addon
  let complexityAddonCents = 0;
  switch (inputs.complexity) {
    case 'simple':
      complexityAddonCents = region.complexity_simple_cents;
      break;
    case 'medium':
      complexityAddonCents = region.complexity_medium_cents;
      break;
    case 'complex':
      complexityAddonCents = region.complexity_complex_cents;
      break;
  }

  // Calculate options addons
  let optionsAddonCents = 0;
  if (inputs.lightsProvided) {
    optionsAddonCents += region.lights_provided_addon_cents;
  }
  if (inputs.storageNeeded) {
    optionsAddonCents += region.storage_addon_cents;
  }

  // Calculate total
  const subtotalCents =
    basePriceCents + complexityAddonCents + optionsAddonCents;

  const tipCents = inputs.tipAmountCents || 0;
  const totalPriceCents = subtotalCents + tipCents;

  // Calculate contractor payout (80%)
  const contractorPayoutCents = Math.floor(totalPriceCents * 0.80);

  return {
    basePriceCents,
    complexityAddonCents,
    optionsAddonCents,
    totalPriceCents,
    contractorPayoutCents,
  };
}
```

**API Route:** `src/app/api/pricing/calculate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { calculateJobPricing } from '@/lib/pricing-engine';

export async function POST(req: NextRequest) {
  try {
    const inputs = await req.json();
    const pricing = await calculateJobPricing(inputs);
    return NextResponse.json(pricing);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Usage in Job Creation

When homeowner fills out job form, call pricing API endpoint to get real-time pricing preview before job submission.

---

## Scheduling System

### Contractor Availability

**Data Model:**

```typescript
interface AvailabilityWindow {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isActive: boolean;
}

interface AvailabilityBlackout {
  blackoutDate: string; // "2025-12-25"
  reason?: string;
}
```

**UI Design (Cal.com-style):**

```
┌────────────────────────────────────────────────────┐
│  Weekly Availability                               │
├────────────────────────────────────────────────────┤
│                                                    │
│  ☐ Sunday      [Not Available]                    │
│  ☑ Monday      [09:00 AM] to [05:00 PM]  [Remove] │
│  ☑ Tuesday     [09:00 AM] to [05:00 PM]  [Remove] │
│  ☑ Wednesday   [09:00 AM] to [05:00 PM]  [Remove] │
│  ☑ Thursday    [09:00 AM] to [05:00 PM]  [Remove] │
│  ☑ Friday      [09:00 AM] to [03:00 PM]  [Remove] │
│  ☑ Saturday    [10:00 AM] to [02:00 PM]  [Remove] │
│                                                    │
│  [+ Add Time Window]                               │
│                                                    │
├────────────────────────────────────────────────────┤
│  Blocked Dates                                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  • 2025-12-25  Christmas Day            [Remove]  │
│  • 2025-01-01  New Year's Day           [Remove]  │
│                                                    │
│  [+ Add Blocked Date]                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Homeowner Job Scheduling

**For Phase 1:**
- Homeowner enters desired date or date range
- No real-time slot picker yet
- Stored as `requested_date_start` and `requested_date_end` in jobs table

**Future Enhancement:**
- Interactive calendar showing contractor availability
- Time-slot booking
- Automatic scheduling conflicts prevention

### Availability Check Logic

```typescript
// src/lib/availability-checker.ts

export async function checkContractorAvailability(
  contractorId: string,
  requestedDate: Date
): Promise<boolean> {
  const dayOfWeek = requestedDate.getDay();

  // Check if contractor has availability window for this day
  const { data: windows } = await supabase
    .from('availability_windows')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (!windows || windows.length === 0) {
    return false; // No availability this day of week
  }

  // Check if date is blacked out
  const dateString = requestedDate.toISOString().split('T')[0];
  const { data: blackouts } = await supabase
    .from('availability_blackouts')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('blackout_date', dateString);

  if (blackouts && blackouts.length > 0) {
    return false; // Date is blacked out
  }

  return true; // Available
}
```

---

## Job Workflow & Status

### Status Transition Diagram

```
         ┌──────────────┐
         │     OPEN     │ ← Job created by homeowner
         └──────┬───────┘
                │
                │ Contractor accepts job
                ↓
         ┌──────────────┐
         │   ASSIGNED   │ ← Job assigned to contractor
         └──────┬───────┘
                │
                │ Contractor marks as started
                ↓
         ┌──────────────┐
         │ IN_PROGRESS  │ ← Contractor working on job
         └──────┬───────┘
                │
                │ Contractor requests completion
                ↓
         ┌──────────────┐
         │PENDING_REVIEW│ ← Waiting for homeowner confirmation
         └──┬─────────┬─┘
            │         │
            │         │ Homeowner disputes
            │         ↓
            │    ┌────────────┐
            │    │  DISPUTED  │ ← Requires admin intervention
            │    └────────────┘
            │
            │ Homeowner confirms
            ↓
         ┌──────────────┐
         │  COMPLETED   │ ← Job successfully finished
         └──────────────┘


    Any status can transition to:
         ┌──────────────┐
         │  CANCELLED   │ ← Job cancelled by homeowner or contractor
         └──────────────┘
```

### Status Transition Rules

| From Status     | To Status       | Who Can Trigger          | Conditions                                       |
|----------------|-----------------|--------------------------|--------------------------------------------------|
| `open`         | `assigned`      | Contractor               | First-come, first-served; within service radius  |
| `open`         | `cancelled`     | Homeowner                | Before assignment                                |
| `assigned`     | `in_progress`   | Contractor               | None                                             |
| `assigned`     | `cancelled`     | Homeowner or Contractor  | Logged for contractor cancellations              |
| `in_progress`  | `pending_review`| Contractor               | None                                             |
| `in_progress`  | `cancelled`     | Homeowner or Contractor  | Within 72 hours before scheduled date forbidden  |
| `pending_review`| `completed`    | Homeowner                | Confirmation                                     |
| `pending_review`| `disputed`     | Homeowner                | If issue with job                                |
| `disputed`     | `completed`     | Admin (manual in DB)     | After resolution                                 |
| `disputed`     | `cancelled`     | Admin (manual in DB)     | If unresolvable                                  |

### Cancellation Rules

**Homeowner Cancellation:**
- Can cancel `open` jobs anytime
- Can cancel `assigned` or `in_progress` jobs ONLY if scheduled date is more than 72 hours away

**Contractor Cancellation:**
- Can cancel any job assigned to them
- Cancellation is logged in `contractor_cancellations` table for future credibility system

**Implementation:**

```typescript
// src/lib/job-status.ts

export async function cancelJob(
  jobId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: job } = await supabase
    .from('jobs')
    .select('*, profiles!homeowner_id(*), profiles!contractor_id(*)')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { success: false, error: 'Job not found' };
  }

  const { data: user } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  // Check if homeowner
  if (user.role === 'homeowner' && job.homeowner_id === userId) {
    if (job.status === 'open') {
      // Can cancel anytime
      await supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancellation_reason: reason,
        })
        .eq('id', jobId);

      return { success: true };
    }

    if (['assigned', 'in_progress'].includes(job.status)) {
      // Check 72-hour rule
      const scheduledDate = new Date(job.scheduled_date || job.requested_date_start);
      const now = new Date();
      const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 72) {
        return {
          success: false,
          error: 'Cannot cancel within 72 hours of scheduled job date',
        };
      }

      await supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancellation_reason: reason,
        })
        .eq('id', jobId);

      return { success: true };
    }
  }

  // Check if contractor
  if (user.role === 'contractor' && job.contractor_id === userId) {
    // Log cancellation
    await supabase
      .from('contractor_cancellations')
      .insert({
        contractor_id: userId,
        job_id: jobId,
        reason,
      });

    await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason,
        contractor_id: null, // Unassign
      })
      .eq('id', jobId);

    return { success: true };
  }

  return { success: false, error: 'Unauthorized' };
}
```

---

## Distance Calculation

### Google Maps API Integration

**API Key Setup:**

Add to `.env.local`:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Implementation:**

**File:** `src/lib/distance-calculator.ts`

```typescript
interface DistanceResult {
  distanceMiles: number;
  durationMinutes?: number;
}

export async function calculateDistanceGoogleMaps(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult> {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&units=imperial&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.rows[0]?.elements[0]) {
    throw new Error('Failed to calculate distance');
  }

  const element = data.rows[0].elements[0];

  if (element.status !== 'OK') {
    throw new Error('Invalid distance calculation');
  }

  // Convert meters to miles
  const distanceMiles = element.distance.value * 0.000621371;
  const durationMinutes = element.duration?.value
    ? Math.round(element.duration.value / 60)
    : undefined;

  return {
    distanceMiles: Math.round(distanceMiles * 100) / 100, // 2 decimal places
    durationMinutes,
  };
}

// Fallback: PostgreSQL Haversine formula (no API call needed)
export async function calculateDistanceHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const { data } = await supabaseAdmin
    .rpc('calculate_distance_miles', {
      lat1,
      lon1,
      lat2,
      lon2,
    });

  return data;
}
```

### Usage in Job Feed

When contractor views job feed:

```typescript
// src/app/app/contractor/jobs/feed/page.tsx

const { data: contractor } = await supabase
  .from('profiles')
  .select('service_base_latitude, service_base_longitude, service_radius_miles')
  .eq('id', user.id)
  .single();

const { data: openJobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'open');

// Filter jobs within service radius
const jobsWithinRadius = await Promise.all(
  openJobs.map(async (job) => {
    const distance = await calculateDistanceHaversine(
      contractor.service_base_latitude,
      contractor.service_base_longitude,
      job.latitude,
      job.longitude
    );

    return {
      ...job,
      distance,
      withinRadius: distance <= contractor.service_radius_miles,
    };
  })
);

const availableJobs = jobsWithinRadius.filter(j => j.withinRadius);
```

---

## File Upload System

### Supabase Storage Setup

**Bucket:** `job-photos`

**Policies:**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload job photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-photos'
    AND auth.role() = 'authenticated'
  );

-- Allow job participants to view photos
CREATE POLICY "Job participants can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-photos'
    AND auth.role() = 'authenticated'
  );
```

### Upload Implementation

**Component:** `src/components/app/photo-uploader.tsx`

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PhotoUploaderProps {
  jobId: string;
  onUploadComplete?: (photoId: string) => void;
}

export function PhotoUploader({ jobId, onUploadComplete }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${jobId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: photo, error: dbError } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          uploaded_by: user.id,
          storage_path: filePath,
          storage_bucket: 'job-photos',
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onUploadComplete?.(photo.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

---

## UI Design System

### Color Palette

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        // Festly Brand Colors
        festive: {
          green: {
            DEFAULT: '#0A6847',
            light: '#0D8059',
            dark: '#084F37',
          },
          red: {
            DEFAULT: '#DC3545',
            light: '#E25563',
            dark: '#C82333',
          },
        },

        // Neutral Palette
        neutral: {
          50: '#F8F8F8',
          100: '#E0E0E0',
          200: '#C0C0C0',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#000000',
        },
      },
    },
  },
};
```

### Component Theme

**Buttons:**
- Primary: `bg-festive-green text-white`
- Secondary: `border-festive-green text-festive-green bg-white`
- Destructive: `bg-festive-red text-white`

**Status Badges:**
- Open: `bg-festive-green/10 text-festive-green`
- Assigned: `bg-blue-100 text-blue-700`
- In Progress: `bg-yellow-100 text-yellow-700`
- Pending Review: `bg-purple-100 text-purple-700`
- Completed: `bg-neutral-200 text-neutral-500`
- Cancelled: `bg-festive-red/10 text-festive-red`
- Disputed: `bg-orange-100 text-orange-700`

**Cards:**
- Background: `bg-neutral-50`
- Border: `border-neutral-100`
- Shadow: `shadow-sm`

### Theme Configuration

Force light theme:

```typescript
// src/app/layout.tsx

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Install next-themes for future dark mode support */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light" // Force light for Phase 1
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### ShadCN Component List

**To Install:**
```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add toast
npx shadcn@latest add form
```

---

## Page & Route Structure

### Route Map

```
/                               → Landing page (waitlist)
/waitlist-signin                → Admin waitlist signin
/auth/signin                    → Sign in
/auth/signup                    → Sign up
/auth/onboarding/role           → Choose role (homeowner/contractor)
/auth/onboarding/homeowner      → Homeowner profile setup
/auth/onboarding/contractor     → Contractor profile setup

/app/homeowner/dashboard        → Homeowner dashboard
/app/homeowner/jobs             → Homeowner jobs list
/app/homeowner/jobs/new         → Create new job
/app/homeowner/jobs/[id]        → Job detail
/app/homeowner/profile          → Homeowner profile settings

/app/contractor/dashboard       → Contractor dashboard
/app/contractor/jobs/feed       → Job marketplace feed
/app/contractor/jobs/active     → Active jobs
/app/contractor/jobs/[id]       → Job detail
/app/contractor/availability    → Availability settings
/app/contractor/profile         → Contractor profile settings
```

### Layout Hierarchy

```
app/layout.tsx (Root Layout)
  ├─ (landing)/layout.tsx (Untitled UI styles)
  │   ├─ page.tsx (waitlist)
  │   └─ waitlist-signin/page.tsx
  │
  ├─ auth/layout.tsx (Auth layout)
  │   ├─ signin/page.tsx
  │   ├─ signup/page.tsx
  │   └─ onboarding/...
  │
  └─ (app)/layout.tsx (ShadCN styles + role-based nav)
      ├─ homeowner/...
      └─ contractor/...
```

---

## Component Breakdown

### 1. Role Selector (`role-selector.tsx`)

**Purpose:** Allow user to choose Homeowner or Contractor during onboarding.

**Props:**
```typescript
interface RoleSelectorProps {
  onRoleSelect: (role: 'homeowner' | 'contractor') => void;
}
```

**UI:**
- Two large cards side-by-side (or stacked on mobile)
- Each card has icon, title, description
- Clicking card calls `onRoleSelect`

---

### 2. Job Card (`job-card.tsx`)

**Purpose:** Display job in contractor feed.

**Props:**
```typescript
interface JobCardProps {
  job: Job;
  distance: number;
  onAccept: (jobId: string) => void;
  onSkip: (jobId: string) => void;
}
```

**UI:**
```
┌────────────────────────────────────────┐
│  123 Main St, Austin, TX               │
│  2.5 miles away                        │
├────────────────────────────────────────┤
│  Payout: $1,200                        │
│  Est. Time: 4-6 hours                  │
│  Complexity: Medium                    │
│  Lights Provided: Yes                  │
│  Storage Needed: No                    │
├────────────────────────────────────────┤
│  [Skip]              [Accept Job] →   │
└────────────────────────────────────────┘
```

---

### 3. Job Form (`job-form.tsx`)

**Purpose:** Create new job (homeowner).

**Props:**
```typescript
interface JobFormProps {
  onSubmit: (jobData: CreateJobData) => void;
}
```

**Fields:**
- Address (pre-filled from profile, editable)
- Description (textarea)
- Areas (multi-select: roofline, trees, yard, wreaths, etc.)
- Number of stories (select: 1, 2, 3+)
- House size (select: small, medium, large)
- Estimated length of lights (number input, feet)
- Complexity (radio: simple, medium, complex)
- Requested date (date picker or date range)
- Lights provided? (checkbox)
- Storage needed? (checkbox)
- Tip amount (optional, number input)
- Reference photos (photo uploader)

**Real-time Pricing Preview:**
- Show calculated price as user fills out form
- Call pricing API on field change (debounced)

---

### 4. Availability Editor (`availability-editor.tsx`)

**Purpose:** Set contractor weekly availability and blackouts.

**Props:**
```typescript
interface AvailabilityEditorProps {
  contractorId: string;
}
```

**UI:** Cal.com-style weekly schedule + blackout date list (see Scheduling System section above).

---

### 5. Pricing Summary (`pricing-summary.tsx`)

**Purpose:** Display pricing breakdown.

**Props:**
```typescript
interface PricingSummaryProps {
  pricing: PricingResult;
}
```

**UI:**
```
┌─────────────────────────────────┐
│  Pricing Summary                │
├─────────────────────────────────┤
│  Base Price:         $900       │
│  Complexity Addon:   $500       │
│  Options Addons:     $250       │
│  Tip:                $50        │
│  ─────────────────────────────  │
│  Total:              $1,700     │
│                                 │
│  Contractor Payout:  $1,360     │
│  (80% of total)                 │
└─────────────────────────────────┘
```

---

### 6. Photo Uploader (`photo-uploader.tsx`)

See File Upload System section.

---

### 7. Status Badge (`status-badge.tsx`)

**Purpose:** Display job status with color coding.

**Props:**
```typescript
interface StatusBadgeProps {
  status: JobStatus;
}
```

**UI:**
- Pill-shaped badge with status text
- Color coded (see UI Design System section)

---

### 8. Messaging Placeholder (`messaging-placeholder.tsx`)

**Purpose:** Placeholder for future in-app messaging.

**Props:**
```typescript
interface MessagingPlaceholderProps {
  contactEmail: string;
  contactPhone?: string;
}
```

**UI:**
```
┌────────────────────────────────────────┐
│  💬 Messaging                          │
├────────────────────────────────────────┤
│  In-app messaging coming soon!         │
│                                        │
│  For now, contact directly:            │
│  Email: user@example.com         │
│  Phone: +1 202-555-0100                 │
└────────────────────────────────────────┘
```

---

### 9. App Navigation (`app-nav.tsx`)

**Purpose:** Role-based navigation bar.

**Props:**
```typescript
interface AppNavProps {
  role: 'homeowner' | 'contractor' | 'admin';
}
```

**Homeowner Nav:**
- Dashboard
- My Jobs
- Create Job
- Profile

**Contractor Nav:**
- Dashboard
- Job Feed
- Active Jobs
- Availability
- Profile

---

## Implementation Phases

### Phase 0: Project Setup & Infrastructure

**Duration:** 1-2 days

**Tasks:**
1. Install ShadCN UI
2. Configure Tailwind with Festly color palette
3. Set up folder structure (landing vs. app separation)
4. Install and configure `next-themes` (light mode forced)
5. Create base layouts for landing and app
6. Test Supabase connection (already set up)

**Deliverables:**
- ShadCN components installed
- Folder structure matches plan
- Light theme forced, dark theme ready for future
- Base layouts created

---

### Phase 1: Authentication & Roles

**Duration:** 3-4 days

**Tasks:**
1. Create auth pages:
   - Sign in (`/auth/signin`)
   - Sign up (`/auth/signup`)
2. Implement role onboarding flow:
   - Role selector (`/auth/onboarding/role`)
   - Homeowner profile setup (`/auth/onboarding/homeowner`)
   - Contractor profile setup (`/auth/onboarding/contractor`)
3. Create middleware for route protection
4. Implement role-based redirects
5. Force profile completion before app access
6. Create database migrations:
   - `profiles` table
   - `regions` table (seed Austin)

**Deliverables:**
- Users can sign up with email/password
- Users are forced to choose role and complete profile
- Role-based route protection working
- Database tables created and seeded

---

### Phase 2: Homeowner Job Creation & Listing

**Duration:** 4-5 days

**Tasks:**
1. Create job creation form (`/app/homeowner/jobs/new`)
2. Implement pricing engine (server-side)
3. Create pricing API endpoint (`/api/pricing/calculate`)
4. Add real-time pricing preview to job form
5. Implement photo upload component
6. Create job submission flow
7. Create homeowner dashboard (`/app/homeowner/dashboard`)
8. Create jobs list view (`/app/homeowner/jobs`)
9. Create job detail view (`/app/homeowner/jobs/[id]`)
10. Create database migrations:
    - `jobs` table
    - `job_photos` table

**Deliverables:**
- Homeowners can create jobs with all required fields
- Pricing is calculated correctly
- Photos can be uploaded
- Homeowners can view their jobs
- Jobs are stored in database with correct RLS

---

### Phase 3: Contractor Onboarding, Availability & Job Feed

**Duration:** 5-6 days

**Tasks:**
1. Create contractor profile setup
2. Implement Google Maps API distance calculation
3. Create availability editor (`/app/contractor/availability`)
4. Create database migrations:
   - `availability_windows` table
   - `availability_blackouts` table
5. Implement availability CRUD operations
6. Create job feed (`/app/contractor/jobs/feed`)
7. Implement distance filtering for job feed
8. Create job card component
9. Implement job accept flow (first-come, first-served)
10. Create active jobs view (`/app/contractor/jobs/active`)
11. Create contractor job detail view
12. Implement status transitions:
    - assigned → in_progress
    - in_progress → pending_review

**Deliverables:**
- Contractors can set weekly availability and blackouts
- Job feed shows open jobs within service radius
- Distance is calculated and displayed
- Contractors can accept jobs (with transaction safety)
- Contractors can see active jobs
- Status transitions work correctly

---

### Phase 4: Job Completion & Cancellation

**Duration:** 3-4 days

**Tasks:**
1. Implement homeowner job confirmation flow
2. Create job completion UI (homeowner side)
3. Implement status transitions:
   - pending_review → completed
   - pending_review → disputed
4. Implement cancellation logic (with 72-hour rule)
5. Create cancellation UI for homeowners
6. Create cancellation UI for contractors
7. Create database migration:
   - `contractor_cancellations` table
8. Log contractor cancellations
9. Display contact info after job acceptance

**Deliverables:**
- Homeowners can confirm job completion
- Homeowners can dispute jobs
- Cancellation rules enforced (72-hour rule)
- Contractor cancellations logged
- Contact info visible to both parties after acceptance

---

### Phase 5: Polish, Testing & Deployment

**Duration:** 3-4 days

**Tasks:**
1. Add form validation throughout app
2. Add loading states and error handling
3. Add toast notifications for user actions
4. Implement messaging placeholder UI
5. Test all user flows end-to-end:
   - Homeowner: sign up → create job → view job → confirm completion
   - Contractor: sign up → set availability → accept job → complete job
6. Test RLS policies
7. Test role-based access control
8. Optimize performance (image loading, etc.)
9. Prepare deployment to Vercel:
   - Set up environment variables
   - Connect Supabase production instance
   - Test production build
10. Deploy to Vercel

**Deliverables:**
- All forms validated
- Error handling in place
- User flows tested
- App deployed to Vercel

---

### Total Estimated Duration: 19-25 days

---

## Future Hooks

### 1. Visual Drawing Tool

**Integration Point:** Job creation flow

**Current:** Homeowners manually enter:
- Description
- Estimated length of lights
- Areas (text fields)

**Future:** Visual drawing tool will:
- Load homeowner's house image (from address lookup)
- Allow drawing light paths on image
- Auto-calculate length of lights
- Auto-detect areas (roofline, trees, etc.)
- Generate structured job data
- Call pricing engine automatically

**Database Changes:** None required; tool outputs same fields.

**Code Changes:**
- Replace `JobForm` component with `VisualDesignTool` component
- Keep pricing engine unchanged

---

### 2. Stripe/Real Payments

**Integration Point:** Job completion flow

**Current:** Payment status stored as `unpaid` (simulated).

**Future:**
- Homeowner enters payment method during job creation
- Stripe payment intent created when job moves to `assigned`
- Payment captured when job moves to `completed`
- Contractor payout processed via Stripe Connect

**Database Changes:**
- Add `stripe_payment_intent_id` to `jobs` table
- Add `stripe_account_id` to `profiles` table (contractors)

**Code Changes:**
- Add Stripe SDK
- Create payment flow in job creation
- Add webhook handler for payment events
- Update job completion to capture payment

---

### 3. In-App Messaging

**Integration Point:** Job detail pages

**Current:** Placeholder UI showing contact info.

**Future:**
- Real-time chat between homeowner and contractor
- Message history stored in `messages` table
- Notifications for new messages

**Database Changes:**
- Add `messages` table:
  ```sql
  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    sender_id UUID REFERENCES profiles(id),
    recipient_id UUID REFERENCES profiles(id),
    message_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
  );
  ```

**Code Changes:**
- Replace `MessagingPlaceholder` with `ChatInterface` component
- Add Supabase Realtime subscription for new messages
- Add notification system

---

### 4. Credibility/Reputation System

**Integration Point:** Contractor profiles

**Current:** Contractor cancellations logged but not used.

**Future:**
- Calculate credibility score based on:
  - Completed jobs
  - Cancellations
  - Disputes
  - Homeowner ratings (future)
- Display credibility badge on contractor profile
- Filter/sort job feed by contractor credibility

**Database Changes:**
- Add `credibility_score` to `profiles` table (contractors)
- Add `reviews` table for homeowner ratings

**Code Changes:**
- Create credibility calculation function
- Update contractor profile display
- Add review submission after job completion

---

### 5. Time-Slot Booking

**Integration Point:** Job creation flow

**Current:** Homeowner enters date or date range (free-form).

**Future:**
- Interactive calendar showing contractor availability
- Homeowner picks specific time slot
- Contractor availability updated in real-time

**Database Changes:**
- Add `booked_slots` table to track reserved times

**Code Changes:**
- Create calendar UI component
- Implement slot reservation logic
- Update availability checker

---

### 6. Admin Dashboard

**Integration Point:** Admin role

**Current:** Manual DB management via Supabase Studio.

**Future:**
- Admin UI at `/admin`
- User management (suspend, activate)
- Job management (reassign, resolve disputes)
- Analytics dashboard

**Database Changes:** None (use existing RLS bypass with service role).

**Code Changes:**
- Create admin layout and pages
- Create admin middleware
- Build user and job management UIs

---

## Environment Variables

### Required Variables

```bash
# Supabase (Local Development)
NEXT_PUBLIC_SUPABASE_URL=<configure-locally>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configure-locally>
SUPABASE_SERVICE_ROLE_KEY=<configure-locally>

# Supabase (Production - comment out for local dev)
# NEXT_PUBLIC_SUPABASE_URL=https://example.invalid
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Admin (Waitlist - existing)
ADMIN_PASSWORD=PLACEHOLDER
```

### `.env.example`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<configure-locally>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configure-locally>
SUPABASE_SERVICE_ROLE_KEY=<configure-locally>

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Admin
ADMIN_PASSWORD=your_admin_password
```

---

## Deployment

### Vercel Deployment

**Prerequisites:**
1. Vercel account connected to GitHub repo
2. Supabase production project created
3. Google Maps API key obtained

**Steps:**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Complete Phase 1 marketplace implementation"
   git push origin main
   ```

2. **Create Vercel project**
   - Go to Vercel dashboard
   - Import GitHub repository
   - Select "festly" repo

3. **Configure environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all production environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL` (production URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `GOOGLE_MAPS_API_KEY`
     - `NEXT_PUBLIC_DOMAIN` (your production domain)
     - `ADMIN_PASSWORD`

4. **Deploy**
   - Vercel will auto-deploy on push to `main`
   - Or manually trigger deployment from dashboard

5. **Apply database migrations to production:**
   ```bash
   # Switch to production Supabase in .env.local
   npm run db:migrate
   ```

6. **Verify deployment:**
   - Test sign up flow
   - Test job creation
   - Test job acceptance
   - Verify all routes work

### Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied to production
- [ ] Supabase RLS policies active
- [ ] Google Maps API key has production domain whitelisted
- [ ] Test user flows end-to-end
- [ ] Monitor Vercel logs for errors
- [ ] Set up error tracking (Sentry, optional)

---

## Success Criteria

Phase 1 is complete when:

✅ **Authentication & Roles**
- Users can sign up with email/password
- Users choose role and complete profile
- Role-based access control working

✅ **Homeowner Flow**
- Homeowners can create jobs with all required fields
- Pricing is calculated correctly
- Photos can be uploaded
- Jobs are visible in homeowner dashboard

✅ **Contractor Flow**
- Contractors can set weekly availability
- Contractors can see job feed filtered by distance
- Contractors can accept jobs (first-come, first-served)
- Contractors can mark jobs as in-progress and request completion

✅ **Job Lifecycle**
- Jobs transition through all statuses correctly
- Homeowners can confirm job completion
- Homeowners and contractors can cancel jobs (with rules enforced)
- Contact info is visible after job acceptance

✅ **Technical**
- All database tables created with RLS policies
- ShadCN UI integrated and working
- Landing page (Untitled UI) and app (ShadCN) are separate
- App deployed to Vercel
- Light theme forced, dark theme ready for future

---

## Notes for Future Sessions

When implementing:

1. **Always refer to this document** for schema definitions, status flows, and component specs.

2. **Follow the phase order** to avoid building features that depend on incomplete foundations.

3. **Test RLS policies** thoroughly before moving to next phase.

4. **Commit frequently** with clear messages referencing this plan (e.g., "Phase 2.3: Add pricing preview to job form").

5. **Use TypeScript strictly** - leverage auto-generated types from Supabase.

6. **Keep ShadCN and Untitled UI separate** - don't mix styles between landing and app.

7. **Don't build admin UI** - use Supabase Studio for Phase 1.

8. **Placeholder for messaging** - don't spend time building real chat yet.

9. **Google Maps API** - ensure API key is added to `.env.local` before implementing distance features.

10. **Pricing engine** - keep it server-side; never expose pricing logic in client code.

---

**End of Build Plan**

This document serves as the single source of truth for Festly Phase 1 marketplace implementation. All code should align with the specifications, schemas, and flows defined here.
