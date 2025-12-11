-- ============================================
-- Supabase Authentication Migration
-- ============================================
-- This migration adds user authentication support to the Form Connector project
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add user_id column to connectors table
-- This column stores the Clerk user ID for multi-tenant support
ALTER TABLE connectors 
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'anonymous';

-- Step 2: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_connectors_user_id ON connectors(user_id);

-- Step 3: Update existing connectors (if any) to have a default user_id
-- Note: In production, you may want to assign these to specific users
UPDATE connectors 
SET user_id = 'anonymous' 
WHERE user_id IS NULL OR user_id = '';

-- Step 4: Add user_id to submissions table (optional but recommended)
-- This allows linking submissions to users for better data isolation
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Step 5: Create index on submissions.user_id
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);

-- Step 6: Update submissions to get user_id from their connector
UPDATE submissions s
SET user_id = c.user_id
FROM connectors c
WHERE s.connector_id = c.id AND s.user_id IS NULL;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- These policies ensure users can only access their own data

-- Enable RLS on connectors table
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own connectors
CREATE POLICY "Users can view own connectors"
ON connectors
FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can insert their own connectors
CREATE POLICY "Users can insert own connectors"
ON connectors
FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can update their own connectors
CREATE POLICY "Users can update own connectors"
ON connectors
FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Users can delete their own connectors
CREATE POLICY "Users can delete own connectors"
ON connectors
FOR DELETE
USING (auth.jwt() ->> 'sub' = user_id);

-- Enable RLS on submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view submissions from their own connectors
CREATE POLICY "Users can view own submissions"
ON submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM connectors c
    WHERE c.id = submissions.connector_id
    AND c.user_id = auth.jwt() ->> 'sub'
  )
);

-- Policy: Allow public inserts to submissions (for webhook endpoint)
-- This allows the /api/submit/[connectorId] endpoint to work without authentication
CREATE POLICY "Public can insert submissions"
ON submissions
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update submissions from their own connectors
CREATE POLICY "Users can update own submissions"
ON submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM connectors c
    WHERE c.id = submissions.connector_id
    AND c.user_id = auth.jwt() ->> 'sub'
  )
);

-- ============================================
-- Notes:
-- ============================================
-- 1. The webhook endpoint (/api/submit/[connectorId]) remains public
--    and does not require authentication, allowing external forms to submit data.
--
-- 2. Clerk user IDs are stored as TEXT in the user_id column.
--
-- 3. The default value 'anonymous' is used for backward compatibility
--    but should be replaced with actual user IDs in production.
--
-- 4. RLS policies use auth.jwt() ->> 'sub' to get the user ID from the JWT token.
--    For Clerk integration, you may need to configure Supabase to accept Clerk JWTs,
--    or use a different approach (e.g., storing Clerk user ID directly).
--
-- 5. If using Clerk with Supabase, you may need to:
--    - Configure Clerk to issue JWTs compatible with Supabase
--    - Or use a custom authentication approach where Clerk user ID is passed
--      as a header and verified server-side
--
-- ============================================





