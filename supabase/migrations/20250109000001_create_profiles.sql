-- Create profiles table
-- Extends Supabase auth.users with role-specific profile data

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

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_location ON profiles(home_latitude, home_longitude);
CREATE INDEX idx_profiles_contractor_location ON profiles(service_base_latitude, service_base_longitude);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (during onboarding)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Contractors can see homeowner public info (for accepted jobs)
CREATE POLICY "Contractors can view homeowner profiles"
  ON profiles FOR SELECT
  USING (
    role = 'homeowner'
    AND is_active = true
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
