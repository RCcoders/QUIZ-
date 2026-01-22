-- Add last_seen column to game_participants table
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing participants to have a last_seen value
UPDATE game_participants 
SET last_seen = NOW() 
WHERE last_seen IS NULL;
