# Design Document: Full-Stack Refactor & Optimization

## Overview

This document describes the technical design for consolidating, hardening, and optimizing the classroom-quiz-master MERN + AI application. The system currently has three parallel AI subsystems, in-memory rate limiting, wide-open CORS, a fallback JWT secret, and inconsistent API response shapes. The refactor targets production readiness for 1000+ concurrent users without breaking existing features.

The core changes are:
1. A single unified AI controller (`POST /api/ai/run`) replacing three separate AI subsystems
2. A standard `{ success, data, error }` response envelope across all endpoints
3. Security hardening: strict CORS, no JWT fallback, Zod validation, input sanitization
4. Database optimization: compound indexes, normalized cache keys, `aiVersion` tracking
5. Frontend performance: lazy-loaded heavy libraries, duplicate submission prevention
6. A persistent rate limiter and bounded AI request queue for scalability
7. Codebase cleanup: removal of Python services, Firebase remnants, legacy routes

---

## Architecture

### Current State

```
Frontend (React/Vite)
  ├── /api/ai/quiz          → aiRoutes.ts → pythonAiService.ts → Python FastAPI
  ├── /api/ai/notes         → aiRoutes.ts → pythonAiService.ts → Python FastAPI
  ├── /api/ai/adaptive      → adaptiveRoutes.ts → adaptiveService.ts → Gemini
  ├── /api/ai/agent/teacher/quiz   → agentRoutes.ts → teacherAgent.ts → OpenAI
  ├── /api/ai/agent/student/notes  → agentRoutes.ts → studentAgent.ts → OpenAI
  └── /api/ai/agent/adaptive/quiz  → agentRoutes.ts → adaptiveAgent.ts → OpenAI
```

### Target State

```
Frontend (React/Vite)
  └── POST /api/ai/run  { mode, data }
        │
        ▼
  AI_Controller (server/controllers/aiController.ts)
        ├── Zod schema validation
        ├── JWT auth (protect middleware)
        ├── Persistent rate limiter
        ├── Cache lookup (AiCache / Redis)
        ├── Request queue (max 10 concurrent)
        │
        ├── mode=TEACHER_AGENT  → teacherAgent.ts → OpenAI / Ollama
        ├── mode=STUDENT_AGENT  → studentAgent.ts → OpenAI / Ollama
        └── mode=ADAPTIVE_AGENT → adaptiveAgent.ts → OpenAI / Ollama

All other routes (auth, quiz, scores, etc.)
  └── Wrapped in Response_Envelope { success, data, error }
```

### Mermaid Diagram

```mermaid
flowchart TD
    FE[Frontend React/Vite] -->|POST /api/ai/run| MW[Middleware Stack]
    MW --> AUTH[protect: JWT auth]
    AUTH --> RL[Rate Limiter\nMongoDB/Redis persistent]
    RL --> ZOD[Zod Schema Validator]
    ZOD --> CTRL[AI Controller]
    CTRL -->|cache hit| CACHE[(AiCache / Redis)]
    CTRL -->|cache miss| QUEUE[Request Queue\nmax 10 concurrent]
    QUEUE --> TA[TEACHER_AGENT]
    QUEUE --> SA[STUDENT_AGENT]
    QUEUE --> AA[ADAPTIVE_AGENT]
    TA & SA & AA --> OAI[OpenAI / Ollama]
    OAI --> PARSE[JSON Parser\nstrip fences + validate]
    PARSE --> STORE[Store in AiCache]
    STORE --> ENV[Response Envelope\n{ success, data, error }]
    ENV --> FE
```

---

## Components and Interfaces

### 1. AI Controller (`server/controllers/aiController.ts`)

Single entry point for all AI requests.

```typescript
// POST /api/ai/run
interface AiRunRequest {
  mode: 'TEACHER_AGENT' | 'STUDENT_AGENT' | 'ADAPTIVE_AGENT';
  data: TeacherQuizParams | StudentNotesParams | AdaptiveQuizParams;
}

interface AiRunResponse {
  success: boolean;
  data: TeacherQuestion[] | StudentNotes | { questions: MCQQuestion[] } | null;
  error: string | null;
}
```

Dispatch logic:
- `TEACHER_AGENT` → `generateTeacherQuiz(data)`
- `STUDENT_AGENT` → `generateStudentNotes(data)`
- `ADAPTIVE_AGENT` → `generateAdaptiveQuiz(userId, data)`, returns `{ questions: [...] }`

### 2. Response Envelope Utility (`server/utils/response.ts`)

```typescript
export function ok<T>(data: T): { success: true; data: T; error: null }
export function fail(error: string): { success: false; data: null; error: string }
```

All route handlers use these helpers. No bare `res.json({ message })` patterns remain.

### 3. Zod Validation Middleware (`server/middleware/validateBody.ts`)

```typescript
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler
// Returns 422 with fail() envelope on validation error
```

Schemas defined alongside each route file:
- `aiRunSchema`: validates `mode` and `data` shape per mode
- `authSchemas`: login/register body shapes
- `quizSchema`: quiz create/update body

### 4. Persistent Rate Limiter (`server/middleware/aiRateLimiter.ts`)

Replaces the current in-memory `Map`. Uses MongoDB `RateLimit` collection (or Redis when available) to store per-user timestamps. Survives process restarts and works across multiple server instances.

```typescript
// MongoDB-backed rate limit document
interface RateLimitDoc {
  userId: string;       // indexed
  timestamps: number[]; // sliding window
  updatedAt: Date;      // TTL index: 60s
}
```

### 5. AI Request Queue (`server/ai/requestQueue.ts`)

Bounded async queue using `p-limit` or a simple semaphore pattern.

```typescript
export const aiQueue = createQueue({ concurrency: Number(process.env.AI_QUEUE_CONCURRENCY) || 10 });
// Usage: const result = await aiQueue(() => openai.chat.completions.create(...))
```

### 6. AI JSON Parser (`server/ai/parseAiResponse.ts`)

Centralized parser used by all three agents.

```typescript
export function parseAiJson<T>(raw: string, schema: ZodSchema<T>): T
// 1. Strip markdown fences (```json ... ```)
// 2. JSON.parse — throws { message: 'AI response parse error', raw } on SyntaxError
// 3. Zod schema validation — throws on non-conforming shape
```

### 7. Cache Key Builder (`server/ai/cacheKey.ts`) — updated

Current implementation does not normalize strings. Updated to trim + lowercase all string values before hashing.

```typescript
export function buildCacheKey(params: Record<string, unknown>): string
// Normalizes: trim + lowercase all string values, sort keys, SHA-256 hash
```

### 8. Input Sanitizer (`server/utils/sanitize.ts`)

```typescript
export function sanitizePromptInput(input: string): string
// Strips/escapes prompt injection patterns:
// "Ignore previous instructions", "Forget your instructions", etc.
// Truncates to MAX_INPUT_CHARS (default: 20000)
```

### 9. Frontend Lazy Loading

`PerformanceTrendsChart` and any `xlsx` usage wrapped in `React.lazy` + `Suspense`:

```typescript
// Before: import { PerformanceTrendsChart } from '../components/reports/PerformanceTrendsChart'
// After:
const PerformanceTrendsChart = React.lazy(() =>
  import('../components/reports/PerformanceTrendsChart').then(m => ({ default: m.PerformanceTrendsChart }))
);
```

---

## Data Models

### AiCache (updated)

```typescript
interface IAiCache {
  cacheKey: string;      // unique index
  agentType: string;
  response: unknown;
  aiVersion: number;     // NEW: initialized to 1
  createdAt: Date;       // TTL index: 86400s
}
// Indexes: { cacheKey: 1 } unique, { createdAt: 1 } TTL
```

Cache lookup must filter by `aiVersion >= CURRENT_AI_VERSION` to invalidate stale entries when the version is bumped.

### ScoreRecord (updated indexes)

```typescript
// Add compound index:
ScoreRecordSchema.index({ userId: 1, topic: 1 });
// Existing single-field indexes retained
```

### RateLimit (new collection)

```typescript
interface IRateLimit {
  userId: string;       // unique index
  timestamps: number[];
  updatedAt: Date;      // TTL index: 60s
}
```

### Pagination Shape (all list endpoints)

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error: null;
}
```

Query params: `?page=1&limit=20` (limit capped at 100).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid mode returns 400

*For any* string value passed as `mode` that is not one of `"TEACHER_AGENT"`, `"STUDENT_AGENT"`, or `"ADAPTIVE_AGENT"` (including absent/null), the AI controller SHALL return HTTP 400 with `{ success: false, data: null, error: "Invalid or missing mode" }`.

**Validates: Requirements 1.3**

---

### Property 2: All AI responses are wrapped in the Response Envelope

*For any* valid request to `POST /api/ai/run` with any of the three agent modes, the response body SHALL always have the shape `{ success: boolean, data: T | null, error: string | null }` — never a bare object, bare array, or `{ message }` shape.

**Validates: Requirements 1.6, 2.1, 2.2, 2.3, 2.4**

---

### Property 3: Requests from unlisted origins are rejected

*For any* HTTP request whose `Origin` header is not present in the `CORS_ALLOWED_ORIGINS` environment variable list, the server SHALL reject the request with a CORS error (no `Access-Control-Allow-Origin` header in response).

**Validates: Requirements 3.1, 3.2**

---

### Property 4: Invalid request bodies return 422

*For any* request body that does not conform to the Zod schema defined for that route, the Schema_Validator SHALL return HTTP 422 with `{ success: false, data: null, error: "<validation details>" }`.

**Validates: Requirements 3.4, 3.5**

---

### Property 5: Prompt injection patterns are stripped from AI inputs

*For any* string input containing known prompt injection sequences (e.g., `"Ignore previous instructions"`, `"Forget your instructions"`), the sanitized output passed to the AI prompt SHALL not contain those sequences.

**Validates: Requirements 3.6**

---

### Property 6: Cache key normalization is idempotent

*For any* set of string parameters, the cache key produced from the original strings SHALL equal the cache key produced from their trimmed and lowercased equivalents. That is: `buildCacheKey(params) === buildCacheKey(normalize(params))`.

**Validates: Requirements 4.3**

---

### Property 7: New AI cache entries have aiVersion = 1

*For any* AI cache entry created by the system, the `aiVersion` field SHALL be present and equal to `1` upon creation.

**Validates: Requirements 4.5**

---

### Property 8: Cache-first — cached requests do not call the AI provider

*For any* AI request whose cache key already exists in AiCache (with a matching or higher `aiVersion`), the AI controller SHALL return the cached response without invoking the OpenAI/Ollama client.

**Validates: Requirements 5.1, 11.1**

---

### Property 9: Pagination returns the correct subset

*For any* list endpoint called with `page=P` and `limit=L`, the response SHALL contain at most `L` items, and the items SHALL correspond to the correct offset `(P-1)*L` in the full result set.

**Validates: Requirements 5.2, 5.3**

---

### Property 10: Concurrent AI calls are bounded by the queue

*For any* burst of N simultaneous AI requests where N > 10, the number of concurrent outbound calls to the AI provider at any instant SHALL not exceed 10 (the configured `AI_QUEUE_CONCURRENCY`).

**Validates: Requirements 7.2, 7.3, 11.4**

---

### Property 11: AI provider failures return 503 with error envelope

*For any* AI request where the underlying provider call throws a network error, timeout, or provider error, the controller SHALL return HTTP 503 with `{ success: false, data: null, error: "AI service temporarily unavailable" }`.

**Validates: Requirements 9.2**

---

### Property 12: Malformed JSON request bodies return 400

*For any* request with a body that is not valid JSON (e.g., truncated, wrong content-type), the server SHALL return HTTP 400 with a descriptive error message rather than an unhandled exception.

**Validates: Requirements 9.3**

---

### Property 13: Error responses do not expose stack traces

*For any* error condition (validation error, AI failure, database error), the JSON response body returned to the API consumer SHALL not contain a `stack` field or raw stack trace string.

**Validates: Requirements 9.4**

---

### Property 14: AI inputs are truncated at the character budget

*For any* input string of length greater than `MAX_INPUT_CHARS` (default: 20,000), the string passed to the AI provider SHALL have length at most `MAX_INPUT_CHARS`.

**Validates: Requirements 11.2**

---

### Property 15: JSON parser strips markdown fences before parsing

*For any* AI response string that is wrapped in markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `), the parser SHALL produce the same parsed result as if the fences were not present.

**Validates: Requirements 12.1**

---

### Property 16: Unparseable AI responses throw a structured error

*For any* string that is not valid JSON (after fence stripping), `parseAiJson` SHALL throw an object with shape `{ message: "AI response parse error", raw: string }` rather than a bare `SyntaxError`.

**Validates: Requirements 12.2**

---

### Property 17: Parse → print → parse round-trip is identity

*For any* valid array of `MCQQuestion` objects, serializing the array to JSON and then parsing it again SHALL produce an array that is deeply equal to the original. That is: `parseAiJson(JSON.stringify(questions)) deepEquals questions`.

**Validates: Requirements 12.3, 12.4**

---

### Property 18: Non-conforming AI responses are rejected by schema validation

*For any* parsed AI response that does not match the `MCQQuestion` array schema (e.g., missing `correctAnswer`, wrong option count), `parseAiJson` SHALL throw a validation error rather than returning the malformed data.

**Validates: Requirements 12.5**

---

## Error Handling

### Error Response Contract

All errors follow the envelope:
```json
{ "success": false, "data": null, "error": "<human-readable message>" }
```

Stack traces are logged server-side (with route + userId context) but never included in API responses.

### Error Categories

| Scenario | HTTP Status | Error message |
|---|---|---|
| Invalid/missing mode | 400 | `"Invalid or missing mode"` |
| Zod validation failure | 422 | `"<field>: <zod message>"` |
| Unauthenticated | 401 | `"Not authorized, no token"` |
| Forbidden role | 403 | `"User role X is not authorized"` |
| Rate limit exceeded | 429 | `"Rate limit exceeded. Maximum 5 AI requests per minute."` |
| AI provider failure | 503 | `"AI service temporarily unavailable"` |
| AI parse error | 500 | `"AI response parse error"` |
| Not found | 404 | `"Resource not found"` |
| Server error | 500 | `"Internal server error"` |

### Graceful AI Failure

The AI controller wraps all agent calls in try/catch. Network errors, timeouts, and provider errors all map to 503. Parse errors map to 500. Neither leaks raw error details to the client.

### MongoDB Disconnection

Mongoose's built-in reconnection logic handles transient disconnections. The server logs the event at `error` level and does not crash.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests catch concrete bugs with specific inputs and verify integration points
- Property tests verify universal correctness across randomly generated inputs

### Property-Based Testing

**Library**: `fast-check` (already in `devDependencies` for both frontend and backend)

**Configuration**: Each property test runs a minimum of 100 iterations (`numRuns: 100`).

**Tag format**: Each property test is tagged with a comment:
```
// Feature: full-stack-refactor-optimization, Property N: <property text>
```

**Property test files**:
- `server/controllers/aiController.property.test.ts` — Properties 1, 2, 8, 10, 11, 12, 13, 14
- `server/ai/parseAiResponse.property.test.ts` — Properties 15, 16, 17, 18
- `server/ai/cacheKey.property.test.ts` — Properties 6, 7
- `server/middleware/validateBody.property.test.ts` — Properties 4, 5
- `server/middleware/cors.property.test.ts` — Property 3
- `server/routes/pagination.property.test.ts` — Property 9

### Unit Tests

Unit tests focus on:
- Specific examples for each agent mode dispatch (Requirement 1.2)
- ADAPTIVE_AGENT response shape `{ questions: [...] }` (Requirement 1.7)
- Default pagination values (page=1, limit=20) (Requirement 5.3)
- `gpt-4o-mini` default model configuration (Requirement 11.3)
- Ollama routing when `OLLAMA_BASE_URL` is set (Requirement 11.5)
- Schema index existence on `ScoreRecord` and `AiCache` (Requirements 4.1, 4.2)
- Required field validation on `Quiz`, `ScoreRecord`, `Note` schemas (Requirement 4.4)

### Frontend Tests

- Lazy loading: verify `PerformanceTrendsChart` and `xlsx` imports are dynamic (Requirements 6.1, 6.2)
- Button disable state: verify submit buttons are disabled during pending API calls (Requirement 6.3)

### Build Validation

- `tsc --noEmit` on both `tsconfig.json` and `server/tsconfig.json` must produce zero errors (Requirement 10.1)
- ESLint must pass with no unused import warnings (Requirement 6.4)
