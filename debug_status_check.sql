-- Debug query to check participant status
-- Run this in Supabase SQL Editor to see the issue

SELECT 
    name,
    email,
    status,
    violation_count,
    kick_reason,
    joined_at
FROM game_participants
WHERE session_id = (
    SELECT id FROM game_sessions 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY joined_at DESC;

-- Expected: status should be 'active' for currently playing participants
-- If you see NULL or 'left' for active players, that's the bug
