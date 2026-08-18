-- Add RLS policy to allow contractors to accept open jobs
-- This policy allows contractors to update open jobs (where contractor_id IS NULL)
-- to assign themselves by setting contractor_id and status

CREATE POLICY "Contractors can accept open jobs"
  ON jobs FOR UPDATE
  USING (
    status = 'open'
    AND contractor_id IS NULL
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'contractor'
  )
  WITH CHECK (
    status = 'assigned'
    AND contractor_id = auth.uid()
  );

