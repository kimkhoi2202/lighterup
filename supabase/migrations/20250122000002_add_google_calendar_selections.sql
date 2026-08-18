-- Add calendar selection storage for conflict checking
-- Stores array of Google Calendar external IDs that are selected for checking conflicts

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS google_calendar_selected_ids JSONB DEFAULT '[]';

COMMENT ON COLUMN profiles.google_calendar_selected_ids IS 
'Array of Google Calendar external IDs selected for conflict checking';

