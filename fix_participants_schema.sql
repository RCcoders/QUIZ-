-- Complete migration to add all missing columns to game_participants table
-- Run this in Supabase SQL Editor

-- 1. Add status column (if it doesn't exist)
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add violation tracking columns
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;

ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS kick_reason TEXT DEFAULT NULL;

-- 3. Add last_seen_at column for tracking
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Update any existing participants to have 'active' status
UPDATE game_participants 
SET status = 'active' 
WHERE status IS NULL;

-- 5. Add check constraint for status values
ALTER TABLE game_participants 
DROP CONSTRAINT IF EXISTS game_participants_status_check;

ALTER TABLE game_participants 
ADD CONSTRAINT game_participants_status_check 
CHECK (status IN ('active', 'left', 'kicked'));

-- 6. Add comments for documentation
COMMENT ON COLUMN game_participants.status IS 'Participant status: active, left, or kicked';
COMMENT ON COLUMN game_participants.violation_count IS 'Number of anti-cheat violations before kick';
COMMENT ON COLUMN game_participants.kick_reason IS 'Reason for being kicked (e.g., Anti-cheat violations)';
COMMENT ON COLUMN game_participants.last_seen_at IS 'Last activity timestamp';

-- 7. Verify the columns were created
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'game_participants' 
  AND column_name IN ('status', 'violation_count', 'kick_reason', 'last_seen_at')
ORDER BY column_name;
