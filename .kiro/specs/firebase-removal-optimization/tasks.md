# Implementation Plan: Firebase Removal & Optimization

## Overview

Remove all Firebase/Firestore from the frontend, clean up debug artifacts, wire AiCache TTL caching for the adaptive quiz route, add the missing ScoreRecord index, add pagination to the scores endpoint, and apply frontend lazy-loading and error-handling improvements. All work is in TypeScript/TSX.

## Tasks

- [x] 1. Firebase removal — replace Firestore call and delete Firebase files
  - [x] 1.1 Replace Firestore note fetch in `src/pages/AdaptiveQuiz.tsx`
    - Remove `import { doc, getDoc } from 'firebase/firestore'` and `import { db } from '../lib/firebase'`
    - In the `init` `useEffect`, replace the `doc(db, 'notes', noteId)` / `getDoc` block with `const note = await apiFetch(\`/api/notes/${noteId}\`); resolvedSubject = note.subject || resolvedSubject; resolvedContent = note.content || '';`
    - Keep the existing `try/catch` so a 404 or network error falls through silently
    - _Requirements: 1.2, 1.7, 8.2_

  - [x] 1.2 Write property test for graceful note-fetch failure (Property 3)
    - **Property 3: Note fetch failure is handled gracefully**
    - Use `fc.oneof(fc.constant(404), fc.constant(500), fc.constant('NetworkError'))` to generate error conditions; mock `apiFetch` to throw; assert component reaches `idle` state without throwing
    - **Validates: Requirements 1.7, 8.1, 8.2**

  - [x] 1.3 Delete Firebase source and config files
    - Delete `src/lib/firebase.ts`
    - Delete `firestore.rules`
    - Delete `firestore.indexes.json`
    - _Requirements: 1.3, 1.5_

  - [x] 1.4 Remove `firebase` from `package.json` dependencies
    - Delete the `"firebase"` entry from `dependencies` in `package.json`
    - _Requirements: 1.6, 4.1_

- [x] 2. Config hygiene — remove Firebase env vars and update type declarations
  - [x] 2.1 Update `src/vite-env.d.ts` to remove all `VITE_FIREBASE_*` declarations
    - Remove every `VITE_FIREBASE_*` line from the `ImportMetaEnv` interface; leave the interface valid (empty or with a comment)
    - _Requirements: 1.4, 10.5_

  - [x] 2.2 Update `.env.example` to remove Firebase section
    - Remove all `VITE_FIREBASE_*` variable entries
    - Add a comment: `# Firebase has been removed — no VITE_FIREBASE_* vars required`
    - _Requirements: 3.5, 10.4_

- [x] 3. Test cleanup — remove Firebase-dependent tests and mocks
  - [x] 3.1 Delete dead Firebase test files
    - Delete `src/utils/firestoreIndexes.test.ts`
    - Delete `src/utils/firestoreRules.test.ts`
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Remove Firebase mock from `src/utils/scoring.property.test.ts`
    - Delete the `vi.mock('../lib/firebase', ...)` block (and any related `store` / `currentUserUid` setup that was only there to support it)
    - Ensure the remaining `apiFetch` mock and property tests still pass
    - _Requirements: 2.3, 2.4_

- [x] 4. Checkpoint — verify Firebase is fully gone
  - Run `npm test` and confirm zero Firebase-related failures; run `npm run build` and confirm no TypeScript errors about missing Firebase types or `VITE_FIREBASE_*` vars
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 2.4, 10.3, 10.5_

- [x] 5. Cleanup — delete debug artifacts and dead scripts
  - [x] 5.1 Delete debug artifact files from project root
    - Delete: `out.log`, `out.txt`, `fails.txt`, `fails-utf8.txt`, `fail-msgs.json`, `failed_tests.json`, `processed-tests.txt`, `lib-out.txt`
    - _Requirements: 3.1_

  - [x] 5.2 Delete debug script files and unused Python script
    - Delete: `extract-fails.js`, `get-failures.js`, `api.py`
    - Confirm none are referenced in `package.json` scripts, `vercel.json`, or any active import before deleting
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 6. Backend optimization — wire AiCache for adaptive quiz route
  - [x] 6.1 Add TTL caching to `POST /api/ai/agent/adaptive/quiz` in `server/routes/agentRoutes.ts`
    - Before calling `generateAdaptiveQuiz`, build a cache key: `const cacheKey = buildCacheKey({ type: 'adaptiveQuiz', ...params })`
    - Look up `AiCache.findOne({ cacheKey, agentType: 'adaptive' })`; if found, return `{ ...cached.response, fromCache: true }`
    - On cache miss, call `generateAdaptiveQuiz`, then `AiCache.create({ cacheKey, agentType: 'adaptive', response: result })`, then return `result`
    - The existing TTL index (`expireAfterSeconds: 86400`) on `AiCache` already handles expiry — no schema change needed
    - _Requirements: 5.1, 5.2, 9.1, 9.2_

  - [x] 6.2 Write property test for AI cache hit (Property 5)
    - **Property 5: AI cache hit returns cached response**
    - Use `fc.record({ subject: fc.string({ minLength: 1 }), count: fc.integer({ min: 1, max: 20 }) })` to generate params; send the same params twice; assert second response has `fromCache: true` and `generateAdaptiveQuiz` was called exactly once
    - **Validates: Requirements 5.1, 9.1, 9.2**

  - [x] 6.3 Write property test for expired cache treated as miss (Property 6)
    - **Property 6: Expired cache entry is treated as a miss**
    - Mock `AiCache.findOne` to return `null` (simulating TTL expiry); assert `generateAdaptiveQuiz` is called and a fresh response is returned
    - **Validates: Requirements 5.2**

- [x] 7. Backend optimization — add `ScoreRecord.quizId` index and paginate scores endpoint
  - [x] 7.1 Add `quizId` index to `server/models/ScoreRecord.ts`
    - Add `ScoreRecordSchema.index({ quizId: 1 });` after the existing index declarations
    - _Requirements: 5.5_

  - [x] 7.2 Add pagination to `GET /api/scores/:userId` in `server/routes/scoreRoutes.ts`
    - Parse `page` and `limit` from query params (defaults: `page=1`, `limit=50`)
    - Replace the unbounded `ScoreRecord.find({ userId })` with a `Promise.all` of the paginated find and `countDocuments`
    - Return `{ records, page, pages: Math.ceil(total / limit), total }`
    - _Requirements: 5.3, 9.4_

  - [x] 7.3 Write property test for paginated list response (Property 7)
    - **Property 7: Paginated list responses are bounded and include metadata**
    - Use `fc.integer({ min: 1, max: 10 })` for page and `fc.integer({ min: 1, max: 100 })` for limit; assert `records.length <= limit` and `pages === Math.ceil(total / limit)` and response body contains `total`, `page`, `pages`
    - **Validates: Requirements 5.3, 9.4**

  - [x] 7.4 Write property test for structured JSON error on DB failure (Property 8)
    - **Property 8: DB error returns structured JSON error response**
    - Use `fc.string({ minLength: 1 })` to generate error messages thrown by a mocked DB operation; assert response status ≥ 400 and body has a `message` string field
    - **Validates: Requirements 5.6, 8.3**

  - [x] 7.5 Write property test for no stack traces in error responses (Property 9)
    - **Property 9: Error responses do not expose stack traces**
    - Same setup as Property 8; assert response body does not contain a `stack` key
    - **Validates: Requirements 8.4**

  - [x] 7.6 Write property test for no `__v` fields in list responses (Property 10)
    - **Property 10: `__v` fields are omitted from list responses**
    - Use `fc.array(fc.record({ _id: fc.string(), subject: fc.string() }))` as mock DB results; assert no item in the response array has a `__v` key
    - **Validates: Requirements 9.3**

- [x] 8. Checkpoint — backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Frontend optimization — lazy loading and unused import removal
  - [x] 9.1 Apply `React.lazy()` + `Suspense` to page-level components in `src/main.tsx` / `src/App.tsx`
    - Wrap each page-level route component with `React.lazy(() => import(...))` for components not needed on initial render
    - Add a `<Suspense fallback={...}>` boundary around the router outlet
    - _Requirements: 6.1, 6.5_

  - [x] 9.2 Write property test for no Firebase imports in source (Property 1)
    - **Property 1: No Firebase imports in source**
    - Glob all `.ts` / `.tsx` files under `src/`; assert none contain an import whose specifier starts with `firebase/` or equals `firebase`
    - **Validates: Requirements 1.1, 4.1**

  - [x] 9.3 Write property test for noteId triggers REST fetch (Property 2)
    - **Property 2: noteId triggers REST fetch, not Firestore**
    - Use `fc.string({ minLength: 1 })` to generate arbitrary `noteId` values; mock `apiFetch` and assert it is called with `/api/notes/<noteId>` during `AdaptiveQuiz` initialization; assert no Firestore API is called
    - **Validates: Requirements 1.2**

  - [x] 9.4 Remove unused imports across `src/` files identified during cleanup
    - Remove any imports that are no longer referenced after Firebase removal (e.g., any residual `firebase` or `db` references in other files)
    - _Requirements: 6.2_

- [x] 10. Final checkpoint — full suite green and build clean
  - Run `npm test` — all tests must pass with zero Firebase-related failures
  - Run `npm run build` — must complete without TypeScript errors
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already in `devDependencies`) with a minimum of 100 iterations
- The `AiCache` TTL index (`expireAfterSeconds: 86400`) already exists — no schema migration needed
- Lazy loading: `App.tsx` may already have some lazy imports; audit before adding duplicates
