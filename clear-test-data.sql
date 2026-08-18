-- Clear test data from local database
-- This will delete all messages and reset jobs

-- Delete all messages
DELETE FROM messages;

-- Delete all conversations
DELETE FROM conversations;

-- Reset jobs - either delete them or set contractor_id back to null
-- Option 1: Delete all jobs
-- DELETE FROM jobs;

-- Option 2: Reset accepted jobs (set contractor_id to null)
UPDATE jobs 
SET contractor_id = NULL, 
    status = 'open', 
    assigned_at = NULL
WHERE contractor_id IS NOT NULL;

-- Verify the changes
SELECT 'Messages deleted' as action, COUNT(*) as remaining_count FROM messages
UNION ALL
SELECT 'Conversations deleted' as action, COUNT(*) as remaining_count FROM conversations
UNION ALL
SELECT 'Jobs reset' as action, COUNT(*) as remaining_count FROM jobs WHERE contractor_id IS NOT NULL;

