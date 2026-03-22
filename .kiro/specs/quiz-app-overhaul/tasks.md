# Implementation Plan: Quiz App Overhaul

## Overview

Implement the quiz app overhaul in six sequential phases: (1) remove Supabase and clean up dead code, (2) fix AuthContext and broken references, (3) add SEO and performance improvements to index.html and vite.config, (4) build the three new pages, (5) wire up routing and sidebar links, (6) final cleanup and verification. Each phase builds on the previous one so the app compiles and runs at every checkpoint.

---

## Tasks

- [x] 1. Remove Supabase layer and dead files
  - [x] 1.1 Delete `src/lib/database.ts`
    - Remove the file entirely
    - _Requirements: 4.2_

  - [x] 1.2 Remove Supabase from `package.json` and clean schema files
    - Remove `@supabase/supabase-js` from `dependencies` in `package.json`
    - Delete `supabase-schema.sql` and `supabase-schema-fix.sql` from project root
    - Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.example`
    - _Requirements: 4.1, 4.3, 4.4, 4.8_

  - [x] 1.3 Remove non-essential root markdown and report files
    - Delete `function.md`, `KICKED_SECTION_FIX.md`, `schema.md`, `eslint_report.json`, `eslint_report.txt` from project root
    - _Requirements: 5.4, 5.6_

- [x] 2. Fix AuthContext and all broken Supabase references
  - [x] 2.1 Update `src/contexts/AuthContext.tsx` to remove Supabase profile dependency
    - Remove import of `getProfile`, `createProfile`, and `Profile` from `../lib/database`
    - Remove `profile: Profile | null` from `AuthContextType` interface
    - Remove `const [profile, setProfile] = useState<Profile | null>(null)` state
    - Remove the `getProfile` call inside `onAuthStateChanged`
    - Remove the `createProfile` call inside `signUp`
    - Remove `profile` and `setProfile` from the context value and Provider
    - _Requirements: 4.5, 4.6_

  - [x] 2.2 Fix any component that references `profile` from AuthContext
    - Search all files in `src/` for `.profile` usage from `useAuth()`
    - Remove or replace each reference so the component compiles without the `profile` field
    - _Requirements: 4.7, 8.5_

  - [x] 2.3 Checkpoint — verify zero TypeScript errors
    - Run `tsc --noEmit` and confirm the project compiles cleanly
    - Ensure all active routes still resolve
    - _Requirements: 8.1, 4.7_

- [x] 3. SEO and performance improvements
  - [x] 3.1 Update `index.html` with SEO meta tags and preconnect hints
    - Set `<title>` to "QuizMaster — Create & Play Interactive Quizzes"
    - Add `<meta name="description">` with app description
    - Add Open Graph tags: `og:title`, `og:description`, `og:type`, `og:url`
    - Add `<meta name="keywords">` with: quiz, interactive quiz, classroom quiz, AI quiz generator, online quiz maker
    - Add `<link rel="canonical">` pointing to production URL
    - Add `<link rel="preconnect">` for `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 6.5_

  - [x] 3.2 Add JSON-LD structured data to `LandingPage.tsx`
    - Add a `<script type="application/ld+json">` block inside the page's `<head>` equivalent (via a `<Helmet>`-style inline script or directly in the JSX) with `@type: "WebApplication"` describing QuizMaster
    - Wrap LandingPage structural regions in semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
    - _Requirements: 7.5, 7.6_

  - [x] 3.3 Add `public/robots.txt` and `public/sitemap.xml`
    - `robots.txt`: allow all crawlers, reference `/sitemap.xml`
    - `sitemap.xml`: list public routes `/`, `/library`, `/auth`, `/join` with `<loc>` entries
    - _Requirements: 7.8, 7.9_

  - [x] 3.4 Update `vite.config.ts` with manual chunk splitting
    - Add `build.rollupOptions.output.manualChunks` to split `react`/`react-dom` into a `vendor-react` chunk, `framer-motion` into `vendor-motion`, and `lucide-react` into `vendor-icons`
    - _Requirements: 6.3_

- [x] 4. Build the three new pages
  - [x] 4.1 Create `src/pages/MyQuizzes.tsx`
    - Implement the page with TeacherSidebar (activeItem="my-quizzes"), top bar with search input and "Create New Quiz" button
    - Add filter tabs: All, Active, Draft
    - Render `QuizCard` components from filtered local state (initial empty array)
    - Implement `filterQuizzesBySearch(quizzes, query)` and `filterQuizzesByStatus(quizzes, status)` as pure functions exported from the file
    - Render empty state with "Create Your First Quiz" CTA when list is empty
    - Implement delete confirmation: clicking Delete sets `showDeleteConfirm` state; a confirmation prompt renders; confirming removes from list, cancelling resets state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 4.2 Write property tests for MyQuizzes filter functions
    - Install `fast-check` as a dev dependency
    - Write property test for `filterQuizzesBySearch`: for any quiz array and non-empty query, every result title contains the query (case-insensitive)
    - Write property test for `filterQuizzesByStatus`: for any quiz array and status filter, every result matches the status
    - Write property test for delete confirmation: simulate cancel, assert list unchanged
    - Tag: **Feature: quiz-app-overhaul, Property 1: My Quizzes search filter narrows results**
    - Tag: **Feature: quiz-app-overhaul, Property 2: My Quizzes status filter is exclusive**
    - Tag: **Feature: quiz-app-overhaul, Property 3: Delete confirmation prevents accidental removal**
    - _Requirements: 1.3, 1.4, 1.8_

  - [x] 4.3 Create `src/pages/Reports.tsx`
    - Implement the page with TeacherSidebar (activeItem="reports"), top bar with title and date range filter (Last 7 days, Last 30 days, All time)
    - Render 4 summary stat cards: Total Sessions, Total Participants, Average Score, Completion Rate (computed from local state)
    - Implement `filterSessionsByDate(sessions, range)` as a pure exported function
    - Render session list rows: quiz title, date, participant count, average score
    - Render empty state when session list is empty
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.4 Write property tests for Reports filter function
    - Write property test for `filterSessionsByDate`: for any session array and any date range, filtered count ≤ unfiltered count
    - Tag: **Feature: quiz-app-overhaul, Property 4: Reports date filter reduces or preserves session count**
    - _Requirements: 2.5_

  - [x] 4.5 Create `src/pages/Library.tsx`
    - Implement the page with the existing `Navbar` component (public, no auth required)
    - Add hero bar with title and search input
    - Add subject category filter chips (All + dynamic list from quiz subjects)
    - Implement `filterLibraryQuizzes(quizzes, query, subject)` as a pure exported function
    - Render library quiz cards: title, subject, question count, "Preview" button
    - Render empty state when list is empty or no results match
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [x] 4.6 Write property tests for Library filter function
    - Write property test for `filterLibraryQuizzes` search: for any quiz array and non-empty query, every result title or subject contains the query
    - Write property test for subject filter: for any quiz array and non-"all" subject, every result subject matches the filter
    - Tag: **Feature: quiz-app-overhaul, Property 5: Library search filter narrows results**
    - Tag: **Feature: quiz-app-overhaul, Property 6: Library subject filter is exclusive**
    - _Requirements: 3.2, 3.3_

- [x] 5. Wire routing and sidebar navigation
  - [x] 5.1 Add new routes to `src/App.tsx`
    - Add lazy imports for `MyQuizzes`, `Reports`, and `Library` page components
    - Add protected route for `/teacher/my-quizzes` → `MyQuizzes`
    - Add protected route for `/teacher/reports` → `Reports`
    - Add public route for `/library` → `Library`
    - Ensure all three are wrapped in `<Suspense>` with the existing `PageLoader` fallback
    - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.2_

  - [x] 5.2 Update `src/components/TeacherSidebar.tsx` nav links
    - Change "My Quizzes" href from `#` to `/teacher/my-quizzes`
    - Change "Reports" href from `#` to `/teacher/reports`
    - Change "Library" href from `#` to `/library`
    - Verify active state detection uses `useLocation().pathname` matching
    - _Requirements: 1.9, 2.7, 3.6, 8.3_

- [x] 6. Remove remaining unused imports and dead code
  - [x] 6.1 Audit and clean unused imports across all `src/` files
    - For each file in `src/pages/` and `src/components/`, remove any import that is not used in the file's JSX or logic
    - Remove any unused state variables or functions identified during the audit
    - _Requirements: 5.1, 5.3_

  - [x] 6.2 Verify no unused npm dependencies remain
    - Check `package.json` dependencies against actual imports in `src/`
    - Remove any dependency not imported anywhere (e.g., if `xlsx` is unused, remove it)
    - _Requirements: 5.2_

- [x] 7. Final checkpoint — compile, lint, and route verification
  - Run `tsc --noEmit` and confirm zero TypeScript errors
  - Run `eslint src/` and confirm zero errors
  - Verify all routes in `src/App.tsx` resolve to their correct page components
  - Confirm no file in `src/` imports from `@supabase/supabase-js` or `../lib/database`
  - Confirm `profile` is not referenced in any component via `useAuth()`
  - _Requirements: 8.1, 8.2, 8.4, 5.5, 4.1_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All new pages use empty local state arrays as stubs — they are ready to be wired to a new database without structural changes
- The Supabase removal (tasks 1–2) must be completed before any other task to avoid cascading TypeScript errors
- Property tests require `fast-check` to be installed as a dev dependency (done in task 4.2)
- Each property test must run a minimum of 100 iterations
