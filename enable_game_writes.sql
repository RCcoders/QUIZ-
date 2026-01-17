-- Enable writes for game participants and answers
-- Run this in the Supabase SQL Editor

-- 1. Ensure RLS is enabled (it should be already)
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- 2. Create policies to allow INSERT/UPDATE for everyone (since we handle auth via game code/session logic in app)
-- Note: In a production app with user accounts, you'd check auth.uid(), but for this public game join flow:

-- Policies for game_participants
CREATE POLICY "Enable insert for everyone" ON game_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for everyone" ON game_participants FOR UPDATE USING (true);
CREATE POLICY "Enable select for everyone" ON game_participants FOR SELECT USING (true);

-- Policies for game_answers
CREATE POLICY "Enable insert for everyone" ON game_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for everyone" ON game_answers FOR SELECT USING (true);

-- 3. Grant usage on sequences if needed (usually auto-handled but good to be safe)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
