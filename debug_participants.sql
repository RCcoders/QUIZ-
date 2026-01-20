-- Check current participant status values in the database
-- Run this in Supabase SQL Editor to debug the kicked section issue

SELECT 
    name,
    status,
    violation_count,
    kick_reason,
    joined_at
FROM game_participants
WHERE session_id = '<YOUR_SESSION_ID_HERE>'
ORDER BY joined_at DESC;

-- This will show you:
-- 1. What status values participants actually have
-- 2. Whether violation_count and kick_reason columns exist
-- 3. If all participants have a status or if some are NULL
