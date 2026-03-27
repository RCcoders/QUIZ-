# Implementation Plan: Student Profile Enhancements

## Overview

Incremental implementation of four interconnected features: Badge Award Engine, Student Library / Notes, AI Adaptive Quiz, and Settings & Profile pages. Each task builds on the previous, ending with full route registration and wiring in App.tsx.

## Tasks

- [x] 1. Extend type definitions and Firestore data model
  - [x] 1.1 Extend `src/types/student.ts` with `Note`, `BadgeRecord`, `BadgeId`, and `UserProfile` additions
    - Add `Note` interface with all fields from the design (`id`, `title`, `subject`, `content`, `authorUid`, `linkedQuizId`, `published`, `createdAt`, `updatedAt`)
    - Add `BadgeId` union type and `BadgeRecord` interface (`badgeId`, `awardedAt`, `quizId`)
    - Extend `UserProfile` with `notificationPrefs` and `defaultSubject` fields (both optional)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.2 Extend `firestore.rules` with `notes` and `users/{uid}/badges` rules
    - Add `notes/{noteId}` rule: read by any authenticated user; write only when `authorUid == request.auth.uid`
    - Add `users/{uid}/badges/{badgeId}` rule: read and write only when `request.auth.uid == uid`
    - _Requirements: 10.4, 10.5_

- [x] 2. Implement Badge_Engine and useBadges hook
  - [x] 2.1 Create `src/lib/badgeEngine.ts` with badge definitions and `evaluateBadges`
    - Define `BADGE_DEFINITIONS` array covering all six badge types: `first_quiz`, `streak_3`, `streak_7`, `perfect_score`, `high_achiever`, `improvement`
    - Implement `evaluateBadgeConditions(scores, streak)` as a pure function returning `BadgeRecord[]` for newly earned badges (checks existing badges to ensure idempotency)
    - Implement `evaluateBadges(uid, scores, streak)` that reads existing badges from `users/{uid}/badges`, calls `evaluateBadgeConditions`, writes new badges with exponential backoff retry (100ms, 200ms, 400ms, max 3 retries), and returns newly awarded badges
    - Export `validateDisplayName(name: string): { valid: boolean; error?: string }` helper (trimmed length 1–50)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property test for badge idempotence (Property 1)
    - **Property 1: Badge idempotence** — evaluating the same scores twice yields no new badges on the second call
    - **Validates: Requirements 1.4**

  - [x] 2.3 Write property test for badge condition correctness (Property 2)
    - **Property 2: Badge condition correctness** — awarded set matches exactly the badges whose conditions are satisfied
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.4 Write unit tests for `badgeEngine.ts` (`src/lib/badgeEngine.test.ts`)
    - One passing + one failing case per badge type
    - Idempotency: calling twice with same scores produces no duplicate writes (mock Firestore)
    - Retry logic: mock Firestore to fail twice then succeed; assert badge is eventually written
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 2.5 Create `src/hooks/useBadges.ts`
    - Subscribe to `users/{uid}/badges` with `onSnapshot`; expose `{ badges: BadgeRecord[], loading, error }`
    - Return empty array and no error when `uid` is undefined
    - _Requirements: 2.1, 2.5_

- [x] 3. Implement badge display on StudentDashboard
  - [x] 3.1 Create `src/components/BadgeList.tsx`
    - Render a responsive grid of badge cards, each showing icon (emoji from definition), name, and formatted `awardedAt` date
    - Accept `badges: BadgeRecord[]` prop; render empty-state message when array is empty
    - Render loading skeleton (3 placeholder cards) when `loading` prop is true
    - _Requirements: 2.2, 2.4, 2.5_

  - [x] 3.2 Create `src/components/ToastNotification.tsx`
    - Render a fixed-position toast with badge icon, name, and description
    - Auto-dismiss after 4 seconds; accept `onDismiss` callback
    - _Requirements: 2.3_

  - [x] 3.3 Integrate `BadgeList` and toast into `src/pages/StudentDashboard.tsx`
    - Call `useBadges(user?.uid)` and render `<BadgeList>` in a new "My Badges" section below the stats row
    - After `saveScoreRecord` resolves, call `evaluateBadges` and show `<ToastNotification>` for each newly awarded badge
    - Pass `loading` from `useBadges` to `BadgeList` for skeleton rendering
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Write unit tests for `BadgeList` component
    - Renders correct badge count, icons, and dates from mock data
    - Renders empty-state when badges array is empty
    - Renders loading skeleton when `loading` is true
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 4. Checkpoint — Ensure all badge-related tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement note filtering utility and useNotes hook
  - [x] 5.1 Create `src/utils/noteFilter.ts` with `filterNotes(notes, query, subject)` pure function
    - Filter by `subject` when not `'all'` (exact match)
    - Filter by `query` with case-insensitive substring match on `title` and `subject`
    - Return filtered subset (never adds items)
    - _Requirements: 3.3, 3.4_

  - [x] 5.2 Write property test for note filter correctness (Property 3)
    - **Property 3: Note filter correctness** — every result matches the active subject and query
    - **Validates: Requirements 3.3, 3.4**

  - [x] 5.3 Write property test for note filter subset (Property 4)
    - **Property 4: Note filter is a subset** — result length ≤ input length for all inputs
    - **Validates: Requirements 3.3, 3.4**

  - [x] 5.4 Write unit tests for `noteFilter.ts` (`src/utils/noteFilter.test.ts`)
    - Empty query + "all" subject returns all notes
    - Subject filter excludes non-matching notes
    - Case-insensitive search on title and subject
    - Combined filter + search
    - _Requirements: 3.3, 3.4_

  - [x] 5.5 Create `src/hooks/useNotes.ts`
    - Query `notes` collection; accept optional `authorUid` filter for teacher view
    - Expose `{ notes: Note[], loading, error }`
    - _Requirements: 3.2, 5.2_

- [x] 6. Implement Student Library pages
  - [x] 6.1 Create `src/components/NoteCard.tsx`
    - Display note `title`, `subject` chip, and truncated `content` preview
    - Accept `note: Note` and `onClick` props
    - _Requirements: 3.2, 3.5_

  - [x] 6.2 Create `src/pages/StudentLibrary.tsx`
    - Call `useNotes()` filtered to `published: true`; render `NoteCard` grid
    - Subject filter chips (derive unique subjects from notes) + search input wired to `filterNotes`
    - Loading skeleton (3 placeholder cards) while `loading` is true
    - Empty-state message when filtered result is empty
    - Navigate to `/student/library/:noteId` on card click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 6.3 Create `src/pages/NoteDetail.tsx`
    - Fetch single note by `noteId` param from Firestore; render `title`, `subject`, `content`, and `createdAt`
    - Show "Practice Quiz" button → `/student/quiz/:linkedQuizId` when `linkedQuizId` is set
    - Show "Adaptive Practice" button → `/student/adaptive-quiz?noteId=:noteId` when no `linkedQuizId`
    - Breadcrumb back to `/student/library`
    - "Note not found" error state with back link when document does not exist
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.4 Write unit tests for `StudentLibrary` and `NoteDetail`
    - `StudentLibrary` renders notes, applies subject filter, navigates to detail
    - `NoteDetail` shows "Practice Quiz" button when `linkedQuizId` is set
    - `NoteDetail` shows "Adaptive Practice" button when `linkedQuizId` is null
    - `NoteDetail` shows "Note not found" when document does not exist
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 4.5_

- [x] 7. Implement Teacher Library note management
  - [x] 7.1 Extend `src/pages/Library.tsx` (teacher library) with note list and note form
    - Call `useNotes({ authorUid: user.uid })` to fetch teacher's own notes
    - Render a note list showing `title`, `subject`, published status toggle, and delete button
    - Add a "New Note" form with fields: `title` (required), `subject` (required), `content` (required), `linkedQuizId` (optional)
    - On submit: write new `Note` to Firestore with `published: false`, `authorUid`, `createdAt`, `updatedAt`
    - Validate: show inline error and block Firestore write when `title` or `content` is empty
    - Publish toggle: call Firestore `updateDoc` to flip `published` field
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Write unit tests for teacher library note management
    - Submitting empty title shows validation error, does not write to Firestore
    - Submitting empty content shows validation error, does not write to Firestore
    - Valid submission writes note with `published: false`
    - Publish toggle calls `updateDoc` with correct payload
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 8. Implement adaptive quiz service
  - [x] 8.1 Create `src/lib/adaptiveQuiz.ts` with `buildPerformanceProfile` and `generateAdaptiveQuestions`
    - `buildPerformanceProfile(scores, subject)`: filter scores by subject, compute average percentage per difficulty tier, set `dominantWeakDifficulty` to the tier with the lowest average (default `'medium'` when no scores exist), derive `weakTopics` from question text of incorrect answers
    - `generateAdaptiveQuestions(profile, noteContent, numQuestions)`: construct a Gemini prompt that weights question count toward `dominantWeakDifficulty`; call Gemini API; return `GeneratedQuestion[]` (5–20 questions)
    - Reuse the existing `GEMINI_API_URL` and fetch pattern from `src/lib/gemini.ts`
    - _Requirements: 6.1, 6.2_

  - [x] 8.2 Write property test for adaptive question count bounds (Property 5)
    - **Property 5: Adaptive question count bounds** — returned array length is between 5 and 20 inclusive
    - **Validates: Requirements 6.2**

  - [x] 8.3 Write property test for adaptive difficulty weighting (Property 6)
    - **Property 6: Adaptive difficulty weighting** — dominant weak difficulty tier has the highest question count in the result
    - **Validates: Requirements 6.1, 6.2**

  - [x] 8.4 Write property test for performance profile weak difficulty derivation (Property 9)
    - **Property 9: Performance profile weak difficulty derivation** — `dominantWeakDifficulty` equals the difficulty tier with the lowest average percentage
    - **Validates: Requirements 6.1**

  - [x] 8.5 Write unit tests for `adaptiveQuiz.ts` (`src/lib/adaptiveQuiz.test.ts`)
    - No scores → defaults to `'medium'` difficulty, empty `weakTopics`
    - All easy scores low → `dominantWeakDifficulty: 'easy'`
    - Mixed scores → correct dominant difficulty selected
    - _Requirements: 6.1_

- [x] 9. Implement AdaptiveQuiz page
  - [x] 9.1 Create `src/pages/AdaptiveQuiz.tsx`
    - Read `noteId` or `subject` from query params; fetch note content from Firestore if `noteId` provided
    - Call `useStudentStats` to get score history; call `buildPerformanceProfile` then `generateAdaptiveQuestions`
    - Apply 15-second `AbortController` timeout on Gemini call
    - Loading state while generating; error state with "Try Again" button and fallback link to `/student` on failure
    - Reuse `StudentQuiz` question-rendering logic (or inline equivalent) to run the quiz
    - On completion: call `saveScoreRecord` to `users/{uid}/scores`; call `evaluateBadges`; display results summary
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [x] 9.2 Implement adaptive quiz results summary in `AdaptiveQuiz.tsx`
    - Show total score, percentage, per-question correctness, and correct answer for each incorrect response
    - Identify top 2 incorrect topics; display "Study this topic" link to matching note in Student Library if found
    - When score < 60%, show motivational message and "Retry" button that re-triggers generation for the same subject
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.3 Write property test for score record round-trip (Property 7)
    - **Property 7: Score record round-trip** — saved `ScoreRecord` fields (`quizId`, `score`, `total`, `percentage`) match what is read back from Firestore
    - **Validates: Requirements 6.6**

  - [x] 9.4 Write unit tests for `AdaptiveQuiz` page
    - Renders loading state while generating
    - Renders error state + "Try Again" button on API failure
    - On success, renders quiz questions
    - Results summary shows "Retry" button when score < 60%
    - _Requirements: 6.4, 6.5, 7.1, 7.3_

- [x] 10. Checkpoint — Ensure all library and adaptive quiz tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement ProfileEditor component and Settings pages
  - [x] 11.1 Create `src/components/ProfileEditor.tsx`
    - Accept `role: 'student' | 'teacher'` and optional `onSaved` callback
    - Fields: `displayName` (validated: trimmed length 1–50), `avatarUrl` (URL or empty string)
    - On submit: call `updateProfile` (Firebase Auth) then `setDoc` (Firestore `users/{uid}`) sequentially; show success confirmation or inline error
    - Show validation error and block Firebase calls when `displayName` is empty or > 50 chars
    - _Requirements: 8.2, 8.3, 8.4, 9.2, 9.3_

  - [x] 11.2 Write property test for profile display name validation (Property 8)
    - **Property 8: Profile display name validation** — `validateDisplayName` returns `valid: true` iff trimmed length is 1–50
    - **Validates: Requirements 8.2, 8.4, 9.2**

  - [x] 11.3 Write unit tests for `ProfileEditor`
    - Submitting empty `displayName` shows validation error, does not call Firebase
    - Submitting 51-character `displayName` shows validation error
    - Valid submission calls `updateProfile` and `setDoc`
    - Firebase error shows inline error message
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 11.4 Create `src/pages/StudentSettings.tsx`
    - Render `<ProfileEditor role="student" />`
    - "Change Password" section: current password + new password (min 8 chars) fields; call `reauthenticateWithCredential` then `updatePassword`; show success or "Incorrect current password" error
    - "Notification Preferences" section: toggle for `notificationPrefs.newQuizInSubject`; persist to `users/{uid}` Firestore document on change
    - _Requirements: 8.1, 8.5, 8.6, 8.7, 8.8_

  - [x] 11.5 Create `src/pages/TeacherSettings.tsx`
    - Render `<ProfileEditor role="teacher" />`
    - Same "Change Password" section as `StudentSettings`
    - "Class Preferences" section: `defaultSubject` text field (max 50 chars); persist to `users/{uid}` Firestore document on save
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 11.6 Write unit tests for `StudentSettings` and `TeacherSettings`
    - Valid password change calls `reauthenticateWithCredential` and `updatePassword`
    - Wrong current password shows "Incorrect current password" error
    - Notification toggle persists to Firestore
    - `defaultSubject` field persists to Firestore (teacher)
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 9.5_

- [x] 12. Update navigation components
  - [x] 12.1 Update `src/components/StudentNavbar.tsx` to add Library and Settings links
    - Add `{ to: '/student/library', label: 'Library', icon: Library }` to `navLinks` array
    - Make the user avatar/initials circle a `Link` to `/student/settings` instead of a plain `div`
    - Add Library and Settings links to the mobile menu
    - _Requirements: 3.1, 8.1_

  - [x] 12.2 Update `src/components/TeacherSidebar.tsx` to add Settings link
    - Add `{ icon: Settings, label: 'Settings', path: '/teacher/settings' }` to `navItems` array
    - _Requirements: 9.1_

  - [x] 12.3 Write unit tests for updated navigation
    - `StudentNavbar` renders Library link pointing to `/student/library`
    - `StudentNavbar` avatar links to `/student/settings`
    - `TeacherSidebar` renders Settings link pointing to `/teacher/settings`
    - _Requirements: 3.1, 8.1, 9.1_

- [x] 13. Register all new routes in App.tsx
  - [x] 13.1 Add lazy imports and `<Route>` entries for all new pages in `src/App.tsx`
    - Lazy-import: `StudentLibrary`, `NoteDetail`, `AdaptiveQuiz`, `StudentSettings`, `TeacherSettings`
    - Add student routes (all wrapped in `<StudentRoute>`): `/student/library`, `/student/library/:noteId`, `/student/adaptive-quiz`, `/student/settings`
    - Add teacher route (wrapped in `<ProtectedRoute>`): `/teacher/settings`
    - Extend `hideNavbar` condition to include `/student/library`, `/student/settings`, `/teacher/settings`
    - _Requirements: 3.1, 4.1, 6.3, 8.1, 9.1_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** with a minimum of 100 iterations per property
- Each property test references its property number and the requirements clause it validates
- Checkpoints at tasks 4, 10, and 14 ensure incremental validation before moving to the next feature area
- `evaluateBadges` is always called asynchronously after `saveScoreRecord` and never blocks quiz completion
