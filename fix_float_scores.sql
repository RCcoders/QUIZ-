-- FIX: Allow decimal scores (e.g. 11.7) instead of just integers
-- Run this in your Supabase SQL Editor

-- 1. Alter game_answers table
ALTER TABLE game_answers 
ALTER COLUMN points_earned TYPE NUMERIC(10, 1);

-- 2. Alter game_participants table
ALTER TABLE game_participants 
ALTER COLUMN score TYPE NUMERIC(10, 1);

-- 3. Alter responses table (for self-paced mode)
ALTER TABLE responses 
ALTER COLUMN score TYPE NUMERIC(10, 1);

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload config';
