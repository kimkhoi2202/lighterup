-- Add reactions and pin metadata to messages table
-- Reactions are stored as an array of objects:
--   [{ "emoji": "👍", "userIds": ["user-1", "user-2"], "count": 2 }, ...]

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Helpful index for querying pinned messages within a conversation
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON messages(is_pinned);


