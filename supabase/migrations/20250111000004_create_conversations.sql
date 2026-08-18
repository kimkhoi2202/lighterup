-- Create conversations table
-- Represents chat threads between homeowners and contractors for each job

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one conversation per job between these two users
  CONSTRAINT unique_job_conversation UNIQUE (job_id, homeowner_id, contractor_id)
);

-- Create indexes for performance
CREATE INDEX idx_conversations_homeowner ON conversations(homeowner_id);
CREATE INDEX idx_conversations_contractor ON conversations(contractor_id);
CREATE INDEX idx_conversations_job ON conversations(job_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view conversations they're part of (as homeowner or contractor)
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = homeowner_id OR auth.uid() = contractor_id
  );

-- Users can create conversations for jobs they're involved in
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    (auth.uid() = homeowner_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'homeowner')
    OR
    (auth.uid() = contractor_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'contractor')
  );


