-- =========================================================
-- FIREBASE COMPATIBILITY SCRIPT
-- Run this in your Supabase SQL Editor
-- =========================================================

-- This script modifies your Supabase database to accept Firebase User IDs.
-- It changes ID columns from UUID to TEXT and removes Foreign Key constraints.

-- 1. PROFILES TABLE
-- Change ID to TEXT to accept Firebase UIDs (which are strings)
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
-- Remove the link to Supabase Auth (since we use Firebase Auth)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;


-- 2. QUIZZES TABLE
-- Change teacher_id to TEXT
ALTER TABLE quizzes ALTER COLUMN teacher_id TYPE TEXT;
-- Remove the link to Supabase Auth
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_teacher_id_fkey;


-- 3. GAME SESSIONS TABLE
-- Change teacher_id to TEXT
ALTER TABLE game_sessions ALTER COLUMN teacher_id TYPE TEXT;
-- Remove the link to Supabase Auth
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_teacher_id_fkey;


-- 4. ENSURE OTHER FIXES ARE APPLIED (Just in case)
-- Add status column for anti-cheat
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_participants' AND column_name = 'status') THEN
        ALTER TABLE game_participants ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Update score columns to support decimals
ALTER TABLE game_participants ALTER COLUMN score TYPE DECIMAL(10, 1);
ALTER TABLE game_answers ALTER COLUMN points_earned TYPE DECIMAL(10, 1);
