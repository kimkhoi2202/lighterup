-- Create regions table
-- Labor rates and service area definitions by region

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

-- Index
CREATE INDEX idx_regions_name ON regions(name);

-- Enable RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read active regions
CREATE POLICY "Anyone can view active regions"
  ON regions FOR SELECT
  USING (is_active = true);

-- Trigger to update updated_at
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Austin region
INSERT INTO regions (
  name,
  state,
  labor_rate_per_foot_cents,
  complexity_simple_cents,
  complexity_medium_cents,
  complexity_complex_cents,
  lights_provided_addon_cents,
  storage_addon_cents
)
VALUES (
  'Austin',
  'TX',
  300, -- $3/foot base
  0,
  50000, -- $500
  150000, -- $1500
  25000, -- $250
  10000 -- $100
);
