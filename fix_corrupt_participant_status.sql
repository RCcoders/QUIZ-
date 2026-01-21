-- =====================================================
-- Fix Corrupted Participant Status Values
-- =====================================================
-- Problem: Some participants have invalid status values like "left0"
-- Solution: Reset all invalid statuses to 'active'

-- Step 1: Check current status distribution
SELECT 
    status,
    COUNT(*) as count,
    string_agg(name, ', ') as participant_names
FROM game_participants
GROUP BY status
ORDER BY count DESC;

-- Step 2: Identify corrupted statuses (anything not 'active', 'left', or 'kicked')
SELECT 
    id,
    name,
    email,
    status,
    joined_at,
    session_id
FROM game_participants
WHERE status NOT IN ('active', 'left', 'kicked')
   OR status IS NULL
ORDER BY joined_at DESC;

-- Step 3: Fix all corrupted statuses by setting them to 'active'
UPDATE game_participants
SET status = 'active'
WHERE status NOT IN ('active', 'left', 'kicked')
   OR status IS NULL;

-- Step 4: Verify the fix
SELECT 
    status,
    COUNT(*) as count
FROM game_participants
GROUP BY status
ORDER BY status;

-- Step 5: For active game sessions, ensure all participants have valid statuses
UPDATE game_participants
SET status = 'active'
WHERE session_id IN (
    SELECT id FROM game_sessions 
    WHERE status != 'ended'
)
AND status != 'kicked'; -- Keep kicked status if they were intentionally kicked

-- Final verification
SELECT 
    'Total Participants' as metric,
    COUNT(*) as count
FROM game_participants
UNION ALL
SELECT 
    'Active' as metric,
    COUNT(*) as count
FROM game_participants
WHERE status = 'active'
UNION ALL
SELECT 
    'Left' as metric,
    COUNT(*) as count
FROM game_participants
WHERE status = 'left'
UNION ALL
SELECT 
    'Kicked' as metric,
    COUNT(*) as count  
FROM game_participants
WHERE status = 'kicked';
