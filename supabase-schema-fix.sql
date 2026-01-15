-- =============================================
-- FIX: Update profiles and quizzes tables to accept Firebase UIDs (TEXT instead of UUID)
-- Run this in your Supabase SQL Editor
-- =============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow all operations on game_sessions" ON game_sessions;

-- Drop foreign key constraints
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_teacher_id_fkey;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_teacher_id_fkey;

-- Drop the tables and recreate with correct types
DROP TABLE IF EXISTS game_answers;
DROP TABLE IF EXISTS game_participants;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS responses;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS profiles;

-- =============================================
-- PROFILES TABLE (id is TEXT for Firebase UID)
-- =============================================
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,  -- Firebase UID is a string, not UUID
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUIZZES TABLE (teacher_id is TEXT for Firebase UID)
-- =============================================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    timer_enabled BOOLEAN DEFAULT TRUE,
    timer_seconds INTEGER DEFAULT 30,
    show_results BOOLEAN DEFAULT TRUE,
    show_leaderboard BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUESTIONS TABLE
-- =============================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESPONSES TABLE
-- =============================================
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    answers JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================
-- GAME_SESSIONS TABLE (teacher_id is TEXT)
-- =============================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'question', 'results', 'ended')),
    current_question_index INTEGER DEFAULT 0,
    question_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- =============================================
-- GAME_PARTICIPANTS TABLE
-- =============================================
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GAME_ANSWERS TABLE
-- =============================================
CREATE TABLE game_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    answer TEXT NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN DEFAULT FALSE,
    time_taken_ms INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_quizzes_teacher_id ON quizzes(teacher_id);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_responses_quiz_id ON responses(quiz_id);
CREATE INDEX idx_game_sessions_game_code ON game_sessions(game_code);
CREATE INDEX idx_game_participants_session_id ON game_participants(session_id);
CREATE INDEX idx_game_answers_session_id ON game_answers(session_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on responses" ON responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on game_participants" ON game_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on game_answers" ON game_answers FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_answers;
