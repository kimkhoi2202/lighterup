-- Create job_photos table
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

-- Create index
CREATE INDEX idx_job_photos_job ON job_photos(job_id);

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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

-- Job owners can delete their photos
CREATE POLICY "Job owners can delete photos"
  ON job_photos FOR DELETE
  USING (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE id = job_id AND homeowner_id = auth.uid()
    )
  );
