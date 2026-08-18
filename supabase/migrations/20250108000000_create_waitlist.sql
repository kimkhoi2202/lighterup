-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  zip_code text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Allow public insert" ON public.waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role to select (admin only)
CREATE POLICY "Allow admin select" ON public.waitlist
  FOR SELECT
  USING (false);
