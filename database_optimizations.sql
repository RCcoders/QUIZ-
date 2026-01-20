-- Database Optimizations for Scalability (75+ Concurrent Students)
-- Run this SQL in your Supabase SQL Editor

-- Index for fast participant lookups by session and score (leaderboard)
CREATE INDEX IF NOT EXISTS idx_participants_session_score 
ON game_participants(session_id, score DESC);

-- Index for answer queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_answers_session_question
ON game_answers(session_id, question_index, participant_id);

-- Index for game code lookups (speeds up student joining)
CREATE INDEX IF NOT EXISTS idx_sessions_game_code
ON game_sessions(game_code) WHERE status != 'ended';

-- Optional: Add constraint to prevent duplicate answers
ALTER TABLE game_answers 
DROP CONSTRAINT IF EXISTS unique_participant_question;

ALTER TABLE game_answers
ADD CONSTRAINT unique_participant_question 
UNIQUE(participant_id, session_id, question_index);

-- Analysis: Run this to check current database performance
-- Uncomment to analyze table statistics
-- ANALYZE game_sessions;
-- ANALYZE game_participants;
-- ANALYZE game_answers;
