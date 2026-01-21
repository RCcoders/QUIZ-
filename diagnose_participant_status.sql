-- Comprehensive Diagnosis for Participant Status Issues
-- Run this in Supabase SQL Editor to understand the current state

-- 1. Show all participants with their current status values
SELECT 
    gp.id,
    gp.name,
    gp.email,
    gp.status,
    gp.violation_count,
    gp.kick_reason,
    gp.score,
    gp.joined_at,
    gs.game_code,
    gs.status as session_status
FROM game_participants gp
LEFT JOIN game_sessions gs ON gp.session_id = gs.id
WHERE gs.status != 'ended'  -- Only show active sessions
ORDER BY gs.created_at DESC, gp.joined_at DESC
LIMIT 50;

-- 2. Count participants by status
SELECT 
    gp.status,
    COUNT(*) as participant_count,
    string_agg(gp.name, ', ') as names
FROM game_participants gp
LEFT JOIN game_sessions gs ON gp.session_id = gs.id  
WHERE gs.status != 'ended'
GROUP BY gp.status
ORDER BY participant_count DESC;

-- 3. Find any invalid status values
SELECT 
    id,
    name,
    status,
    session_id
FROM game_participants
WHERE status NOT IN ('active', 'left', 'kicked')
   OR status IS NULL
   OR LENGTH(status) > 10;  -- Flag suspiciously long status values

-- 4. Fix all invalid statuses
UPDATE game_participants
SET status = 'active'
WHERE (status NOT IN ('active', 'left', 'kicked')
   OR status IS NULL
   OR LENGTH(status) > 10)
   AND session_id IN (
       SELECT id FROM game_sessions WHERE status != 'ended'
   );

-- 5. Verify the fix
SELECT 
    gp.status,
    COUNT(*) as count
FROM game_participants gp
LEFT JOIN game_sessions gs ON gp.session_id = gs.id
WHERE gs.status != 'ended'
GROUP BY gp.status;
