-- Update profiles table to allow full_name to be nullable
-- This allows auto-creation of profiles before user provides their name
ALTER TABLE public.profiles
ALTER COLUMN full_name DROP NOT NULL;

-- Set a default value for full_name
ALTER TABLE public.profiles
ALTER COLUMN full_name SET DEFAULT '';
