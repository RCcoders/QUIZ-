# Implementation Plan: Student Pages

## Overview

Implement the student-facing feature set for QuizMaster: dedicated Signup/Login pages, role-based routing, Student Dashboard, Quiz Browser with search, Quiz Player improvements, Results Page, and a shared Student Navbar. Each task builds incrementally on the previous, ending with full integration.

## Tasks

- [x] 1. Extend Firebase and AuthContext with Firestore profile support
  - Add `getFirestore`, `doc`, `setDoc`, `getDoc` imports to `src/lib/firebase.ts` and export a `db` instance.
  - Add `GoogleAuthProvider` and `signInWithPopup` imports to `AuthContext`.
  - Define `UserProfile` and `ScoreRecord` TypeScript interfaces in `src/types/student.ts`.
  - Extend `AuthContextType` with `userProfile`, `signInWithGoogle`, and updated `signUp` signature (adds `displayName` and `role` params).
  - In `AuthProvider`, fetch `users/{uid}` on `onAuthStateChanged` and set `userProfile` state.
  - Implement `createUserProfile(uid, data)` helper that writes to `users/{uid}` in Firestore.
  - Implement `signInWithGoogle()` using `GoogleAuthProvider`; create profile doc if it doesn't exist.
  - _Requirements: 1.2, 1.4, 1.9, 2.1_

  - [x] 1.1 Write property test for role-based redirect logic
    - Extract a pure `getRedirectPath(role: string): string` utility function.
    - **Property 8: Role-based redirect is exhaustive**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 2. Extend scoring utilities and add score persistence
  - In `src/utils/scoring.ts`, add `getPerformanceLabel(percentage: number)` returning `'Excellent' | 'Good' | 'Keep Practicing'`.
  - Add `computeAverageScore(records: ScoreRecord[]): number`.
  - Add `computeStreak(records: ScoreRecord[]): number` based on consecutive active days.
  - Add `saveScoreRecord(uid: string, record: Omit<ScoreRecord, 'id'>): Promise<void>` that writes to `users/{uid}/scores`.
  - Add `getScoreRecords(uid: string): Promise<ScoreRecord[]>` that reads from `users/{uid}/scores` ordered by `completedAt` desc.
  - _Requirements: 3.3, 3.4, 5.7, 6.2_

  - [x] 2.1 Write property tests for scoring utilities
    - **Property 1: Performance label covers all score ranges** — generate integers in [0, 100], assert label matches thresholds.
    - **Property 2: Average score is bounded** — generate arrays of ScoreRecords, assert result ∈ [0, 100].
    - **Property 6: Score record percentage is consistent** — generate (score, total) pairs, assert percentage = Math.round(score/total * 100).
    - **Property 7: Streak is non-negative** — generate arbitrary ScoreRecord arrays, assert streak ≥ 0.
    - **Validates: Requirements 3.3, 3.4, 5.7, 6.2**

  - [x] 2.2 Write unit tests for scoring edge cases
    - `getPerformanceLabel`: boundary values 0, 59, 60, 79, 80, 100.
    - `computeAverageScore`: empty array returns 0, single record, all-zero scores.
    - `computeStreak`: no records, single day, consecutive days, gap in days.
    - _Requirements: 3.3, 3.4, 6.2_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create shared StudentNavbar component
  - Create `src/components/StudentNavbar.tsx`.
  - Show QuizMaster logo linking to `/student/dashboard` (authed) or `/` (unauthed).
  - Show "Browse Quizzes" link to `/student` and "Join Live Game" button to `/join`.
  - Show student display name and "Sign Out" button when authenticated; show "Login" and "Sign Up" links when not.
  - Implement hamburger menu state for mobile viewports (< 768px) using React state.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.1 Write unit tests for StudentNavbar
    - Renders sign-out when user is authenticated.
    - Renders login/signup links when user is not authenticated.
    - Logo links to `/student/dashboard` when authenticated.
    - _Requirements: 8.1, 8.2, 8.5_

- [x] 5. Create StudentRoute guard component
  - Create `src/components/StudentRoute.tsx`.
  - Redirect unauthenticated users to `/login`.
  - Redirect users with role `"teacher"` to `/teacher`.
  - Render children for authenticated students.
  - _Requirements: 2.5, 2.6_

  - [x] 5.1 Write unit tests for StudentRoute
    - Unauthenticated user → redirects to `/login`.
    - Teacher role → redirects to `/teacher`.
    - Student role → renders children.
    - _Requirements: 2.5, 2.6_

- [x] 6. Create SignupPage
  - Create `src/pages/SignupPage.tsx` with two-panel layout matching existing AuthPage style.
  - Form fields: display name, email, password (min 6 chars client-side), role toggle (student/teacher).
  - On submit: call `AuthContext.signUp(email, password, displayName, role)`, then redirect by role.
  - Google OAuth button: call `AuthContext.signInWithGoogle()`, redirect by role.
  - Show inline error messages; keep form fields populated on error.
  - Disable submit button and show loading indicator while submitting.
  - Include link to `/login` for existing users.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [x] 6.1 Write property test for password validation
    - **Property: Password shorter than 6 characters is rejected client-side**
    - Generate arbitrary strings of length 0–5, assert form shows validation error and does not call signUp.
    - **Validates: Requirements 1.8**

  - [x] 6.2 Write unit tests for SignupPage
    - Renders role toggle with student/teacher options.
    - Shows error when email already in use (mocked Firebase error).
    - Disables submit button while loading.
    - Shows link to login page.
    - _Requirements: 1.3, 1.7, 1.10, 1.11_

- [x] 7. Refactor AuthPage into LoginPage with role-based redirect
  - Create `src/pages/LoginPage.tsx` as a login-only form (remove signup toggle).
  - On successful login: read `userProfile.role` from AuthContext and redirect accordingly.
  - If `userProfile` is null or role is missing, default redirect to `/student/dashboard`.
  - Include link to `/signup` for new users.
  - Keep `/auth` route as a redirect alias to `/login` in `App.tsx`.
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 7.1 Write unit tests for LoginPage redirect behavior
    - Student role → navigates to `/student/dashboard`.
    - Teacher role → navigates to `/teacher`.
    - Missing role → navigates to `/student/dashboard`.
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. Create StudentDashboard page
  - Create `src/pages/StudentDashboard.tsx`.
  - Use `<StudentNavbar />` at the top.
  - Create `src/hooks/useStudentStats.ts` hook that calls `getScoreRecords(uid)` and returns `{ records, streak, averageScore, totalCompleted, loading }`.
  - Render stats row: streak count, total quizzes completed, average score percentage.
  - Render "Continue Learning" section: last 3 `ScoreRecord` entries as cards with quiz title, score, and date.
  - Render "Recommended Quizzes" section: first 4 practice quizzes from the static list as cards.
  - Render empty state when `records.length === 0`.
  - Render "Join Live Game" CTA button linking to `/join`.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 8.1 Write property test for "Continue Learning" ordering
    - **Property 3.6: Continue Learning shows most recently attempted quizzes**
    - Generate arbitrary arrays of ScoreRecords, assert the "continue learning" slice is sorted by `completedAt` descending.
    - **Validates: Requirements 3.6**

  - [x] 8.2 Write unit tests for StudentDashboard
    - Renders empty state when no score records.
    - Renders stats when records exist.
    - Renders "Join Live Game" button.
    - _Requirements: 3.5, 3.8_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Refactor StudentBrowse with StudentNavbar and search
  - Replace the inline top bar in `src/pages/StudentBrowse.tsx` with `<StudentNavbar />`.
  - Add `searchQuery` state and a search input field.
  - Implement `filterQuizzes(quizzes, query)` pure function in `src/utils/quizFilter.ts` that filters by title or description (case-insensitive).
  - Apply filter to the displayed quiz list.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 10.1 Write property tests for quiz search filter
    - **Property 3: Search filter is a subset** — generate quiz arrays and queries, assert all results are in the original list.
    - **Property 4: Search filter is case-insensitive** — generate queries, assert lowercase and uppercase queries return the same results.
    - **Property 5: Empty search restores full list** — generate quiz arrays, assert empty query returns all quizzes.
    - **Validates: Requirements 4.3, 4.4**

  - [x] 10.2 Write unit tests for quiz filter
    - Exact title match returns that quiz.
    - Partial description match returns matching quizzes.
    - No match returns empty array.
    - _Requirements: 4.3_

- [x] 11. Improve StudentQuiz to skip name/email form for authenticated users
  - In `src/pages/StudentQuiz.tsx`, check `useAuth().user` and `userProfile`.
  - If authenticated, skip the name/email entry form and use `userProfile.displayName` and `user.email`.
  - On quiz completion and authenticated: call `saveScoreRecord(uid, { quizId, quizTitle, score, total, percentage, completedAt })`.
  - Add progress indicator showing "Question X of Y".
  - _Requirements: 5.1, 5.2, 5.7, 5.8_

  - [x] 11.1 Write property test for score record percentage
    - **Property 6: Score record percentage is consistent** (already covered in task 2.1 — reference that test here)
    - Ensure `saveScoreRecord` is called with `percentage = Math.round((score / total) * 100)`.
    - **Validates: Requirements 5.7**

- [x] 12. Improve Results display in StudentQuiz
  - Extract the completed-quiz results view into a `<QuizResultsSummary />` component in `src/components/QuizResultsSummary.tsx`.
  - Display score as percentage AND fraction (e.g., "8 / 10").
  - Display `getPerformanceLabel(percentage)` as a badge.
  - Display each question with the student's answer and the correct answer; visually distinguish incorrect answers.
  - Add "Retake Quiz" button (resets quiz state).
  - Add "Browse More Quizzes" link to `/student`.
  - Show "Score saved to your profile" message when authenticated.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 12.1 Write property test for results display
    - **Property 1: Performance label covers all score ranges** (already covered in task 2.1 — reference that test here)
    - **Property: Results display contains both percentage and fraction** — generate (score, total) pairs, assert rendered output contains both representations.
    - **Validates: Requirements 6.1, 6.2**

  - [x] 12.2 Write unit tests for QuizResultsSummary
    - Renders "Excellent" badge for score ≥ 80%.
    - Renders "Keep Practicing" badge for score < 60%.
    - Shows "Score saved" message when authenticated.
    - Shows "Retake Quiz" and "Browse More Quizzes" buttons.
    - _Requirements: 6.2, 6.5, 6.6, 6.7_

- [x] 13. Update JoinGame to pre-fill code from URL and use profile display name
  - In `src/pages/JoinGame.tsx`, read `:code` URL param and pre-fill the game code input.
  - When authenticated, default the player name input to `userProfile.displayName`.
  - _Requirements: 7.3, 7.5_

  - [x] 13.1 Write property test for URL code pre-fill
    - **Property: URL code pre-fills the input** — generate arbitrary code strings, render JoinGame with that route param, assert input value equals the code.
    - **Validates: Requirements 7.3**

- [x] 14. Wire up new routes in App.tsx
  - Add `/signup` route → `<SignupPage />`.
  - Add `/login` route → `<LoginPage />`.
  - Change `/auth` route to `<Navigate to="/login" replace />`.
  - Add `/student/dashboard` route wrapped in `<StudentRoute>` → `<StudentDashboard />`.
  - Update `hideNavbar` logic to also hide the global Navbar on `/student/dashboard`.
  - _Requirements: 1.1, 2.5, 2.6, 3.1_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Property tests use `fast-check` (already installed) with Vitest; run with `npm test`.
- Each property test should run a minimum of 100 iterations.
- Firestore rules should allow `users/{uid}` read/write only for the authenticated user with matching `uid`.
- The existing `AuthPage` at `/auth` is kept as a redirect alias for backward compatibility.
