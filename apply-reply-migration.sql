-- Migration: Add reply_to_message_id column to messages table
-- Run this SQL in your database to enable reply functionality

-- Add reply_to_message_id column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_message_id';

