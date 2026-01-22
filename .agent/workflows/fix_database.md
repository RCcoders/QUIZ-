---
description: Fix common database issues
---

This workflow helps apply common database fixes using the SQL scripts present in the project.

1. Fix Participants Schema (Run this if you have issues with participants joining or being kicked)
// turbo
```bash
npx supabase db reset --linked # CAUTION: This resets the DB. Only use if you know what you are doing.
# OR just apply the fix:
# You would typically run this via the Supabase dashboard or a specific command if configured.
# Since we don't have a direct CLI command configured for these SQL files, 
# please run the contents of 'fix_participants_schema.sql' in your Supabase SQL Editor.
```

2. Fix Database Permissions
```bash
# Run the contents of 'fix_database.sql' in your Supabase SQL Editor.
```
