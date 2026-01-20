-- IMMEDIATE FIX for Kicked Section Bug
-- Run this in Supabase SQL Editor NOW

-- Step 1: Fix ALL existing participants to be active
UPDATE game_participants
SET status = 'active'
WHERE status IS NULL 
   OR (status = 'left' AND kick_reason IS NULL);

-- Step 2: Verify the fix
SELECT 
    status,
    COUNT(*) as count
FROM game_participants
GROUP BY status;

-- Expected Output:
-- status | count
-- -------+-------
-- active |   X   (all your participants)

-- Step 3: Check latest session
SELECT 
    name,
    email,
    status,
    violation_count,
    kick_reason
FROM game_participants
WHERE session_id = (
    SELECT id FROM game_sessions 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- All should show status = 'active'
