-- Add contractor scheduling settings and Google Calendar integration columns to profiles table

-- Scheduling settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_notice_hours INTEGER DEFAULT 48;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 60;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS future_booking_days INTEGER DEFAULT 60;

-- Google Calendar integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN profiles.buffer_before_minutes IS 'Travel time buffer before appointments (in minutes)';
COMMENT ON COLUMN profiles.buffer_after_minutes IS 'Travel/cleanup time buffer after appointments (in minutes)';
COMMENT ON COLUMN profiles.minimum_notice_hours IS 'Minimum advance notice required for bookings (in hours)';
COMMENT ON COLUMN profiles.slot_interval_minutes IS 'Time slot granularity for bookings (in minutes)';
COMMENT ON COLUMN profiles.future_booking_days IS 'Maximum days in advance that bookings can be made';
COMMENT ON COLUMN profiles.google_calendar_id IS 'Google Calendar ID (usually email address)';
COMMENT ON COLUMN profiles.google_calendar_access_token IS 'OAuth access token for Google Calendar API';
COMMENT ON COLUMN profiles.google_calendar_refresh_token IS 'OAuth refresh token for long-term access';
COMMENT ON COLUMN profiles.google_calendar_token_expires_at IS 'Expiration timestamp for the access token';
COMMENT ON COLUMN profiles.google_calendar_connected_at IS 'Timestamp when calendar was first connected';
COMMENT ON COLUMN profiles.google_calendar_last_sync IS 'Timestamp of last successful calendar sync';


