# Requirements Document

## Introduction

This spec covers a comprehensive refactoring and optimization effort for the Classroom Quiz Master application — a full-stack MERN app (MongoDB, Express, React, Node.js with Vite). The goals are:

1. Completely remove Firebase/Firestore from the frontend (the backend already uses MongoDB exclusively).
2. Clean up unused files, dead code, and redundant dependencies.
3. Optimize backend API routes, database queries, and AI/API call caching.
4. Optimize the frontend with lazy loading, code splitting, and reduced re-renders.
5. Improve project structure, error handling, and overall stability.

**Current Firebase surface area (from codebase analysis):**
- `src/lib/firebase.ts` — Firebase app init + Firestore `db` export
- `src/pages/AdaptiveQuiz.tsx` — uses `doc`, `getDoc` from `firebase/firestore` to fetch a note by `noteId`
- `src/vite-env.d.ts` — declares `VITE_FIREBASE_*` env vars
- `.env.example` — documents Firebase env vars
- `firestore.rules` and `firestore.indexes.json` — Firebase config files at project root
- `src/utils/firestoreIndexes.test.ts` and `src/utils/firestoreRules.test.ts` — tests that validate Firebase config files
- `src/utils/scoring.property.test.ts` — mocks `../lib/firebase`
- `src/pages/PrivacyPage.tsx` — mentions Firebase in legal copy
- `firebase` package in `package.json` dependencies

The backend is already fully MongoDB/Express with JWT auth — no Firebase on the server side.

---

## Glossary

- **System**: The full-stack Classroom Quiz Master application (frontend + backend).
- **Frontend**: The React/Vite SPA in `src/`.
- **Backend**: The Express/Node.js server in `server/`.
- **Firebase_SDK**: The `firebase` npm package and all imports from `firebase/*`.
- **Firestore**: Firebase's cloud database, currently used only in `AdaptiveQuiz.tsx` to fetch notes by ID.
- **MongoDB**: The sole database for the application, accessed via Mongoose on the backend.
- **Notes_API**: The existing Express route `GET /api/notes/:id` that retrieves a note by its MongoDB `_id`.
- **AiCache**: The `server/models/AiCache.ts` Mongoose model used for caching AI responses.
- **JWT**: JSON Web Token used for all authentication between frontend and backend.
- **Dead_Code**: Unused variables, functions, imports, or files that are never referenced in production code paths.
- **Lazy_Loading**: React's `React.lazy()` + `Suspense` pattern for deferred component loading.

---

## Requirements

### Requirement 1: Remove Firebase SDK from the Frontend

**User Story:** As a developer, I want to remove all Firebase/Firestore imports and configuration from the frontend, so that the `firebase` package is no longer bundled and the app relies solely on MongoDB via the Express API.

#### Acceptance Criteria

1. THE Frontend SHALL contain no imports from `firebase/app`, `firebase/firestore`, or any other `firebase/*` subpath after the refactor.
2. WHEN a `noteId` query parameter is present on the Adaptive Quiz page, THE Frontend SHALL fetch the note's subject and content by calling `GET /api/notes/:id` instead of querying Firestore directly.
3. THE System SHALL remove `src/lib/firebase.ts` as it will no longer be needed.
4. THE Frontend SHALL remove all `VITE_FIREBASE_*` environment variable references from `src/vite-env.d.ts`.
5. THE System SHALL remove `firestore.rules` and `firestore.indexes.json` from the project root.
6. THE System SHALL remove the `firebase` entry from `dependencies` in the root `package.json`.
7. IF the Notes_API returns a 404 or network error when fetching by `noteId`, THEN THE Frontend SHALL fall through gracefully and continue with an empty subject/content rather than crashing.

---

### Requirement 2: Replace Firestore-Dependent Tests

**User Story:** As a developer, I want all tests to be free of Firebase/Firestore dependencies, so that the test suite runs without Firebase emulators or SDK mocks.

#### Acceptance Criteria

1. THE System SHALL remove `src/utils/firestoreIndexes.test.ts` as it validates a Firebase config file that will be deleted.
2. THE System SHALL remove `src/utils/firestoreRules.test.ts` as it validates a Firebase rules file that will be deleted.
3. WHEN `src/utils/scoring.property.test.ts` mocks `../lib/firebase`, THE System SHALL update that mock to remove the Firebase dependency (or remove the mock entirely if `firebase.ts` is deleted and the module is no longer imported).
4. THE System SHALL ensure all remaining tests pass after Firebase removal without requiring any Firebase emulator or `VITE_FIREBASE_*` environment variables.

---

### Requirement 3: Clean Up Unused and Debug Files

**User Story:** As a developer, I want unused files, debug artifacts, and redundant configs removed from the project root and source tree, so that the repository is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL remove debug/log artifact files from the project root: `out.log`, `out.txt`, `fails.txt`, `fails-utf8.txt`, `fail-msgs.json`, `failed_tests.json`, `processed-tests.txt`, `lib-out.txt`.
2. THE System SHALL remove debug script files from the project root: `extract-fails.js`, `get-failures.js`.
3. THE System SHALL remove `api.py` from the project root if it is not referenced by any active build, start, or deployment script.
4. WHEN removing any file, THE System SHALL verify no active import or script reference points to that file before deletion.
5. THE System SHALL update `.env.example` to remove all `VITE_FIREBASE_*` variable entries and add a note that Firebase has been removed.

---

### Requirement 4: Remove Unused Dependencies

**User Story:** As a developer, I want unused npm packages removed from `package.json`, so that install time, bundle size, and attack surface are reduced.

#### Acceptance Criteria

1. THE System SHALL remove the `firebase` package from root `package.json` `dependencies` after all Firebase imports are eliminated.
2. WHEN removing a dependency, THE System SHALL confirm no remaining source file imports from that package before removing it.
3. THE System SHALL preserve all packages that are actively used by production code or tests (e.g., `@tanstack/react-query`, `framer-motion`, `socket.io-client`, `recharts`, etc.).
4. THE System SHALL preserve all `devDependencies` that are used by the build, lint, or test pipeline.

---

### Requirement 5: Backend API Optimization

**User Story:** As a developer, I want the Express backend to avoid redundant database calls and cache AI responses, so that response times improve and external API costs decrease.

#### Acceptance Criteria

1. WHEN an AI-generated quiz request arrives with the same subject and parameters, THE Backend SHALL return a cached response from the `AiCache` MongoDB collection if a valid cache entry exists, instead of calling the external AI API again.
2. THE Backend SHALL define a cache TTL (time-to-live) for AI responses; WHEN a cache entry's age exceeds the TTL, THE Backend SHALL treat it as a cache miss and generate a fresh response.
3. WHEN fetching lists of quizzes or notes, THE Backend SHALL support pagination via `page` and `limit` query parameters to avoid returning unbounded result sets.
4. THE Backend SHALL add a MongoDB index on `ScoreRecord.userId` to optimize the frequent `GET /api/scores/:userId` query.
5. THE Backend SHALL add a MongoDB index on `ScoreRecord.quizId` to optimize quiz-level aggregation queries.
6. IF a database operation fails, THEN THE Backend SHALL return a structured JSON error response with an appropriate HTTP status code rather than crashing the process.

---

### Requirement 6: Frontend Performance Optimization

**User Story:** As a developer, I want the React frontend to load faster and re-render less, so that users experience a snappier interface.

#### Acceptance Criteria

1. THE Frontend SHALL use `React.lazy()` and `React.Suspense` to lazy-load page-level components that are not needed on the initial render.
2. THE Frontend SHALL remove unused imports from all component and page files identified during the cleanup pass.
3. WHEN a component receives the same props as a previous render, THE Frontend SHALL avoid unnecessary re-renders by using `React.memo` or `useCallback`/`useMemo` where profiling identifies hot spots.
4. THE Frontend SHALL not import the entire `firebase` bundle (this is satisfied by Requirement 1, but the bundle size reduction must be verifiable via `vite build` output).
5. WHERE a page component is only needed for a specific user role (teacher or student), THE Frontend SHALL lazy-load that component so it is not included in the initial JS bundle.

---

### Requirement 7: Project Structure Improvement

**User Story:** As a developer, I want the project to follow a consistent, well-organized directory structure, so that new contributors can navigate the codebase easily.

#### Acceptance Criteria

1. THE Backend SHALL organize source files under `server/` with the sub-directories: `controllers/`, `routes/`, `services/`, `ai/`, `db/` (or `config/`), `models/`, `middleware/`, and `types/` — matching the existing layout where already correct.
2. THE Frontend SHALL organize source files under `src/` with the sub-directories: `components/`, `pages/`, `hooks/`, `utils/`, `lib/`, `contexts/`, `types/`, and `api/` — matching the existing layout where already correct.
3. WHEN a file is moved to a new location, THE System SHALL update all import paths that reference that file.
4. THE System SHALL not introduce new top-level directories beyond those already established unless required by a specific optimization task.

---

### Requirement 8: Error Handling and Stability

**User Story:** As a developer, I want all API calls and async operations to be wrapped in proper error handling, so that the application does not crash due to removed Firebase code or unhandled promise rejections.

#### Acceptance Criteria

1. WHEN an async operation in a React component fails, THE Frontend SHALL catch the error and display a user-visible error state rather than an unhandled rejection.
2. THE Frontend SHALL wrap the note-fetching logic in `AdaptiveQuiz.tsx` (previously using Firestore) in a `try/catch` block so that a failed API call does not prevent the quiz from loading.
3. WHEN an Express route handler encounters an unexpected error, THE Backend SHALL respond with a 500 status and a JSON body containing a `message` field.
4. THE Backend SHALL not expose raw stack traces or internal error details in production API responses.
5. IF the MongoDB connection is unavailable at startup, THEN THE Backend SHALL log a descriptive error and exit with a non-zero code (existing behavior in `server/config/db.ts` must be preserved).

---

### Requirement 9: Performance Enhancement via Caching Layer

**User Story:** As a developer, I want a caching layer for expensive operations, so that repeated identical requests are served faster and external API usage is minimized.

#### Acceptance Criteria

1. THE Backend SHALL use the existing `AiCache` Mongoose model to store and retrieve cached AI-generated quiz questions keyed by subject and question count.
2. WHEN a cached AI response is found and is within the TTL, THE Backend SHALL return it with a response header or field indicating the result was served from cache.
3. THE Backend SHALL minimize the size of API responses by omitting fields that are not consumed by the frontend (e.g., internal Mongoose `__v` fields should be excluded from list responses).
4. WHEN returning paginated lists, THE Backend SHALL include `total`, `page`, and `pages` metadata so the frontend can implement pagination controls without additional requests.
5. THE System SHALL avoid sending duplicate data in a single response (e.g., a quiz object should not embed the full question list AND a separate question count field when one can be derived from the other).

---

### Requirement 10: Final Verification and Documentation

**User Story:** As a developer, I want a clear record of all changes made during this refactoring, so that the team can verify nothing was broken and understand what was removed.

#### Acceptance Criteria

1. THE System SHALL produce a list of all files deleted during the Firebase removal and cleanup phases.
2. THE System SHALL produce an updated `package.json` with the `firebase` dependency removed.
3. WHEN the refactoring is complete, THE System SHALL pass all remaining tests (`npm test`) without Firebase-related failures.
4. THE System SHALL produce an updated `.env.example` that reflects the post-Firebase configuration (no `VITE_FIREBASE_*` keys).
5. THE Frontend build (`npm run build`) SHALL complete without TypeScript errors related to removed Firebase types or missing `VITE_FIREBASE_*` env vars.
