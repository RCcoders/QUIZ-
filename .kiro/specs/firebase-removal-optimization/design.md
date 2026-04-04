# Design Document: Firebase Removal & Optimization

## Overview

This refactoring removes all Firebase/Firestore from the Classroom Quiz Master frontend, cleans up debug artifacts, and applies a set of targeted backend and frontend optimizations. The backend is already pure MongoDB/Express; the only Firestore usage is a single `getDoc` call in `AdaptiveQuiz.tsx` that fetches a note by ID. After this change the app will have zero Firebase surface area and a smaller JS bundle.

The work falls into five logical groups:

1. **Firebase removal** — delete Firebase files, replace the Firestore call with `GET /api/notes/:id`, remove the npm package.
2. **Cleanup** — delete debug artifacts and dead test files.
3. **Backend optimization** — wire up `AiCache` TTL caching for the adaptive quiz route, add the missing `ScoreRecord.quizId` index, add pagination to the scores list endpoint.
4. **Frontend optimization** — lazy loading is already in place in `App.tsx`; remove unused imports and tighten error handling in `AdaptiveQuiz.tsx`.
5. **Config hygiene** — update `.env.example` and `src/vite-env.d.ts`.

---

## Architecture

The post-refactor architecture is a straightforward MERN stack with no third-party realtime database:

```
Browser (React/Vite SPA)
  └─ REST calls via apiFetch()
       └─ Express API (server/)
            ├─ MongoDB (Mongoose)
            │    ├─ AiCache  (TTL-indexed, 24 h)
            │    ├─ Note
            │    ├─ ScoreRecord  (indexes: userId, quizId, subject, completedAt)
            │    └─ User
            └─ Gemini AI (server-side only)
```

Firebase is entirely absent from this diagram. The frontend communicates exclusively through the Express REST API using JWT auth.

---

## Components and Interfaces

### 1. `AdaptiveQuiz.tsx` — note fetch replacement

Current code (to be removed):
```ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
// ...
const noteRef = doc(db, 'notes', noteId);
const noteSnap = await getDoc(noteRef);
```

Replacement:
```ts
import { apiFetch } from '../utils/api';
// ...
const note = await apiFetch(`/api/notes/${noteId}`);
resolvedSubject = note.subject || resolvedSubject;
resolvedContent = note.content || '';
```

The `apiFetch` utility already handles auth headers and throws on non-2xx responses, so the existing `try/catch` block in the `init` function provides the graceful fallback.

### 2. `server/routes/agentRoutes.ts` — adaptive quiz caching

The `POST /api/ai/agent/adaptive/quiz` route currently skips caching (`// No caching for adaptive`). It will be updated to use `AiCache` with the same pattern as the teacher quiz route:

```ts
const cacheKey = buildCacheKey({ type: 'adaptiveQuiz', ...params });
const cached = await AiCache.findOne({ cacheKey, agentType: 'adaptive' });
if (cached) {
  return res.json({ ...cached.response, fromCache: true });
}
const result = await generateAdaptiveQuiz(userId, params);
await AiCache.create({ cacheKey, agentType: 'adaptive', response: result });
res.json(result);
```

The `AiCache` model already has a MongoDB TTL index (`expireAfterSeconds: 86400`) so no schema changes are needed.

### 3. `server/models/ScoreRecord.ts` — missing index

The model currently indexes `userId`, `subject`, and `completedAt` but is missing `quizId`. Add:

```ts
ScoreRecordSchema.index({ quizId: 1 });
```

### 4. `server/routes/scoreRoutes.ts` — pagination on list endpoint

`GET /api/scores/:userId` currently returns all records unbounded. Add `page`/`limit` support matching the pattern already used in `noteRoutes.ts`:

```ts
const page  = parseInt(req.query.page  as string) || 1;
const limit = parseInt(req.query.limit as string) || 50;
const skip  = (page - 1) * limit;
const [records, total] = await Promise.all([
  ScoreRecord.find({ userId }).sort({ completedAt: -1 }).skip(skip).limit(limit).lean(),
  ScoreRecord.countDocuments({ userId }),
]);
res.json({ records, page, pages: Math.ceil(total / limit), total });
```

### 5. Files to delete

| File | Reason |
|---|---|
| `src/lib/firebase.ts` | Firebase init — no longer needed |
| `firestore.rules` | Firebase config |
| `firestore.indexes.json` | Firebase config |
| `src/utils/firestoreIndexes.test.ts` | Tests deleted config file |
| `src/utils/firestoreRules.test.ts` | Tests deleted config file |
| `out.log`, `out.txt`, `fails.txt`, `fails-utf8.txt` | Debug artifacts |
| `fail-msgs.json`, `failed_tests.json`, `processed-tests.txt`, `lib-out.txt` | Debug artifacts |
| `extract-fails.js`, `get-failures.js` | Debug scripts |
| `api.py` | Not referenced by any build/start/deploy script |

### 6. Config files to update

- **`package.json`** — remove `"firebase"` from `dependencies`.
- **`src/vite-env.d.ts`** — remove all `VITE_FIREBASE_*` declarations; leave the `ImportMetaEnv` interface empty (or with a comment) so the file remains valid.
- **`.env.example`** — remove the Firebase section; add a comment noting Firebase has been removed.
- **`src/utils/scoring.property.test.ts`** — remove the `vi.mock('../lib/firebase', ...)` call since `firebase.ts` will no longer exist.

---

## Data Models

No new models are introduced. Changes to existing models:

### ScoreRecord (addition)
```ts
ScoreRecordSchema.index({ quizId: 1 });  // new
```

### AiCache (no change)
The existing TTL index (`expireAfterSeconds: 86400`) already satisfies the 24-hour cache requirement. The `agentType` field will now accept `'adaptive'` in addition to `'teacher'` and `'student'`.

### Paginated list response shape (new contract)
All list endpoints that add pagination must return:
```ts
{
  records: T[];   // or notes: T[], questions: T[], etc.
  page: number;
  pages: number;
  total: number;
}
```
`GET /api/notes` already follows this shape. `GET /api/scores/:userId` will be updated to match.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Firebase imports in source

*For any* TypeScript/TSX source file under `src/`, the file should contain no import statement whose module specifier starts with `firebase/` or equals `firebase`.

**Validates: Requirements 1.1, 4.1**

---

### Property 2: noteId triggers REST fetch, not Firestore

*For any* `noteId` value passed as a query parameter to `AdaptiveQuiz`, the component should call `apiFetch('/api/notes/<noteId>')` during initialization and should not call any Firestore API.

**Validates: Requirements 1.2**

---

### Property 3: Note fetch failure is handled gracefully

*For any* error thrown by `apiFetch` when fetching a note (404, network error, 500), the `AdaptiveQuiz` component should not throw an unhandled rejection and should reach the `idle` page state with a non-empty subject (falling back to `'General'`).

**Validates: Requirements 1.7, 8.1, 8.2**

---

### Property 4: Test suite passes without Firebase

*For all* tests in the suite, running `npm test` without any `VITE_FIREBASE_*` environment variables set should produce zero failures related to Firebase or Firestore.

**Validates: Requirements 2.4, 10.3**

---

### Property 5: AI cache hit returns cached response

*For any* adaptive quiz request with a given subject and count, if an identical request has already been processed and the cache entry is within the 24-hour TTL, the backend should return the cached response (with `fromCache: true`) without calling the external AI API.

**Validates: Requirements 5.1, 9.1, 9.2**

---

### Property 6: Expired cache entry is treated as a miss

*For any* `AiCache` document whose `createdAt` is older than the TTL, a lookup by its `cacheKey` should return `null` (MongoDB TTL index has expired it), causing the route to generate a fresh response.

**Validates: Requirements 5.2**

---

### Property 7: Paginated list responses are bounded and include metadata

*For any* call to `GET /api/scores/:userId?page=P&limit=L`, the response should contain at most `L` records, and the body should include `total`, `page`, and `pages` fields where `pages = ceil(total / L)`.

**Validates: Requirements 5.3, 9.4**

---

### Property 8: DB error returns structured JSON error response

*For any* Express route handler, if the underlying database operation throws, the response should have an HTTP status ≥ 400 and a JSON body containing a `message` string field.

**Validates: Requirements 5.6, 8.3**

---

### Property 9: Error responses do not expose stack traces

*For any* error response from the Express API, the JSON body should not contain a `stack` field.

**Validates: Requirements 8.4**

---

### Property 10: `__v` fields are omitted from list responses

*For any* list response from the Express API, no item in the returned array should contain a `__v` field (Mongoose internal version key). This is satisfied by using `.lean()` combined with `.select('-__v')` or by the existing `.lean()` calls which already strip Mongoose document methods.

**Validates: Requirements 9.3**

---

## Error Handling

### Frontend

- `AdaptiveQuiz.tsx` `init()` already has a `try/catch` around the note fetch. After replacing the Firestore call with `apiFetch`, the catch block continues with empty content — no change to the fallback logic is needed.
- All other async operations in the component (`generateQuiz`, `saveScoreRecord`, `evaluateBadges`) already have `try/catch` blocks.

### Backend

- All route handlers already follow the pattern `catch (err) { res.status(500).json({ message: err.message }) }`.
- Stack traces are never serialized into the response body (only `err.message` is forwarded).
- The adaptive quiz route will gain the same error shape as the other agent routes.

---

## Testing Strategy

### Unit tests (vitest)

Focus on specific examples and edge cases:

- `AdaptiveQuiz` renders idle state when `apiFetch` for note returns 404.
- `AdaptiveQuiz` renders idle state when `apiFetch` throws a network error.
- `scoreRoutes` returns paginated shape `{ records, page, pages, total }`.
- `agentRoutes` adaptive endpoint returns `fromCache: true` on second identical call.
- `ScoreRecord` schema has indexes on `userId`, `quizId`, `subject`, `completedAt`.

### Property-based tests (fast-check — already in devDependencies)

Each property test must run a minimum of 100 iterations. Tag format: `Feature: firebase-removal-optimization, Property N: <text>`.

**Property 1 — No Firebase imports**
Generate random file paths from the `src/` tree; assert none contain `from 'firebase`. (Static analysis — implemented as a single glob + grep assertion, not a generative test.)

**Property 2 — noteId triggers REST fetch**
Use `fc.string()` to generate arbitrary noteId values; mock `apiFetch` and assert it is called with `/api/notes/<noteId>`.

**Property 3 — Graceful note fetch failure**
Use `fc.oneof(fc.constant(404), fc.constant(500), fc.constant('NetworkError'))` to generate error conditions; assert component reaches `idle` state without throwing.

**Property 5 — AI cache hit**
Use `fc.record({ subject: fc.string(), count: fc.integer({ min: 1, max: 20 }) })` to generate request params; send the same params twice; assert the second response has `fromCache: true` and the AI generator was called exactly once.

**Property 7 — Paginated list**
Use `fc.integer({ min: 1, max: 10 })` for page and `fc.integer({ min: 1, max: 100 })` for limit; assert `records.length <= limit` and `pages === Math.ceil(total / limit)`.

**Property 8 — Structured JSON error**
Use `fc.string()` to generate error messages thrown by a mocked DB; assert response status ≥ 400 and body has `message` string.

**Property 9 — No stack traces**
Same setup as Property 8; assert response body does not have a `stack` key.

**Property 10 — No `__v` fields**
Use `fc.array(fc.record({ _id: fc.string(), subject: fc.string() }))` as mock DB results; assert no item in the response array has a `__v` key.
