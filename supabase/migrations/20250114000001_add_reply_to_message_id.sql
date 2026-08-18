-- Add reply_to_message_id column to messages table
-- This allows messages to reference other messages they're replying to

ALTER TABLE messages
ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);

-- Update RLS policy to allow viewing replied-to messages
-- (The existing SELECT policy already covers this since users can view all messages in their conversations)

