# Tasks: Full-Stack Refactor & Optimization

## Phase 1: Foundation — Shared Utilities & Security

- [x] 1.1 Create response envelope utility (`server/utils/response.ts`) with `ok()` and `fail()` helpers
- [x] 1.2 Create Zod validation middleware (`server/middleware/validateBody.ts`) returning 422 on failure
- [x] 1.3 Create input sanitizer (`server/utils/sanitize.ts`) that strips prompt injection patterns and truncates at 20,000 chars
- [ ] 1.4 Update `server/ai/cacheKey.ts` to normalize string values (trim + lowercase) before hashing
- [ ] 1.5 Create centralized AI JSON parser (`server/ai/parseAiResponse.ts`) that strips markdown fences, throws structured error on parse failure, and validates against a Zod schema
- [ ] 1.6 Harden `server/middleware/authMiddleware.ts`: remove JWT_SECRET fallback; throw fatal error if absent at startup
- [ ] 1.7 Harden `server/index.ts` CORS config: read allowed origins from `CORS_ALLOWED_ORIGINS` env var; reject wildcard in production

## Phase 2: Database Optimization

- [ ] 2.1 Add compound index `{ userId: 1, topic: 1 }` to `ScoreRecord` schema
- [ ] 2.2 Add `aiVersion: number` field (default: 1) to `AiCache` schema; ensure `{ cacheKey: 1 }` unique index exists
- [ ] 2.3 Create `RateLimit` MongoDB model (`server/models/RateLimit.ts`) with `userId` unique index and 60s TTL on `updatedAt`
- [ ] 2.4 Audit `Quiz`, `ScoreRecord`, and `Note` schemas — add missing required field constraints and explicit types where absent

## Phase 3: Unified AI Controller

- [ ] 3.1 Create AI request queue (`server/ai/requestQueue.ts`) using `p-limit` with configurable concurrency (default: 10)
- [ ] 3.2 Create unified AI controller (`server/controllers/aiController.ts`) with `POST /api/ai/run` handler:
  - Zod validation of `{ mode, data }`
  - Cache lookup (AiCache, filter by `aiVersion`)
  - Queue dispatch to correct agent
  - Cache store on miss
  - Response envelope wrapping
  - 503 on AI provider failure
- [ ] 3.3 Register `POST /api/ai/run` in `server/index.ts` with `protect` + persistent rate limiter + `validateBody(aiRunSchema)`
- [ ] 3.4 Update `teacherAgent.ts`, `studentAgent.ts`, `adaptiveAgent.ts` to use the shared `parseAiResponse` parser
- [ ] 3.5 Update `ADAPTIVE_AGENT` dispatch to return `{ questions: [...] }` shape in the envelope data field

## Phase 4: Persistent Rate Limiter

- [ ] 4.1 Rewrite `server/middleware/aiRateLimiter.ts` to use the `RateLimit` MongoDB collection (sliding window, 5 req/min per user)
- [ ] 4.2 Add Redis support: when `REDIS_URL` env var is set, use Redis for rate limit storage instead of MongoDB

## Phase 5: API Response Standardization

- [ ] 5.1 Update `server/controllers/teacherDashboardController.ts` to use `ok()`/`fail()` envelope
- [ ] 5.2 Update `server/controllers/userController.ts` to use `ok()`/`fail()` envelope
- [ ] 5.3 Update `server/routes/authRoutes.ts` to use `ok()`/`fail()` envelope
- [ ] 5.4 Update `server/routes/quizRoutes.ts` to use `ok()`/`fail()` envelope and add pagination (`?page&limit`) to list endpoint
- [ ] 5.5 Update `server/routes/scoreRoutes.ts` to use `ok()`/`fail()` envelope and add pagination to list endpoint
- [ ] 5.6 Update `server/routes/noteRoutes.ts` to use `ok()`/`fail()` envelope and add pagination to list endpoint
- [ ] 5.7 Update `server/routes/reportRoutes.ts` to use `ok()`/`fail()` envelope
- [ ] 5.8 Update `server/routes/badgeRoutes.ts`, `sessionRoutes.ts`, `userRoutes.ts` to use `ok()`/`fail()` envelope
- [ ] 5.9 Add global JSON parse error handler in `server/index.ts` (catches malformed body, returns 400 envelope)

## Phase 6: Frontend Migration to POST /api/ai/run

- [ ] 6.1 Update `src/pages/QuizEditor.tsx` `generateQuizWithNewAI()` to call `POST /api/ai/run` with `mode: "TEACHER_AGENT"` instead of `/api/ai/agent/teacher/quiz`
- [ ] 6.2 Update `src/pages/QuizEditor.tsx` `generateQuestions()` topic-mode path to call `POST /api/ai/run` with `mode: "TEACHER_AGENT"` instead of `/api/ai/quiz`
- [ ] 6.3 Update `src/pages/AdaptiveQuiz.tsx` `generateQuiz()` to call `POST /api/ai/run` with `mode: "ADAPTIVE_AGENT"` instead of `/api/ai/agent/adaptive/quiz`
- [ ] 6.4 Update any student notes generation calls to use `POST /api/ai/run` with `mode: "STUDENT_AGENT"`
- [ ] 6.5 Update frontend API response handling to unwrap the `{ success, data, error }` envelope in `src/utils/api.ts` or `src/api/index.ts`

## Phase 7: Frontend Performance

- [ ] 7.1 Lazy-load `PerformanceTrendsChart` in `src/pages/StudentReports.tsx` (or wherever it is imported) using `React.lazy` + `Suspense`
- [ ] 7.2 Lazy-load `recharts` components in any other direct import sites
- [ ] 7.3 Lazy-load `xlsx` library wherever it is used for spreadsheet export
- [ ] 7.4 Add `disabled` state to all AI-trigger buttons in `QuizEditor.tsx` during `isGenerating`/`isGeneratingNewAI`
- [ ] 7.5 Add `disabled` state to submit buttons in `AdaptiveQuiz.tsx` during loading states
- [ ] 7.6 Remove unused imports flagged by TypeScript/ESLint across frontend pages and components

## Phase 8: Codebase Cleanup

- [ ] 8.1 Delete `server/services/pythonAiService.ts` and `server/services/adaptiveService.ts`
- [ ] 8.2 Delete `server/routes/aiRoutes.ts` and `server/routes/adaptiveRoutes.ts` (after frontend migration in Phase 6)
- [ ] 8.3 Remove `server/routes/agentRoutes.ts` legacy sub-routes (after Phase 3 controller is live); delete file
- [ ] 8.4 Remove `<link rel="preconnect" href="https://firebaseapp.com" />` from `index.html`
- [ ] 8.5 Delete `question_generator.py` and `requirements.txt` from project root
- [ ] 8.6 Remove `@google/generative-ai` from `server/package.json` dependencies (after adaptiveService removal)
- [ ] 8.7 Remove `server/routes/agentRoutes.ts` import and `app.use('/api/ai/agent', agentRoutes)` from `server/index.ts`
- [ ] 8.8 Remove `app.use('/api/ai', aiRoutes)` and `app.use('/api/adaptive', adaptiveRoutes)` from `server/index.ts`

## Phase 9: Error Handling & Logging

- [ ] 9.1 Audit all async route handlers — ensure every one has a try/catch that calls `fail()` and logs with route + userId context
- [ ] 9.2 Add `NODE_ENV=production` log level guard: disable `console.log`/`console.info` in production; keep `console.warn`/`console.error`
- [ ] 9.3 Ensure no route handler returns a response with a `stack` field

## Phase 10: Build & Deployment Readiness

- [ ] 10.1 Update `.env.example` with all required variables: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CORS_ALLOWED_ORIGINS`, `REDIS_URL` (optional), `OLLAMA_BASE_URL` (optional), `AI_QUEUE_CONCURRENCY` (optional)
- [ ] 10.2 Verify `dist/`, `server/dist/`, `node_modules/`, `server/node_modules/` are in `.gitignore`
- [ ] 10.3 Run `tsc --noEmit` on frontend and `tsc --noEmit -p server/tsconfig.json` on backend — fix all type errors

## Phase 11: Property-Based Tests

- [ ] 11.1 Write property tests for `parseAiResponse.ts` — Properties 15, 16, 17, 18 (fence stripping, structured error, round-trip, schema rejection)
  - `// Feature: full-stack-refactor-optimization, Property 15: JSON parser strips markdown fences`
  - `// Feature: full-stack-refactor-optimization, Property 16: Unparseable AI responses throw structured error`
  - `// Feature: full-stack-refactor-optimization, Property 17: Parse → print → parse round-trip is identity`
  - `// Feature: full-stack-refactor-optimization, Property 18: Non-conforming AI responses are rejected`
- [ ] 11.2 Write property tests for `cacheKey.ts` — Properties 6, 7 (normalization idempotence, aiVersion=1)
  - `// Feature: full-stack-refactor-optimization, Property 6: Cache key normalization is idempotent`
  - `// Feature: full-stack-refactor-optimization, Property 7: New AI cache entries have aiVersion = 1`
- [ ] 11.3 Write property tests for `validateBody.ts` — Properties 4, 5 (invalid body → 422, sanitization)
  - `// Feature: full-stack-refactor-optimization, Property 4: Invalid request bodies return 422`
  - `// Feature: full-stack-refactor-optimization, Property 5: Prompt injection patterns are stripped`
- [ ] 11.4 Write property tests for AI controller — Properties 1, 2, 8, 10, 11, 12, 13, 14
  - `// Feature: full-stack-refactor-optimization, Property 1: Invalid mode returns 400`
  - `// Feature: full-stack-refactor-optimization, Property 2: All AI responses are wrapped in envelope`
  - `// Feature: full-stack-refactor-optimization, Property 8: Cache-first — cached requests do not call AI provider`
  - `// Feature: full-stack-refactor-optimization, Property 10: Concurrent AI calls bounded by queue`
  - `// Feature: full-stack-refactor-optimization, Property 11: AI provider failures return 503`
  - `// Feature: full-stack-refactor-optimization, Property 12: Malformed JSON request bodies return 400`
  - `// Feature: full-stack-refactor-optimization, Property 13: Error responses do not expose stack traces`
  - `// Feature: full-stack-refactor-optimization, Property 14: AI inputs are truncated at character budget`
- [ ] 11.5 Write property tests for CORS middleware — Property 3 (unlisted origins rejected)
  - `// Feature: full-stack-refactor-optimization, Property 3: Requests from unlisted origins are rejected`
- [ ] 11.6 Write property tests for pagination — Property 9 (correct subset returned)
  - `// Feature: full-stack-refactor-optimization, Property 9: Pagination returns the correct subset`
