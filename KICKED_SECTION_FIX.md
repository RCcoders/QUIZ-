# Participant Status "left0" Bug - Fix Instructions

## 🐛 Problem
Students who are waiting/playing are incorrectly showing up in the "Left/Kicked" section with an invalid status value like "left0".

## 🔍 Root Cause
The `game_participants` table has corrupted status values. Valid statuses are:
- `'active'` - Student is actively participating
- `'left'` - Student left the game  
- `'kicked'` - Student was kicked by teacher

The value "left0" is **corrupted/invalid data** in your Supabase database.

## ✅ Solution Steps

### Step 1: Fix the Database (REQUIRED)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Run the SQL script in `fix_corrupt_participant_status.sql`

This will:
- Identify all participants with invalid statuses
- Reset them to 'active'
- Show you a summary of the fix

### Step 2: Prevent Future Issues
The code at `src/lib/database.ts` line 614 ensures new participants start with `status: 'active'`. This is correct and should prevent new corruption.

### Step 3: Test
1. After running the SQL fix, **refresh your teacher dashboard**
2. The participant should now appear in the correct section ("Waiting" or "Answered")
3. The console will warn if any invalid statuses are detected

## 📋 Quick SQL Fix (Copy-Paste)

```sql
-- Fix all corrupted participant statuses
UPDATE game_participants
SET status = 'active'
WHERE status NOT IN ('active', 'left', 'kicked')
   OR status IS NULL;

-- Verify the fix worked
SELECT status, COUNT(*) as count
FROM game_participants
GROUP BY status
ORDER BY status;
```

## 🚨 If Problem Persists

If participants still show in the wrong section after the SQL fix:

1. Check the browser console for warnings about invalid statuses
2. Clear your browser cache and reload
3. Make sure you're looking at an active game session (not an old one)
4. Share a screenshot of the Supabase `game_participants` table

## 📝 Technical Notes

**Where the filtering happens** (`GameHost.tsx` lines 624, 664, 668):
- **Answered**: Students who have submitted an answer for the current question
- **Waiting**: Students who haven't answered yet AND status is NOT 'kicked' or 'left'  
- **Left/Kicked**: Students where status = 'kicked' OR status = 'left'

The invalid status "left0" causes students to incorrectly match the "Left/Kicked" filter because it's not 'active'.
