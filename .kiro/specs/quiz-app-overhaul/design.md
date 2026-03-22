# Design Document: Quiz App Overhaul

## Overview

This overhaul delivers three new pages (My Quizzes, Reports, Library), removes the entire Supabase layer, cleans up dead code and unused dependencies, adds SEO metadata, and fixes all remaining TypeScript/ESLint issues. The application continues to use Firebase for authentication. All data-fetching logic for the new pages uses placeholder/stub implementations that are ready to be wired to a new database once it is chosen.

The design follows the existing visual system: `#FF5C1A` primary orange, `#F5F5F5` page background, white cards with `border-radius: 14px` and `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`, Inter font, Lucide React icons.

---

## Architecture

```
src/
├── App.tsx                    ← adds 3 new lazy routes, removes Supabase imports
├── index.html                 ← SEO meta tags, preconnect, canonical, JSON-LD
├── pages/
│   ├── MyQuizzes.tsx          ← NEW: /teacher/my-quizzes
│   ├── Reports.tsx            ← NEW: /teacher/reports
│   ├── Library.tsx            ← NEW: /library
│   └── ... (existing pages)
├── components/
│   └── TeacherSidebar.tsx     ← update nav links from # to real routes
├── contexts/
│   └── AuthContext.tsx        ← remove Supabase profile dependency
├── lib/
│   ├── database.ts            ← DELETE
│   └── gemini.ts              ← keep (AI generation, no Supabase)
│   └── firebase.ts            ← keep (auth only)
public/
├── robots.txt                 ← NEW
└── sitemap.xml                ← NEW
```

**Removed from project root:**
- `supabase-schema.sql`
- `supabase-schema-fix.sql`
- `function.md`
- `KICKED_SECTION_FIX.md`
- `schema.md`
- `eslint_report.json`
- `eslint_report.txt`

---

## Components and Interfaces

### MyQuizzes Page (`src/pages/MyQuizzes.tsx`)

```
MyQuizzes
├── TeacherSidebar (activeItem="my-quizzes")
└── main
    ├── TopBar (search input, "Create New Quiz" button)
    ├── FilterBar (All | Active | Draft tabs)
    └── QuizGrid
        ├── QuizCard[] (from existing component)
        └── EmptyState (when list is empty)
```

Props / state:
- `quizzes: QuizWithCount[]` — local state, initially empty array (stub for future DB)
- `searchQuery: string` — controlled input
- `filter: 'all' | 'active' | 'draft'` — active filter tab
- `deletingId: string | null` — tracks which quiz is being deleted
- `showDeleteConfirm: string | null` — id of quiz pending delete confirmation

### Reports Page (`src/pages/Reports.tsx`)

```
Reports
├── TeacherSidebar (activeItem="reports")
└── main
    ├── TopBar (title, date range filter)
    ├── StatCards (4 summary cards)
    └── SessionList
        ├── SessionRow[] 
        └── EmptyState
```

Props / state:
- `sessions: QuizSession[]` — local state, initially empty array (stub)
- `dateFilter: '7d' | '30d' | 'all'` — active date range filter

### Library Page (`src/pages/Library.tsx`)

```
Library
├── Navbar (existing public navbar)
└── main
    ├── HeroBar (title, search input)
    ├── SubjectFilterBar (subject category chips)
    └── QuizGrid
        ├── LibraryQuizCard[]
        └── EmptyState
```

Props / state:
- `quizzes: LibraryQuiz[]` — local state, initially empty array (stub)
- `searchQuery: string` — controlled input
- `subjectFilter: string` — active subject filter ('all' or a subject name)

### TeacherSidebar Updates

The `navItems` array in `TeacherSidebar.tsx` currently has `href: '#'` for My Quizzes, Reports, and Library. These are updated to:

```typescript
{ label: 'My Quizzes', icon: BookOpen,      href: '/teacher/my-quizzes' },
{ label: 'Reports',    icon: BarChart2,     href: '/teacher/reports'    },
{ label: 'Library',    icon: Library,       href: '/library'            },
```

Active state detection uses `useLocation()` from react-router-dom matching `location.pathname`.

### AuthContext Updates

Remove Supabase profile dependency:

```typescript
// REMOVE these imports:
import { getProfile, createProfile, type Profile } from '../lib/database';

// REMOVE from AuthContextType interface:
profile: Profile | null;

// REMOVE from state:
const [profile, setProfile] = useState<Profile | null>(null);

// REMOVE from onAuthStateChanged callback:
const userProfile = await getProfile(user.uid);
setProfile(userProfile);

// REMOVE from signUp:
await createProfile(user.uid, email, null);

// REMOVE from context value:
profile,
```

After removal, `AuthContextType` becomes:
```typescript
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}
```

---

## Data Models

### QuizWithCount (existing, in `src/components/QuizCard.tsx`)

```typescript
interface QuizWithCount {
    id: string;
    title: string;
    isActive: boolean;
    questionCount?: number;
}
```

### QuizSession (new, local to Reports page)

```typescript
interface QuizSession {
    id: string;
    quizTitle: string;
    date: string;           // ISO date string
    participantCount: number;
    averageScore: number;   // 0–100
}
```

### LibraryQuiz (new, local to Library page)

```typescript
interface LibraryQuiz {
    id: string;
    title: string;
    subject: string;
    questionCount: number;
}
```

### Removed: Profile (was in `src/lib/database.ts`)

```typescript
// DELETED — no longer needed after Supabase removal
interface Profile {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: My Quizzes search filter narrows results

*For any* list of quizzes and any non-empty search query, every quiz displayed after filtering should have a title that contains the search query (case-insensitive), and no quiz whose title does not contain the query should appear.

**Validates: Requirements 1.3**

### Property 2: My Quizzes status filter is exclusive

*For any* list of quizzes and any status filter value ("active" or "draft"), every quiz displayed should match that status, and no quiz with a different status should appear.

**Validates: Requirements 1.4**

### Property 3: Delete confirmation prevents accidental removal

*For any* quiz list, clicking Delete on a quiz card should not remove the quiz from the list until the confirmation prompt is accepted; if the confirmation is cancelled, the list should remain unchanged.

**Validates: Requirements 1.8**

### Property 4: Reports date filter reduces or preserves session count

*For any* list of sessions, applying a date filter of "7d" or "30d" should return a subset of the sessions returned by "all" — the filtered count should be less than or equal to the unfiltered count.

**Validates: Requirements 2.5**

### Property 5: Library search filter narrows results

*For any* list of library quizzes and any non-empty search query, every quiz displayed after filtering should have a title or subject that contains the search query (case-insensitive).

**Validates: Requirements 3.2**

### Property 6: Library subject filter is exclusive

*For any* list of library quizzes and any non-"all" subject filter, every quiz displayed should have a subject matching the filter value.

**Validates: Requirements 3.3**

### Property 7: Supabase removal leaves zero references

*For any* source file in `src/`, after the Supabase removal task is complete, no file should contain the string `@supabase/supabase-js` or `supabase` as an import path.

**Validates: Requirements 4.1, 4.2**

### Property 8: AuthContext profile removal is complete

*For any* component that previously consumed `profile` from `AuthContext`, after the removal task, that component should compile without referencing the removed `profile` field.

**Validates: Requirements 4.5, 4.6**

---

## Error Handling

### New Pages (My Quizzes, Reports, Library)

Since data fetching is stubbed (empty arrays), error handling is minimal for now:
- Each page renders an empty state component when the data array is empty.
- When a future data-fetching hook is wired in, it should expose an `error` state that renders an inline error banner.

### Delete Confirmation

- Clicking Delete sets `showDeleteConfirm` to the quiz id.
- A modal/inline prompt renders asking "Are you sure?"
- Confirming sets `deletingId` and removes the item from local state.
- Cancelling resets `showDeleteConfirm` to null without modifying the list.

### Supabase Removal

- After deleting `src/lib/database.ts`, TypeScript will surface all import errors immediately.
- Each error must be resolved before the build passes (Requirement 8.1).
- The `.env.example` file must have the Supabase keys removed to avoid confusion.

---

## Testing Strategy

### Unit Tests

Unit tests focus on the pure filter/search logic functions that will be extracted from the new pages:

- `filterQuizzesBySearch(quizzes, query)` — test with empty query, matching query, non-matching query
- `filterQuizzesByStatus(quizzes, status)` — test with 'all', 'active', 'draft'
- `filterSessionsByDate(sessions, range)` — test with '7d', '30d', 'all'
- `filterLibraryQuizzes(quizzes, query, subject)` — test combined search + subject filter

### Property-Based Tests

Property tests use a property-based testing library (e.g., `fast-check` for TypeScript) with a minimum of 100 iterations per property.

Each property test is tagged with:
**Feature: quiz-app-overhaul, Property N: {property_text}**

**Property 1 test**: Generate random quiz arrays and random search strings. Assert every result title contains the query (case-insensitive).
**Feature: quiz-app-overhaul, Property 1: My Quizzes search filter narrows results**

**Property 2 test**: Generate random quiz arrays with mixed active/draft statuses. Assert every result matches the filter status.
**Feature: quiz-app-overhaul, Property 2: My Quizzes status filter is exclusive**

**Property 3 test**: Generate random quiz arrays. Simulate clicking Delete then cancelling. Assert list is unchanged.
**Feature: quiz-app-overhaul, Property 3: Delete confirmation prevents accidental removal**

**Property 4 test**: Generate random session arrays with random dates. Assert filtered count ≤ unfiltered count.
**Feature: quiz-app-overhaul, Property 4: Reports date filter reduces or preserves session count**

**Property 5 test**: Generate random library quiz arrays and search strings. Assert every result title or subject contains the query.
**Feature: quiz-app-overhaul, Property 5: Library search filter narrows results**

**Property 6 test**: Generate random library quiz arrays with mixed subjects. Assert every result subject matches the filter.
**Feature: quiz-app-overhaul, Property 6: Library subject filter is exclusive**

**Property 7 test**: After Supabase removal, grep all `src/` files for `@supabase` — assert zero matches.
**Feature: quiz-app-overhaul, Property 7: Supabase removal leaves zero references**

**Property 8 test**: After AuthContext update, compile the project — assert zero TypeScript errors referencing `profile`.
**Feature: quiz-app-overhaul, Property 8: AuthContext profile removal is complete**

### Dual Approach

- Unit tests catch specific edge cases (empty string search, exact status match, boundary dates).
- Property tests verify universal correctness across all generated inputs.
- Both are required; property tests are marked optional (`*`) in the task list so they can be skipped for a faster MVP.
