# Requirements Document

## Introduction

This feature introduces a 3-agent AI system into the existing quiz/learning platform. The system replaces and extends the current Python-proxied AI routes with a structured backend module (`server/ai/`) powered by OpenAI gpt-4o-mini. Three specialized agents handle distinct roles: a Teacher Assistant Agent for quiz generation, a Student Learning Agent for notes and key concepts, and an Adaptive Quiz Agent for personalized practice based on performance data. All AI calls are gated behind per-user rate limiting and MongoDB-backed caching. A RAG (Retrieval-Augmented Generation) pipeline allows teachers to upload PDFs and generate quizzes from parsed content.

## Glossary

- **AI_System**: The 3-agent backend module located at `server/ai/`
- **Teacher_Agent**: The agent responsible for generating quiz questions, answers, explanations, and difficulty tags for teachers
- **Student_Agent**: The agent responsible for generating structured notes and key concepts for students
- **Adaptive_Agent**: The agent responsible for generating personalized quizzes based on student performance data
- **Prompt_Templates**: The shared module (`server/ai/promptTemplates.ts`) containing all LLM prompt strings
- **Rate_Limiter**: The per-user middleware enforcing a maximum of 5 AI calls per minute
- **AI_Cache**: The MongoDB collection storing cached AI responses keyed by content hash
- **ScoreRecord**: The existing MongoDB model tracking student quiz performance (score, subject, difficulty, timeTakenMs)
- **Weak_Topic**: A subject or topic where a student's average accuracy across recent ScoreRecords is below 70%
- **RAG_Pipeline**: The Retrieval-Augmented Generation pipeline that parses uploaded PDF content and uses it as context for quiz generation
- **OpenAI_Client**: The OpenAI SDK instance configured with `OPENAI_API_KEY` and targeting the `gpt-4o-mini` model

---

## Requirements

### Requirement 1: Teacher Assistant Agent — Quiz Generation

**User Story:** As a teacher, I want to generate quiz questions from a topic, syllabus, or difficulty setting, so that I can quickly build assessments without writing every question manually.

#### Acceptance Criteria

1. WHEN a teacher submits a topic, difficulty, exam type, and desired question count to `POST /api/ai/agent/teacher/quiz`, THE Teacher_Agent SHALL return an array of questions each containing: question text, four answer options, the correct answer, an explanation, and a difficulty tag (`easy`, `medium`, or `hard`).
2. THE Teacher_Agent SHALL support question types: multiple-choice (MCQ), subjective (open-ended), and poll.
3. WHEN the requested question type is `mcq`, THE Teacher_Agent SHALL return exactly four options per question with exactly one marked correct.
4. WHEN the requested question type is `subjective`, THE Teacher_Agent SHALL return a model answer and a marking rubric instead of options.
5. WHEN the requested question type is `poll`, THE Teacher_Agent SHALL return between two and six options with no correct answer marked.
6. THE Teacher_Agent SHALL tag each generated question with one of the difficulty levels: `easy`, `medium`, or `hard`, matching the requested difficulty.
7. IF the OpenAI_Client returns a malformed or unparseable response, THEN THE Teacher_Agent SHALL throw a structured error with message `"AI response parse error"` and log the raw response.

---

### Requirement 2: Student Learning Agent — Notes Generation

**User Story:** As a student, I want to generate structured study notes from a topic or my uploaded notes, so that I can review key concepts efficiently.

#### Acceptance Criteria

1. WHEN a student submits a topic to `POST /api/ai/agent/student/notes`, THE Student_Agent SHALL return structured notes containing: a summary, a list of key concepts, and a list of important questions.
2. WHEN a student submits raw note text (up to 10,000 characters) alongside a topic, THE Student_Agent SHALL incorporate the provided text as context when generating the structured notes.
3. THE Student_Agent SHALL format the output as a JSON object with fields: `summary` (string), `keyConcepts` (array of strings), `importantQuestions` (array of strings).
4. IF the submitted topic is an empty string, THEN THE Student_Agent SHALL return HTTP 400 with message `"topic is required"`.
5. IF the submitted note text exceeds 10,000 characters, THEN THE Student_Agent SHALL return HTTP 400 with message `"note text exceeds maximum length"`.

---

### Requirement 3: Adaptive Quiz Agent — Personalized Quiz Generation

**User Story:** As a student, I want to receive a quiz tailored to my weak topics and performance history, so that I can focus my practice where it matters most.

#### Acceptance Criteria

1. WHEN a student requests a personalized quiz at `POST /api/ai/agent/adaptive/quiz`, THE Adaptive_Agent SHALL query the student's ScoreRecords from MongoDB to identify Weak_Topics.
2. THE Adaptive_Agent SHALL define a Weak_Topic as any subject where the student's average `percentage` across the 10 most recent ScoreRecords for that subject is below 70%.
3. WHEN Weak_Topics are identified, THE Adaptive_Agent SHALL generate questions weighted toward those topics, with at least 60% of questions targeting Weak_Topics.
4. WHEN no ScoreRecords exist for the student, THE Adaptive_Agent SHALL generate a balanced quiz using the topic provided in the request body.
5. THE Adaptive_Agent SHALL accept an optional `difficulty` override; WHEN provided, THE Adaptive_Agent SHALL use it instead of inferring difficulty from performance data.
6. THE Adaptive_Agent SHALL return questions in the same schema as the Teacher_Agent MCQ format: question text, four options, correct answer, explanation, difficulty tag, and topic.

---

### Requirement 4: Rate Limiting

**User Story:** As a platform operator, I want to limit AI calls per user, so that I can control costs and prevent abuse.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a maximum of 5 AI agent requests per user per 60-second sliding window across all three agent endpoints.
2. WHEN a user exceeds the rate limit, THE Rate_Limiter SHALL return HTTP 429 with message `"Rate limit exceeded. Maximum 5 AI requests per minute."`.
3. THE Rate_Limiter SHALL track request counts per authenticated user ID, not per IP address.
4. THE Rate_Limiter SHALL apply to all routes under `/api/ai/agent/`.

---

### Requirement 5: MongoDB Response Caching

**User Story:** As a platform operator, I want identical AI requests to reuse cached results, so that I reduce redundant OpenAI API calls and latency.

#### Acceptance Criteria

1. THE AI_Cache SHALL store responses keyed by a SHA-256 hash of the normalized request parameters (agent type + topic + difficulty + question count + question type).
2. WHEN an incoming request matches an existing AI_Cache entry, THE AI_System SHALL return the cached response without calling the OpenAI_Client.
3. THE AI_Cache SHALL set a time-to-live (TTL) of 24 hours on each cached entry.
4. WHEN a cache entry is older than 24 hours, THE AI_Cache SHALL treat it as a miss and generate a fresh response.
5. THE AI_Cache SHALL NOT cache responses for the Adaptive_Agent, because adaptive responses depend on per-student performance data that changes over time.

---

### Requirement 6: RAG Pipeline — PDF Upload for Teachers

**User Story:** As a teacher, I want to upload a PDF syllabus or document and generate quiz questions from its content, so that my questions are grounded in the actual course material.

#### Acceptance Criteria

1. WHEN a teacher uploads a PDF file to `POST /api/ai/agent/teacher/quiz-from-pdf`, THE RAG_Pipeline SHALL parse the PDF and extract its text content.
2. THE RAG_Pipeline SHALL accept PDF files up to 10 MB in size.
3. IF the uploaded file is not a PDF, THEN THE RAG_Pipeline SHALL return HTTP 400 with message `"Only PDF files are accepted"`.
4. IF the uploaded PDF file exceeds 10 MB, THEN THE RAG_Pipeline SHALL return HTTP 400 with message `"File size exceeds 10 MB limit"`.
5. WHEN text is successfully extracted from the PDF, THE RAG_Pipeline SHALL pass the extracted text as context to the Teacher_Agent to generate quiz questions.
6. THE RAG_Pipeline SHALL use the same question schema and difficulty tagging as the standard Teacher_Agent quiz generation (Requirement 1).
7. IF the PDF contains no extractable text (e.g., scanned image-only PDF), THEN THE RAG_Pipeline SHALL return HTTP 422 with message `"No extractable text found in PDF"`.

---

### Requirement 7: Backend Module Structure

**User Story:** As a backend developer, I want the AI agents organized in a dedicated module, so that the code is maintainable and each agent's logic is isolated.

#### Acceptance Criteria

1. THE AI_System SHALL be implemented as a module at `server/ai/` containing: `teacherAgent.ts`, `studentAgent.ts`, `adaptiveAgent.ts`, and `promptTemplates.ts`.
2. THE AI_System SHALL use a single shared OpenAI_Client instance initialized from the `OPENAI_API_KEY` environment variable.
3. IF `OPENAI_API_KEY` is not set at server startup, THEN THE AI_System SHALL log a warning `"OPENAI_API_KEY is not set — AI agent routes will fail"` and continue starting.
4. THE Prompt_Templates module SHALL export one named prompt-builder function per agent action, accepting typed parameters and returning a string.
5. THE AI_System SHALL expose its three agents through a dedicated Express router mounted at `/api/ai/agent/` in `server/index.ts`.

---

### Requirement 8: Frontend Integration — AI Action Buttons

**User Story:** As a user, I want clearly labeled AI action buttons in the UI, so that I can trigger AI features without navigating away from my current page.

#### Acceptance Criteria

1. THE Teacher_Agent quiz generation button labeled `"Generate Quiz (AI)"` SHALL appear in the QuizEditor page (`src/pages/QuizEditor.tsx`) alongside the existing topic-based generation controls.
2. THE Student_Agent notes button labeled `"Generate Notes"` SHALL appear in the NoteDetail page (`src/pages/NoteDetail.tsx`) as an alternative to the existing `"AI Study Notes"` button, calling the new `/api/ai/agent/student/notes` endpoint.
3. THE Adaptive_Agent quiz button labeled `"Practice Smart Quiz"` SHALL appear in the StudentDashboard or AdaptiveQuiz page, calling the new `/api/ai/agent/adaptive/quiz` endpoint.
4. WHILE an AI request is in progress, THE frontend SHALL display a loading indicator on the triggering button and disable it to prevent duplicate submissions.
5. IF an AI request returns an error, THE frontend SHALL display the error message inline near the triggering button without navigating away.
6. WHEN an AI request returns HTTP 429, THE frontend SHALL display the message `"You've reached the AI limit. Try again in a minute."` to the user.
