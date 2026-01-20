# Question Display Bug - Debug Script

Run this in Supabase SQL Editor to check the actual status values:

```sql
-- Check the latest game session status
SELECT 
    id,
    quiz_id,
    status,
    current_question_index,
    created_at
FROM game_sessions
ORDER BY created_at DESC
LIMIT 5;

-- Expected status values: 'waiting', 'question', 'results', 'ended'
-- If you see different values, that's the bug!
```

## Quick Test:
1. As teacher: Start a game, click "Next Question"
2. Run the SQL above
3. Check if `status` is 'question' or something else
4. Report back what you see!
