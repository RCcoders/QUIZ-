# Implementation Plan: AI Agent System

## Overview

Implement a 3-agent AI system (`server/ai/`) powered by OpenAI `gpt-4o-mini`, with per-user rate limiting, MongoDB response caching, a RAG PDF pipeline, and frontend integration across QuizEditor, NoteDetail, and AdaptiveQuiz pages.

## Tasks

- [x] 1. Install dependencies and scaffold the `server/ai/` module
  - Run `npm install openai multer pdf-parse` and `npm install --save-dev @types/multer @types/pdf-parse` inside `server/`
  - Create empty files: `server/ai/openaiClient.ts`, `server/ai/promptTemplates.ts`, `server/ai/teacherAgent.ts`, `server/ai/studentAgent.ts`, `server/ai/adaptiveAgent.ts`
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement `server/ai/openaiClient.ts` and `server/models/AiCache.ts`
  - [x] 2.1 Implement `openaiClient.ts` — singleton OpenAI instance with startup warning when `OPENAI_API_KEY` is missing
    - Export `openai` as a named singleton using the `openai` npm package
    - Log `"OPENAI_API_KEY is not set — AI agent routes will fail"` if env var is absent
    - _Requirements: 7.2, 7.3_

  - [x] 2.2 Write unit test for missing `OPENAI_API_KEY` warning
    - Temporarily unset env var, import module, assert `console.warn` was called with the exact message
    - _Requirements: 7.3_

  - [x] 2.3 Implement `server/models/AiCache.ts` — Mongoose model with TTL index
    - Fields: `cacheKey` (String, unique), `agentType` (String), `response` (Mixed), `createdAt` (Date)
    - TTL index: `{ createdAt: 1 }, { expireAfterSeconds: 86400 }`
    - Unique index on `cacheKey`
    - _Requirements: 5.1, 5.3_

- [x] 3. Implement `server/ai/promptTemplates.ts`
  - Export `buildTeacherQuizPrompt(params)`, `buildStudentNotesPrompt(params)`, `buildAdaptiveQuizPrompt(params)`
  - Each function accepts typed parameters and returns a string instructing the model to return raw JSON only (no markdown fences)
  - `buildTeacherQuizPrompt` accepts `{ topic, difficulty, count, questionType, context? }`
  - `buildStudentNotesPrompt` accepts `{ topic, noteText? }`
  - `buildAdaptiveQuizPrompt` accepts `{ weakTopics, difficulty?, count, fallbackTopic? }`
  - _Requirements: 7.4_

- [x] 4. Implement `server/ai/teacherAgent.ts`
  - [x] 4.1 Define and export TypeScript interfaces: `MCQQuestion`, `SubjectiveQuestion`, `PollQuestion`, `TeacherQuestion`
    - `MCQQuestion`: `questionText`, `options: [string,string,string,string]`, `correctAnswer: 'A'|'B'|'C'|'D'`, `explanation`, `difficulty`, `topic`
    - `SubjectiveQuestion`: `questionText`, `modelAnswer`, `rubric`, `difficulty`, `topic` (no `options` or `correctAnswer`)
    - `PollQuestion`: `questionText`, `options: string[]` (2–6), `topic` (no `correctAnswer`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Implement `generateTeacherQuiz(params)` — calls OpenAI via `promptTemplates`, parses JSON response
    - Use `buildTeacherQuizPrompt`, call `openai.chat.completions.create` with `gpt-4o-mini`
    - Parse the JSON response; on failure throw `{ message: 'AI response parse error', raw: string }` and log raw output
    - Return typed `TeacherQuestion[]`
    - _Requirements: 1.1, 1.2, 1.6, 1.7_

  - [x] 4.3 Write property test for MCQ schema invariant (Property 1)
    - // Feature: ai-agent-system, Property 1: MCQ questions have required fields and exactly one correct answer
    - Generator: `fc.record({ topic: fc.string({minLength:1}), difficulty: fc.constantFrom('easy','medium','hard'), count: fc.integer({min:1,max:10}) })`
    - Mock OpenAI to return valid MCQ JSON; assert every question has `questionText`, `options.length === 4`, `correctAnswer` in `['A','B','C','D']`, `explanation`, and `difficulty` matching input
    - **Validates: Requirements 1.1, 1.3, 1.6**

  - [x] 4.4 Write property test for subjective schema invariant (Property 2)
    - // Feature: ai-agent-system, Property 2: Subjective questions have model answer and rubric
    - Same generator as P1 with `questionType: 'subjective'`; assert each question has `questionText`, `modelAnswer`, `rubric` and does NOT have `options` or `correctAnswer`
    - **Validates: Requirements 1.4**

  - [x] 4.5 Write property test for poll option count (Property 3)
    - // Feature: ai-agent-system, Property 3: Poll questions have 2–6 options and no correct answer
    - Same generator with `questionType: 'poll'`; assert `options.length >= 2 && options.length <= 6` and no `correctAnswer` field
    - **Validates: Requirements 1.5**

- [x] 5. Implement `server/ai/studentAgent.ts`
  - [x] 5.1 Define and export `StudentNotes` interface: `{ summary: string; keyConcepts: string[]; importantQuestions: string[] }`
    - _Requirements: 2.3_

  - [x] 5.2 Implement `generateStudentNotes(params)` — calls OpenAI, parses and returns `StudentNotes`
    - Use `buildStudentNotesPrompt`; validate `topic` is non-empty (throw 400-compatible error); validate `noteText` ≤ 10,000 chars
    - Parse JSON response; on failure throw `{ message: 'AI response parse error', raw: string }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.3 Write property test for student notes schema invariant (Property 4)
    - // Feature: ai-agent-system, Property 4: Student notes output schema invariant
    - Generator: `fc.record({ topic: fc.string({minLength:1}), noteText: fc.option(fc.string({maxLength:10000})) })`
    - Mock OpenAI; assert response has `summary` (string), `keyConcepts` (non-empty string[]), `importantQuestions` (non-empty string[])
    - **Validates: Requirements 2.1, 2.3**

- [x] 6. Implement `server/ai/adaptiveAgent.ts`
  - [x] 6.1 Implement `getWeakTopics(userId)` — queries `ScoreRecord`, groups by subject, returns subjects with avg `percentage` < 70 across 10 most recent records
    - Query: `ScoreRecord.find({ userId }).sort({ completedAt: -1 })`; group by `subject`; take up to 10 per subject; compute average `percentage`
    - Return `WeakTopicResult[]` where `avgPercentage < 70`
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Write property test for weak topic threshold (Property 5)
    - // Feature: ai-agent-system, Property 5: Weak topic threshold
    - Generator: `fc.array(fc.record({ subject: fc.string({minLength:1}), percentage: fc.float({min:0,max:100}), completedAt: fc.date() }), {minLength:1})`
    - Seed mock ScoreRecord data; assert `getWeakTopics` returns exactly subjects with avg < 70 and excludes subjects with avg ≥ 70
    - **Validates: Requirements 3.2**

  - [x] 6.3 Implement `generateAdaptiveQuiz(params)` — uses `getWeakTopics`, builds prompt, calls OpenAI, returns `MCQQuestion[]`
    - When weak topics exist: weight ≥ 60% of questions toward those topics via `buildAdaptiveQuizPrompt`
    - When no ScoreRecords: use `params.topic` as fallback via `buildAdaptiveQuizPrompt`
    - When `params.difficulty` is provided: pass it to prompt and enforce on all returned questions
    - Return questions in `MCQQuestion` schema (same as teacher MCQ)
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [x] 6.4 Write property test for adaptive weak topic weighting (Property 6)
    - // Feature: ai-agent-system, Property 6: Adaptive quiz weak topic weighting
    - Generator: `fc.array(weakTopicArb, {minLength:1})` + `fc.integer({min:5,max:20})`
    - Mock OpenAI to return questions with `topic` field; assert ≥ 60% of questions have `topic` matching a weak topic
    - **Validates: Requirements 3.3**

  - [x] 6.5 Write property test for difficulty override (Property 7)
    - // Feature: ai-agent-system, Property 7: Difficulty override is respected
    - Generator: `fc.constantFrom('easy','medium','hard')`
    - Mock OpenAI; assert every returned question has `difficulty === requestedDifficulty`
    - **Validates: Requirements 3.5**

- [x] 7. Checkpoint — Ensure all agent unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `server/middleware/aiRateLimiter.ts`
  - In-memory sliding window using `Map<string, number[]>` keyed by `req.user._id`
  - Window: 60,000 ms; limit: 5 requests
  - On exceed: `res.status(429).json({ message: 'Rate limit exceeded. Maximum 5 AI requests per minute.' })`
  - Export as `aiRateLimiter: RequestHandler`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.1 Write unit tests for rate limiter
    - Test: exactly 5 requests pass, 6th returns 429
    - Test: two different user IDs are tracked independently (one hitting limit does not affect the other)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Write property test for per-user rate limiter isolation (Property 10)
    - // Feature: ai-agent-system, Property 10: Rate limiter enforces 5 requests per user per minute
    - Generator: `fc.array(fc.string({minLength:1}), {minLength:2, maxLength:5})` (distinct user IDs)
    - Assert: after 5 requests per user, 6th returns 429; concurrent users do not interfere
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 9. Implement cache key helper and integrate caching into agent routes
  - [x] 9.1 Implement `buildCacheKey(params)` in a shared utility (e.g., `server/ai/cacheKey.ts`)
    - Use `crypto.createHash('sha256')` on `JSON.stringify(params, Object.keys(params).sort())`
    - _Requirements: 5.1_

  - [x] 9.2 Write unit test for `buildCacheKey` determinism
    - Assert same inputs always produce the same hash; assert different inputs produce different hashes
    - _Requirements: 5.1_

  - [x] 9.3 Write property test for cache hit returning identical response (Property 8)
    - // Feature: ai-agent-system, Property 8: Cache hit returns identical response without calling OpenAI
    - Generator: `fc.record({ topic: fc.string({minLength:1}), difficulty: fc.constantFrom('easy','medium','hard'), count: fc.integer({min:1,max:10}), questionType: fc.constantFrom('mcq','subjective','poll') })`
    - Mock OpenAI call counter; make two identical requests; assert responses are equal and OpenAI was called exactly once
    - **Validates: Requirements 5.1, 5.2**

  - [x] 9.4 Write property test for adaptive agent never cached (Property 9)
    - // Feature: ai-agent-system, Property 9: Adaptive agent responses are never cached
    - Generator: `fc.record({ userId: fc.string({minLength:1}), topic: fc.string({minLength:1}) })`
    - After adaptive quiz request completes, query `AiCache` for `agentType: 'adaptive'`; assert no entry exists
    - **Validates: Requirements 5.5**

- [x] 10. Implement `server/routes/agentRoutes.ts` and mount in `server/index.ts`
  - [x] 10.1 Create `server/routes/agentRoutes.ts` with all four endpoints
    - `POST /teacher/quiz` — `protect`, `aiRateLimiter`, `authorize('teacher')` → cache check → `generateTeacherQuiz` → cache write → respond
    - `POST /teacher/quiz-from-pdf` — `protect`, `aiRateLimiter`, `authorize('teacher')` → multer upload → pdf-parse → `generateTeacherQuiz` with context → respond
    - `POST /student/notes` — `protect`, `aiRateLimiter`, `authorize('student')` → validate topic/noteText → cache check → `generateStudentNotes` → cache write → respond
    - `POST /adaptive/quiz` — `protect`, `aiRateLimiter`, `authorize('student')` → `generateAdaptiveQuiz` (no cache) → respond
    - Multer config: `memoryStorage()`, `limits: { fileSize: 10 * 1024 * 1024 }`, `fileFilter` for `application/pdf`
    - All error scenarios from the error table must return the correct HTTP status and message
    - _Requirements: 1.1, 2.1, 3.1, 4.4, 5.2, 5.5, 6.1–6.7, 7.5_

  - [x] 10.2 Mount `agentRoutes` in `server/index.ts` at `/api/ai/agent/`
    - Add `import agentRoutes from './routes/agentRoutes.js'` and `app.use('/api/ai/agent', agentRoutes)`
    - _Requirements: 7.5_

  - [x] 10.3 Write unit tests for route error handling
    - Test: empty topic → 400 `"topic is required"`
    - Test: noteText > 10,000 chars → 400 `"note text exceeds maximum length"`
    - Test: non-PDF upload → 400 `"Only PDF files are accepted"`
    - Test: PDF > 10 MB → 400 `"File size exceeds 10 MB limit"`
    - Test: image-only PDF (empty extracted text) → 422 `"No extractable text found in PDF"`
    - _Requirements: 2.4, 2.5, 6.3, 6.4, 6.7_

  - [x] 10.4 Write property test for RAG MCQ schema (Property 11)
    - // Feature: ai-agent-system, Property 11: RAG pipeline extracts text and produces valid MCQ schema
    - Use a minimal valid PDF buffer; assert returned questions conform to MCQ schema (same as Property 1)
    - **Validates: Requirements 6.1, 6.5, 6.6**

- [x] 11. Checkpoint — Ensure all route and middleware tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend: update `src/pages/QuizEditor.tsx`
  - Add a `"Generate Quiz (AI)"` button in the AI generator panel that calls `POST /api/ai/agent/teacher/quiz`
  - While the request is in-flight: set `disabled={true}` on the button and show a loading spinner
  - On success: merge returned questions into the existing `questions` state (same mapping as the existing topic-based generator)
  - On error: display the error message inline near the button; on HTTP 429 display `"You've reached the AI limit. Try again in a minute."`
  - _Requirements: 8.1, 8.4, 8.5, 8.6_

  - [x] 12.1 Write property test for button disabled during in-flight request (Property 12)
    - // Feature: ai-agent-system, Property 12: Frontend button disables during in-flight AI request
    - Use React Testing Library + `fc`; mock `apiFetch` to never resolve; assert button has `disabled` attribute and renders loading indicator
    - **Validates: Requirements 8.4**

  - [x] 12.2 Write property test for inline error on AI failure (Property 13)
    - // Feature: ai-agent-system, Property 13: Frontend displays inline error on AI failure
    - Mock `apiFetch` to reject; assert error message appears inline without navigation
    - **Validates: Requirements 8.5**

- [x] 13. Frontend: update `src/pages/NoteDetail.tsx`
  - Add a `"Generate Notes"` button (alongside the existing `"AI Study Notes"` button) that calls `POST /api/ai/agent/student/notes`
  - Pass `topic` and the note's `content` (as `noteText`) in the request body
  - Render the structured response (`summary`, `keyConcepts`, `importantQuestions`) in the existing AI notes panel
  - Apply the same loading/disabled/error/429 handling as QuizEditor (Requirements 8.4, 8.5, 8.6)
  - _Requirements: 8.2, 8.4, 8.5, 8.6_

- [x] 14. Frontend: update `src/pages/AdaptiveQuiz.tsx`
  - Add a `"Practice Smart Quiz"` button (or replace the existing generate call) that calls `POST /api/ai/agent/adaptive/quiz`
  - Map the returned `MCQQuestion[]` (fields: `questionText`, `options[0–3]`, `correctAnswer`, `explanation`, `difficulty`, `topic`) to the existing `GeneratedQuestion` shape used by the quiz UI
  - Apply the same loading/disabled/error/429 handling (Requirements 8.4, 8.5, 8.6)
  - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (install in the root `package.json` dev dependencies if not already present)
- The adaptive agent never writes to `AiCache` — skip cache read/write in its route handler
- Existing routes (`/api/ai/quiz`, `/api/ai/notes`, `/api/adaptive/*`) are left intact; new routes are additive
- All agent functions wrap OpenAI calls in try/catch; no stack traces leak to the client
