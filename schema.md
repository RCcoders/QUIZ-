# Database Schema for Quiz Master

## Option A: Supabase (PostgreSQL) - **RECOMMENDED**
Run the following SQL commands in your **Supabase SQL Editor** to create all the necessary tables for the application.

### 1. Profiles Table
Stores user (teacher) information.
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. Quizzes Table
Stores the quiz metadata created by teachers.
```sql
CREATE TABLE quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  timer_enabled BOOLEAN DEFAULT true,
  timer_seconds INTEGER DEFAULT 30,
  show_results BOOLEAN DEFAULT true,
  show_leaderboard BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Questions Table
Stores questions for each quiz.
```sql
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT CHECK (correct_answer IN ('A', 'B', 'C', 'D')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4. Responses Table
Stores results for self-paced (student) quizzes.
```sql
CREATE TABLE responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 5. Game Sessions Table
Stores live game sessions hosted by teachers.
```sql
CREATE TABLE game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) NOT NULL,
  game_code TEXT NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'playing', 'question', 'results', 'ended')) DEFAULT 'waiting',
  current_question_index INTEGER DEFAULT 0,
  question_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);
```

### 6. Game Participants Table
Stores students who join a live game session.
**Includes Anti-Cheat & Decimal Scoring support.**
```sql
CREATE TABLE game_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  score DECIMAL(10, 1) DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'active' -- 'active', 'left', 'kicked'
);
```

### 7. Game Answers Table
Stores individual answers submitted by students in a live game.
**Includes Decimal Scoring support.**
```sql
CREATE TABLE game_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  time_taken_ms INTEGER DEFAULT 0,
  points_earned DECIMAL(10, 1) DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 8. Enable Realtime
To make the live game work, you must enable Realtime for the game tables. Run this:

```sql
-- Enable replication for realtime features
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table game_participants;
alter publication supabase_realtime add table game_answers;
```

---

## Option B: Firebase (Firestore NoSQL)
**WARNING:** Switching to Firebase requires rewriting `src/lib/database.ts` entirely and installing the Firebase SDK.

Firebase is **NoSQL**, so you don't create tables. Instead, you have **Collections** (folders) and **Documents** (files).

### 1. Data Structure (Collections)

#### `users` (Collection)
*   `uid` (Document ID)
    *   `email`: string
    *   `name`: string
    *   `createdAt`: timestamp

#### `quizzes` (Collection)
*   `quizId` (Document ID)
    *   `teacherId`: string (uid)
    *   `title`: string
    *   `description`: string
    *   `timerEnabled`: boolean
    *   `timerSeconds`: number
    *   `questions`: Array of Objects (or a sub-collection)
        *   `questionText`: string
        *   `options`: { A: string, B: string, ... }
        *   `correctAnswer`: string

#### `game_sessions` (Collection)
*   `sessionId` (Document ID)
    *   `gameCode`: string
    *   `status`: 'waiting' | 'playing' | ...
    *   `currentQuestionIndex`: number
    *   `participants` (Sub-collection)
        *   `participantId` (Document ID)
            *   `name`: string
            *   `score`: number (float)
            *   `status`: 'active' | 'left' | 'kicked'
    *   `answers` (Sub-collection)
        *   `answerId` (Document ID)
            *   `participantId`: string
            *   `answer`: string
            *   `pointsEarned`: number (float)

### 2. Firestore Security Rules
Go to **Firestore Database > Rules** and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read quizzes, only teachers can write
    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Game Sessions
    match /game_sessions/{sessionId} {
      allow read: if true;
      allow write: if request.auth != null; // Teachers update game state
      
      // Participants (Students join here)
      match /participants/{participantId} {
        allow read, write: if true; // Public for students to join/update status
      }
      
      // Answers
      match /answers/{answerId} {
        allow create: if true; // Students submit answers
        allow read: if true;
      }
    }
  }
}
```

### 3. Indexes
You will likely need to create composite indexes in the Firebase Console for queries like:
*   `game_sessions` where `gameCode` == X
*   `quizzes` where `teacherId` == Y order by `createdAt`
