-- Run this in Supabase SQL Editor to fix the "kick reason column not found" error

-- 1. Add kick_reason column (safe to run multiple times)
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS kick_reason TEXT;

-- 2. Add violation_count column
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;

-- 3. Force Supabase to refresh its schema cache
-- This is CRITICAL for the "schema cache" error to go away
NOTIFY pgrst, 'reload config';

-- 4. Verify columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'game_participants' 
  AND column_name IN ('kick_reason', 'violation_count');
