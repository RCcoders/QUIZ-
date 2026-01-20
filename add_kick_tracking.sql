-- Add violation tracking columns to game_participants table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;

ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS kick_reason TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN game_participants.violation_count IS 'Number of anti-cheat violations before kick';
COMMENT ON COLUMN game_participants.kick_reason IS 'Reason for being kicked (e.g., Anti-cheat violations)';
