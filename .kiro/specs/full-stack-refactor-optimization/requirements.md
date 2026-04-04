# Requirements Document

## Introduction

This document defines the requirements for a full-stack refactoring and optimization effort on the MERN + AI application (classroom-quiz-master). The system currently has three parallel AI subsystems (OpenAI agent routes, a Gemini-based adaptive service, and a Python FastAPI proxy), in-memory rate limiting, wide-open CORS, a fallback JWT secret, and inconsistent API response shapes. The goal is to consolidate, harden, optimize, and prepare the system for production-scale operation (1000+ concurrent users) without breaking any existing working features.

## Glossary

- **System**: The full-stack MERN + AI application (frontend React/Vite + backend Express/Node.js + MongoDB).
- **AI_Controller**: The unified Express controller that handles all AI requests via `POST /api/ai/run`.
- **Agent**: One of three AI execution units — `TEACHER_AGENT`, `STUDENT_AGENT`, or `ADAPTIVE_AGENT` — each backed by the OpenAI client.
- **AgentMode**: The string discriminator passed in the request body: `"TEACHER_AGENT"`, `"STUDENT_AGENT"`, or `"ADAPTIVE_AGENT"`.
- **AI_Cache**: The MongoDB `AiCache` collection used to store and retrieve AI responses by cache key.
- **Cache_Key**: A normalized, deterministic SHA-256 hash derived from trimmed, lowercased agent input parameters.
- **Rate_Limiter**: The middleware that enforces per-user AI request quotas using a persistent store.
- **Response_Envelope**: The standard JSON shape `{ "success": boolean, "data": any, "error": string | null }` returned by all API endpoints.
- **Schema_Validator**: The Zod-based middleware that validates incoming request bodies against defined schemas before they reach route handlers.
- **CORS_Policy**: The list of explicitly allowed origins configured in the Express CORS middleware.
- **JWT_Secret**: The secret used to sign and verify JSON Web Tokens; must be sourced exclusively from environment variables with no fallback value.
- **Pagination**: The mechanism for returning large dataset results in pages using `limit` and `offset` (or cursor) query parameters.
- **Lazy_Load**: The React pattern of deferring the import of a heavy module until it is first needed, using `React.lazy` and `Suspense`.
- **Request_Queue**: A bounded async queue that serializes or throttles concurrent AI calls to prevent provider rate-limit errors and server overload.
- **Index**: A MongoDB index definition that accelerates query performance on frequently filtered or sorted fields.
- **AI_Version**: A numeric field stored alongside AI-generated documents to track which generation of prompt/model produced the data.
- **Python_AI_Service**: The legacy `server/services/pythonAiService.ts` and `server/services/adaptiveService.ts` that call Gemini and a Python FastAPI process; targeted for removal.
- **Gemini_Serverless**: The `api/generate-questions.ts` Vercel serverless function that calls the Gemini API; retained as-is for the Vercel deployment path.

---

## Requirements

### Requirement 1: Unified AI Controller

**User Story:** As a backend developer, I want all AI requests routed through a single controller endpoint, so that AI logic is centralized, testable, and easy to maintain.

#### Acceptance Criteria

1. THE System SHALL expose a single endpoint `POST /api/ai/run` that accepts `{ "mode": "TEACHER_AGENT | STUDENT_AGENT | ADAPTIVE_AGENT", "data": { ... } }`.
2. WHEN a request arrives at `POST /api/ai/run`, THE AI_Controller SHALL dispatch to the appropriate Agent based on the `mode` field.
3. IF the `mode` field is absent or not one of the three valid AgentMode values, THEN THE AI_Controller SHALL return a 400 response with `{ "success": false, "data": null, "error": "Invalid or missing mode" }`.
4. THE AI_Controller SHALL apply authentication (`protect` middleware) and rate limiting (`Rate_Limiter`) before dispatching to any Agent.
5. WHEN the Python_AI_Service routes (`/api/ai/quiz`, `/api/ai/notes`, `/api/ai/adaptive`) and the legacy agent sub-routes (`/api/ai/agent/teacher/quiz`, `/api/ai/agent/student/notes`, `/api/ai/agent/adaptive/quiz`) are removed, THE System SHALL continue to serve all existing frontend AI features through `POST /api/ai/run`.
6. THE AI_Controller SHALL ensure all three Agents return responses wrapped in the Response_Envelope.
7. WHEN `ADAPTIVE_AGENT` mode is used, THE AI_Controller SHALL return `{ "success": true, "data": { "questions": [...] }, "error": null }`.

### Requirement 2: API Response Standardization

**User Story:** As a frontend developer, I want every API endpoint to return a consistent response shape, so that I can write predictable data-fetching logic without per-endpoint special cases.

#### Acceptance Criteria

1. THE System SHALL ensure every API endpoint returns a Response_Envelope: `{ "success": boolean, "data": any, "error": string | null }`.
2. WHEN an operation succeeds, THE System SHALL set `"success": true`, populate `"data"`, and set `"error": null`.
3. WHEN an operation fails, THE System SHALL set `"success": false`, set `"data": null`, and populate `"error"` with a human-readable message.
4. THE System SHALL NOT return bare objects, bare arrays, or `{ "message": "..." }` shapes from any route handler.
5. WHEN the adaptive quiz endpoint returns questions, THE System SHALL return `{ "success": true, "data": { "questions": [...] }, "error": null }`.

### Requirement 3: Security Hardening

**User Story:** As a security engineer, I want the application to enforce strict security controls, so that it is protected against common web vulnerabilities and unauthorized access.

#### Acceptance Criteria

1. THE System SHALL configure CORS to allow only an explicit list of trusted origins defined in environment variables; wildcard (`*`) origins SHALL NOT be permitted in production.
2. IF a request originates from an origin not in the trusted list, THEN THE System SHALL reject it with a 403 response.
3. THE System SHALL NOT use any fallback or hardcoded value for `JWT_SECRET`; IF `JWT_SECRET` is absent from the environment, THEN THE System SHALL refuse to start and log a fatal error.
4. THE Schema_Validator SHALL validate all incoming request bodies on every route that accepts a body, using Zod schemas defined alongside each route.
5. IF a request body fails schema validation, THEN THE Schema_Validator SHALL return a 422 response with `{ "success": false, "data": null, "error": "<validation details>" }`.
6. THE System SHALL sanitize all string inputs passed to AI prompts to strip or escape characters that could constitute prompt injection (e.g., sequences like `Ignore previous instructions`).
7. THE Rate_Limiter SHALL use a persistent store (Redis or MongoDB) rather than an in-memory Map, so that limits survive process restarts and apply across multiple server instances.

### Requirement 4: Database Optimization

**User Story:** As a database engineer, I want MongoDB collections to have appropriate indexes and normalized data, so that queries remain fast as data volume grows.

#### Acceptance Criteria

1. THE System SHALL add a compound index `{ userId: 1, topic: 1 }` on the `ScoreRecord` collection to accelerate per-user, per-topic performance queries.
2. THE System SHALL add an index `{ key: 1 }` (or `{ cacheKey: 1 }`) on the `AiCache` collection; this index SHALL be unique.
3. WHEN a Cache_Key is generated, THE System SHALL normalize all string inputs by trimming whitespace and converting to lowercase before hashing.
4. THE System SHALL ensure the `Quiz`, `ScoreRecord`, and `Note` schemas each define all required fields with explicit types and validation constraints in Mongoose.
5. WHEN AI-generated data is stored (in `AiCache` or embedded in other documents), THE System SHALL include an `aiVersion` integer field initialized to `1`.
6. WHEN the `aiVersion` field is incremented, THE System SHALL invalidate or ignore cached entries with a lower `aiVersion` value.

### Requirement 5: Backend Performance Optimization

**User Story:** As a backend developer, I want the server to avoid redundant work, so that response times are low and infrastructure costs are minimized.

#### Acceptance Criteria

1. WHEN an AI request arrives and a matching Cache_Key exists in AI_Cache with a non-expired entry, THE AI_Controller SHALL return the cached response without calling the AI provider.
2. THE System SHALL add pagination support to all list endpoints that may return more than 20 documents; pagination SHALL use `limit` (max 100) and `page` query parameters.
3. WHEN a list endpoint is called without pagination parameters, THE System SHALL default to `page=1` and `limit=20`.
4. THE System SHALL avoid issuing redundant MongoDB queries within a single request lifecycle (e.g., fetching the same document twice).
5. THE System SHALL process array transformations using efficient iteration patterns and SHALL NOT use nested loops with O(n²) complexity where an O(n) alternative exists.

### Requirement 6: Frontend Performance Optimization

**User Story:** As a frontend developer, I want the React application to load quickly and avoid unnecessary re-renders, so that users experience a responsive UI.

#### Acceptance Criteria

1. THE System SHALL lazy-load the `recharts` library using `React.lazy` and `Suspense` so that chart code is not included in the initial bundle.
2. THE System SHALL lazy-load the `xlsx` library so that spreadsheet code is not included in the initial bundle.
3. WHEN a user submits a form or triggers an API call, THE System SHALL disable the triggering button until the response is received, preventing duplicate submissions.
4. THE System SHALL remove all unused component imports and dead code identified by the TypeScript compiler or ESLint.
5. THE System SHALL ensure that state updates that do not affect rendered output are not placed in component render paths (i.e., avoid calling `setState` unconditionally on every render).

### Requirement 7: Scalability

**User Story:** As a DevOps engineer, I want the backend to handle 1000+ concurrent users without degradation, so that the system remains stable under production load.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL use a persistent store (Redis or MongoDB-backed) so that rate limit state is shared across all server instances in a horizontally scaled deployment.
2. THE System SHALL implement a Request_Queue for outbound AI provider calls with a configurable maximum concurrency (default: 10 simultaneous AI calls).
3. WHEN the Request_Queue is at maximum concurrency and a new AI request arrives, THE System SHALL queue the request and respond once capacity is available, rather than immediately calling the AI provider.
4. THE System SHALL document a horizontal scaling strategy: stateless Express servers behind a load balancer, shared MongoDB Atlas cluster, shared Redis instance for rate limiting and caching.
5. WHERE Redis is available, THE System SHALL use Redis as the primary caching layer for AI responses in preference to MongoDB AI_Cache.

### Requirement 8: Codebase Cleanup

**User Story:** As a developer, I want the codebase to be free of dead code and legacy artifacts, so that it is easy to navigate and maintain.

#### Acceptance Criteria

1. THE System SHALL remove `server/services/pythonAiService.ts` and `server/services/adaptiveService.ts` after all callers are migrated to the unified AI_Controller.
2. THE System SHALL remove `server/routes/aiRoutes.ts` after all routes are migrated to `POST /api/ai/run`.
3. THE System SHALL remove any Content Security Policy headers, HTML meta tags, or configuration entries that reference Firebase or Firestore.
4. THE System SHALL remove `question_generator.py`, `requirements.txt`, and any other Python service files that are no longer needed after AI consolidation.
5. THE System SHALL extract repeated logic (e.g., cache lookup + store pattern, response envelope wrapping) into shared utility modules.
6. THE System SHALL ensure `server/package.json` does not list `@google/generative-ai` as a dependency after the Gemini service is removed from the backend.

### Requirement 9: Error Handling and Stability

**User Story:** As a developer, I want all async operations to be wrapped in error handling, so that the application does not crash on unexpected failures.

#### Acceptance Criteria

1. THE System SHALL wrap every `async` route handler and service function in a `try/catch` block or equivalent error-handling middleware.
2. WHEN an AI provider call fails (network error, timeout, or provider error), THE System SHALL return a 503 response with `{ "success": false, "data": null, "error": "AI service temporarily unavailable" }` rather than crashing.
3. WHEN an invalid or malformed JSON body is received, THE System SHALL return a 400 response with a descriptive error message rather than an unhandled exception.
4. THE System SHALL log all unhandled errors with sufficient context (route, user ID if available, error message) without exposing stack traces to API consumers.
5. IF the MongoDB connection is lost during operation, THEN THE System SHALL log the disconnection event and attempt reconnection using Mongoose's built-in retry logic.

### Requirement 10: Build and Deployment Readiness

**User Story:** As a DevOps engineer, I want the project to build cleanly and use environment-specific configuration, so that it can be deployed to production without manual intervention.

#### Acceptance Criteria

1. THE System SHALL produce zero TypeScript compilation errors when running `tsc --noEmit` on both the frontend and backend TypeScript configurations.
2. THE System SHALL separate development and production environment variable templates: `.env.example` for development defaults and a documented production checklist.
3. THE System SHALL ensure all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CORS_ALLOWED_ORIGINS`) are documented in `.env.example` with descriptions.
4. WHEN `NODE_ENV=production`, THE System SHALL disable verbose debug logging and enable only warn/error level logs.
5. THE System SHALL ensure `dist/` and `server/dist/` are listed in `.gitignore` and are not committed to version control.
6. THE System SHALL ensure `node_modules/` and `server/node_modules/` are listed in `.gitignore` and are not committed to version control.

### Requirement 11: AI Cost Optimization

**User Story:** As a product owner, I want AI provider costs to be minimized, so that the system remains economically viable at scale.

#### Acceptance Criteria

1. THE AI_Controller SHALL check AI_Cache before every AI provider call and return the cached result when a valid, non-expired entry exists.
2. THE System SHALL enforce a maximum input token budget per AI request by truncating inputs that exceed a configurable character limit (default: 20,000 characters) before sending to the provider.
3. THE System SHALL use the `gpt-4o-mini` model as the default for all agent calls unless overridden by the `OPENAI_MODEL` environment variable.
4. THE Request_Queue SHALL prevent thundering-herd scenarios where many identical requests simultaneously bypass the cache and each trigger a separate AI provider call (cache-stampede prevention).
5. WHERE Ollama is configured via `OLLAMA_BASE_URL`, THE System SHALL route all AI calls through Ollama instead of the paid OpenAI API, enabling zero-cost local development.

### Requirement 12: Parser and Serializer Correctness

**User Story:** As a developer, I want AI response parsing to be robust and verifiable, so that malformed AI output does not silently corrupt data.

#### Acceptance Criteria

1. WHEN an AI provider returns a response, THE System SHALL parse the JSON content using a dedicated parser function that strips markdown fences before parsing.
2. IF the AI response cannot be parsed as valid JSON, THEN THE System SHALL throw a structured error with `{ message: "AI response parse error", raw: "<raw string>" }` rather than propagating a bare `SyntaxError`.
3. THE Pretty_Printer SHALL serialize parsed AI question arrays back to the canonical JSON format used in prompts.
4. FOR ALL valid AI question arrays, parsing then printing then parsing SHALL produce an equivalent array (round-trip property).
5. WHEN an AI response is parsed, THE System SHALL validate that the result matches the expected schema (e.g., array of MCQQuestion) and reject responses that do not conform.
