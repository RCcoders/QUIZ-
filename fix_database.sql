-- ==========================================
-- MASTER FIX SCRIPT FOR QUIZ APP
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add 'status' column to game_participants if it doesn't exist
--    This tracks if a student is 'active', 'left', or 'kicked'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'status') THEN
        ALTER TABLE game_participants ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 2. Change 'score' in game_participants to DECIMAL to support 0.1 precision
--    (e.g. 11.6 points)
ALTER TABLE game_participants ALTER COLUMN score TYPE DECIMAL(10, 1);

-- 3. Change 'points_earned' in game_answers to DECIMAL
ALTER TABLE game_answers ALTER COLUMN points_earned TYPE DECIMAL(10, 1);

-- 4. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('game_participants', 'game_answers') 
AND column_name IN ('status', 'score', 'points_earned');
