# Design Document: Student Pages

## Overview

This design covers the student-facing feature set for QuizMaster: a dedicated Signup Page, role-based post-login routing, a Student Dashboard, and the full student quiz flow (browse → play → results). The implementation builds on the existing React/TypeScript/Firebase stack, extending `AuthContext` with Firestore profile support and adding new routes and components.

The key architectural changes are:
- Split the combined `AuthPage` into separate `SignupPage` (`/signup`) and `LoginPage` (`/login`), keeping `/auth` as a redirect alias.
- Add Firestore `users/{uid}` profile documents to store role, display name, and stats.
- Add a `StudentDashboard` page at `/student/dashboard` behind a student-role guard.
- Extend `AuthContext` to expose the user's role and profile, enabling role-based routing.
- Refactor `StudentBrowse` to use the shared student nav layout and support search.
- Persist `Score_Record` documents to Firestore when an authenticated student completes a quiz.

---

## Architecture

```mermaid
graph TD
    A[User visits /signup] --> B[SignupPage]
    B --> C{Role selected}
    C -->|student| D[Create users/{uid} role=student]
    C -->|teacher| E[Create users/{uid} role=teacher]
    D --> F[/student/dashboard]
    E --> G[/teacher]

    H[User visits /login] --> I[LoginPage]
    I --> J{Read role from Firestore}
    J -->|student| F
    J -->|teacher| G
    J -->|no profile| F

    F --> K[StudentDashboard]
    K --> L[QuizBrowser /student]
    K --> M[JoinGame /join]
    L --> N[QuizPlayer /student/quiz/:id]
    N --> O[ResultsPage inline]
    O --> L
    O --> N
```

### Route Map

| Route | Component | Auth Required | Role Guard |
|---|---|---|---|
| `/signup` | `SignupPage` | No | Redirect if already authed |
| `/login` | `LoginPage` | No | Redirect if already authed |
| `/auth` | Redirect → `/login` | No | — |
| `/student/dashboard` | `StudentDashboard` | Yes | student only |
| `/student` | `StudentBrowse` | No | — |
| `/student/quiz/:id` | `StudentQuiz` | No | — |
| `/join` | `JoinGame` | No | — |
| `/join/:code` | `JoinGame` | No | — |
| `/play/:sessionId` | `PlayGame` | No | — |

---

## Components and Interfaces

### New / Modified Components

#### `SignupPage` (`src/pages/SignupPage.tsx`)
- Renders a two-panel layout matching the existing `AuthPage` visual style.
- Form fields: display name, email, password (min 6 chars), role toggle (student/teacher).
- On submit: calls `AuthContext.signUp()`, then `createUserProfile()`, then redirects by role.
- Google OAuth button: calls `AuthContext.signInWithGoogle()`, creates profile if missing.
- Link to `/login` for existing users.

#### `LoginPage` (`src/pages/LoginPage.tsx`)
- Refactored from `AuthPage` — login-only form.
- On success: reads role from Firestore via `AuthContext.userProfile`, redirects by role.
- Link to `/signup` for new users.

#### `StudentDashboard` (`src/pages/StudentDashboard.tsx`)
- Protected by `StudentRoute` guard.
- Sections: welcome header (name + avatar), stats row (streak, quizzes completed, avg score), "Continue Learning" (last 3 attempts), "Recommended Quizzes" (first 4 from practice list), "Join Live Game" CTA.
- Uses `useStudentStats()` hook to load Score_Records from Firestore.

#### `StudentNavbar` (`src/components/StudentNavbar.tsx`)
- Shared top bar for all student pages.
- Logo → `/student/dashboard` (authed) or `/` (unauthed).
- Links: Browse Quizzes, Join Live Game.
- Right side: student display name + sign-out button (if authed), or Login/Signup links.
- Mobile: hamburger menu collapsing nav links at < 768px.

#### `StudentRoute` (`src/components/StudentRoute.tsx`)
- Wraps routes that require authentication AND student role.
- Redirects unauthenticated users to `/login`.
- Redirects teacher-role users to `/teacher`.

#### Modified: `AuthContext` (`src/contexts/AuthContext.tsx`)
- Add `getFirestore` and `doc`/`setDoc`/`getDoc` imports.
- Add `userProfile: UserProfile | null` to context type.
- Add `signInWithGoogle()` method using `GoogleAuthProvider`.
- Add `createUserProfile(uid, data)` helper.
- On `onAuthStateChanged`: fetch `users/{uid}` doc and set `userProfile`.

#### Modified: `StudentBrowse` (`src/pages/StudentBrowse.tsx`)
- Replace inline top bar with `<StudentNavbar />`.
- Add search state and filter logic.
- Show authenticated student name via `useAuth().userProfile`.

#### Modified: `StudentQuiz` (`src/pages/StudentQuiz.tsx`)
- Skip name/email form when `user` is authenticated (use profile data).
- On quiz completion + authenticated: call `saveScoreRecord()`.

---

## Data Models

### Firestore: `users/{uid}`

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  avatarUrl?: string;
  createdAt: string; // ISO timestamp
  streak: number;
  lastActiveDate: string; // ISO date YYYY-MM-DD
}
```

### Firestore: `users/{uid}/scores/{scoreId}`

```typescript
interface ScoreRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;       // correct answers count
  total: number;       // total questions
  percentage: number;  // 0–100
  completedAt: string; // ISO timestamp
}
```

### AuthContext Extended Type

```typescript
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: 'student' | 'teacher') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
```

### Score Utility Functions (`src/utils/scoring.ts` — extend existing)

```typescript
// Derive performance label from percentage
function getPerformanceLabel(percentage: number): 'Excellent' | 'Good' | 'Keep Practicing'

// Compute average score from an array of ScoreRecords
function computeAverageScore(records: ScoreRecord[]): number

// Compute streak from sorted ScoreRecords
function computeStreak(records: ScoreRecord[]): number
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Performance label covers all score ranges

*For any* percentage value in [0, 100], `getPerformanceLabel` SHALL return exactly one of `"Excellent"`, `"Good"`, or `"Keep Practicing"`, and the mapping SHALL be:
- percentage ≥ 80 → `"Excellent"`
- 60 ≤ percentage < 80 → `"Good"`
- percentage < 60 → `"Keep Practicing"`

**Validates: Requirements 6.2**

---

### Property 2: Average score is bounded

*For any* non-empty array of `ScoreRecord` objects where each `percentage` is in [0, 100], `computeAverageScore` SHALL return a value in [0, 100].

**Validates: Requirements 3.4**

---

### Property 3: Search filter is a subset

*For any* quiz list and any search query string, the filtered result SHALL be a subset of the original list (no quiz appears in the result that was not in the original list).

**Validates: Requirements 4.3**

---

### Property 4: Search filter is case-insensitive

*For any* quiz list and any search query `q`, the set of quizzes returned by searching with `q.toLowerCase()` SHALL equal the set returned by searching with `q.toUpperCase()`.

**Validates: Requirements 4.3**

---

### Property 5: Empty search restores full list

*For any* quiz list, filtering with an empty string SHALL return all quizzes in the original list.

**Validates: Requirements 4.4**

---

### Property 6: Score record percentage is consistent

*For any* `ScoreRecord`, `percentage` SHALL equal `Math.round((score / total) * 100)` when `total > 0`.

**Validates: Requirements 5.7**

---

### Property 7: Streak is non-negative

*For any* array of `ScoreRecord` objects (including empty), `computeStreak` SHALL return a value ≥ 0.

**Validates: Requirements 3.3**

---

### Property 8: Role-based redirect is exhaustive

*For any* authenticated user profile with role `"student"` or `"teacher"`, the post-login redirect target SHALL be deterministic: `"student"` → `/student/dashboard`, `"teacher"` → `/teacher`. No other role value SHALL produce a valid redirect (defaults to `/student/dashboard`).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Firebase signup fails (email in use) | Display Firebase error message; keep form fields populated |
| Firebase signup fails (weak password) | Client-side validation before submit; show inline error |
| Google OAuth popup blocked | Show instructional error: "Please allow popups for this site" |
| Firestore profile read fails | Default to role `"student"`; log warning; do not block login |
| Firestore score write fails | Log error silently; show non-blocking toast "Score not saved" |
| Quiz not found (`/student/quiz/:id`) | Show "Quiz not found" state with link back to Quiz_Browser |
| Invalid game code on `/join` | Show inline error; do not navigate |
| Unauthenticated access to `/student/dashboard` | Redirect to `/login` |
| Teacher accessing `/student/dashboard` | Redirect to `/teacher` |

---

## Testing Strategy

### Unit Tests (Vitest)

- `getPerformanceLabel`: boundary values at 60 and 80, values below/above, exact boundaries.
- `computeAverageScore`: empty array, single record, multiple records, all-zero scores.
- `computeStreak`: no records, single day, consecutive days, gap in days.
- Search filter function: empty query, exact match, partial match, case variants, no match.
- `ScoreRecord` percentage consistency: spot-check specific score/total pairs.

### Property-Based Tests (fast-check + Vitest)

Each property test runs a minimum of 100 iterations.

- **Property 1** — `getPerformanceLabel` coverage: generate arbitrary integers in [0, 100], assert label is one of the three valid values and matches the correct threshold.
  - Tag: `Feature: student-pages, Property 1: performance label covers all score ranges`
  - Edge cases included in generator: 0, 60, 80, 100.

- **Property 2** — `computeAverageScore` bounded: generate arrays of ScoreRecords with percentages in [0, 100], assert result ∈ [0, 100].
  - Tag: `Feature: student-pages, Property 2: average score is bounded`

- **Property 3 + 4 + 5** — Search filter subset, case-insensitivity, empty restore: generate random quiz arrays and query strings, assert subset invariant, case equivalence, and empty-query full-restore.
  - Tag: `Feature: student-pages, Property 3: search filter is a subset`
  - Tag: `Feature: student-pages, Property 4: search filter is case-insensitive`
  - Tag: `Feature: student-pages, Property 5: empty search restores full list`

- **Property 6** — Score record percentage: generate (score, total) pairs where 0 ≤ score ≤ total and total > 0, assert percentage equals `Math.round((score / total) * 100)`.
  - Tag: `Feature: student-pages, Property 6: score record percentage is consistent`

- **Property 7** — Streak non-negative: generate arbitrary arrays of ScoreRecords, assert streak ≥ 0.
  - Tag: `Feature: student-pages, Property 7: streak is non-negative`

- **Property 8** — Role redirect exhaustive: generate role values (`"student"`, `"teacher"`, and arbitrary strings), assert redirect target is always one of the two valid paths.
  - Tag: `Feature: student-pages, Property 8: role-based redirect is exhaustive`

### Integration / Component Tests

- `SignupPage`: renders form, shows validation errors, disables button while loading.
- `LoginPage`: redirects to correct dashboard based on mocked `userProfile.role`.
- `StudentRoute`: redirects unauthenticated users to `/login`; redirects teachers to `/teacher`.
- `StudentDashboard`: renders empty state when no score records; renders stats when records exist.
- `StudentNavbar`: shows sign-out when authenticated; shows login/signup when not.
