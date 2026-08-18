-- Create jobs table
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

-- Create indexes
CREATE INDEX idx_jobs_homeowner ON jobs(homeowner_id);
CREATE INDEX idx_jobs_contractor ON jobs(contractor_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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

-- Contractors can view open jobs (distance filtering done in app logic)
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
