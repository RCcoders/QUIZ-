# Kicked Section Bug - Quick Fix Guide

## 🐛 The Problem
Active participants are showing in the "Left/Kicked" section.

## 🔍 Root Cause
The `status` column in `game_participants` table is missing or has incorrect default values for existing participants.

## ✅ Solution - Run These Steps:

### Step 1: Check Current Status in Supabase
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run `debug_status_check.sql`
4. Look at the `status` column - it's probably NULL or 'left'

### Step 2: Fix Existing Data
Run this UPDATE query in Supabase SQL Editor:

```sql
-- Fix all existing participants who are stuck in "left" status
UPDATE game_participants
SET status = 'active'
WHERE status IS NULL OR status = 'left';

-- Verify the fix
SELECT status, COUNT(*) 
FROM game_participants 
GROUP BY status;
```

### Step 3: Ensure Schema Has Correct Default
Run the full migration from `fix_participants_schema.sql` if you haven't already.

### Step 4: Test
1. **Restart dev server** (important!)
2. Create a new game session
3. Join as a student
4. Check teacher dashboard - you should be in "Active" section

## 🎯 Expected Result
- New participants: status = 'active' (automatically)
- Kicked participants: status = 'kicked' + violation_count + kick_reason
- Left participants: status = 'left'

## 🚨 If Still Not Working
The issue is that participants are being created without a status value. I'll need to patch the `joinParticipant` function in the code.
