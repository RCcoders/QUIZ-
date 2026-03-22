# Requirements Document

## Introduction

This document defines requirements for a comprehensive overhaul of the QuizMaster application. The overhaul covers four areas: (1) building three new pages — My Quizzes, Reports, and Library; (2) removing all unused code, dead files, and unused dependencies that degrade performance; (3) making the site SEO-friendly with proper meta tags, structured data, and semantic HTML; and (4) completely removing all Supabase database references, APIs, schema files, and the `@supabase/supabase-js` dependency so the codebase is clean and ready for a fresh database integration later.

## Glossary

- **App**: The QuizMaster React + TypeScript + Vite application.
- **My_Quizzes_Page**: A new protected teacher page at `/teacher/my-quizzes` that lists all quizzes owned by the authenticated teacher.
- **Reports_Page**: A new protected teacher page at `/teacher/reports` that shows quiz result analytics and performance data.
- **Library_Page**: A new page at `/library` that allows teachers and students to browse and discover publicly available quizzes.
- **Supabase_Layer**: All code, imports, configuration, schema files, and npm dependency related to `@supabase/supabase-js` and the Supabase backend.
- **Dead_Code**: Any file, import, component, function, or dependency that is not reachable from any active route or used by any active component.
- **SEO_Layer**: The set of HTML `<meta>` tags, Open Graph tags, structured data (JSON-LD), canonical links, and semantic HTML elements that make pages discoverable by search engines.
- **TeacherSidebar**: The shared sidebar component at `src/components/TeacherSidebar.tsx` used across all teacher-facing pages.
- **AuthContext**: The authentication context at `src/contexts/AuthContext.tsx` that provides the current Firebase user.
- **QuizCard**: The reusable quiz card component at `src/components/QuizCard.tsx`.

---

## Requirements

### Requirement 1: My Quizzes Page

**User Story:** As a teacher, I want a dedicated page that lists all my quizzes with search, filter, and management actions, so that I can find and manage my quiz library without leaving the dashboard.

#### Acceptance Criteria

1. THE App SHALL register a protected route at `/teacher/my-quizzes` that renders the My_Quizzes_Page.
2. THE My_Quizzes_Page SHALL display the TeacherSidebar with the "My Quizzes" navigation item in the active state.
3. THE My_Quizzes_Page SHALL display a search input that filters the displayed quiz list by title as the user types.
4. THE My_Quizzes_Page SHALL display filter controls allowing the user to filter quizzes by status (All, Active, Draft).
5. THE My_Quizzes_Page SHALL display each quiz using the QuizCard component showing title, question count, status badge, and action buttons (Edit, Host, Delete).
6. WHEN the quiz list is empty, THE My_Quizzes_Page SHALL display an empty state with a "Create Your First Quiz" call-to-action button that navigates to `/teacher/quiz/new`.
7. THE My_Quizzes_Page SHALL display a "Create New Quiz" button in the top bar that navigates to `/teacher/quiz/new`.
8. WHEN a teacher clicks the Delete action on a quiz card, THE My_Quizzes_Page SHALL display a confirmation prompt before removing the quiz from the list.
9. THE TeacherSidebar "My Quizzes" navigation item SHALL link to `/teacher/my-quizzes`.

### Requirement 2: Reports Page

**User Story:** As a teacher, I want a reports page that shows quiz performance analytics, so that I can understand how my students are doing and identify areas for improvement.

#### Acceptance Criteria

1. THE App SHALL register a protected route at `/teacher/reports` that renders the Reports_Page.
2. THE Reports_Page SHALL display the TeacherSidebar with the "Reports" navigation item in the active state.
3. THE Reports_Page SHALL display summary stat cards showing: Total Sessions, Total Participants, Average Score, and Completion Rate.
4. THE Reports_Page SHALL display a list of past quiz sessions, each showing quiz title, date, participant count, and average score.
5. THE Reports_Page SHALL display a filter control allowing the user to filter sessions by date range (Last 7 days, Last 30 days, All time).
6. WHEN the session list is empty, THE Reports_Page SHALL display an empty state message indicating no quiz sessions have been run yet.
7. THE TeacherSidebar "Reports" navigation item SHALL link to `/teacher/reports`.

### Requirement 3: Library Page

**User Story:** As a teacher or student, I want a library page where I can browse publicly available quizzes by subject or keyword, so that I can discover and use quizzes created by others.

#### Acceptance Criteria

1. THE App SHALL register a public route at `/library` that renders the Library_Page.
2. THE Library_Page SHALL display a search input that filters the displayed quiz list by title or subject as the user types.
3. THE Library_Page SHALL display filter controls allowing the user to filter quizzes by subject category.
4. THE Library_Page SHALL display each quiz in a card format showing title, subject, question count, and a "Preview" button.
5. WHEN the library list is empty or no results match the search, THE Library_Page SHALL display an empty state message.
6. THE TeacherSidebar "Library" navigation item SHALL link to `/library`.
7. THE Library_Page SHALL be accessible to unauthenticated users without requiring sign-in.

### Requirement 4: Remove Supabase Layer

**User Story:** As a developer, I want all Supabase references completely removed from the codebase, so that the project is clean and ready for a new database to be integrated without any legacy conflicts.

#### Acceptance Criteria

1. THE App SHALL NOT import or reference `@supabase/supabase-js` anywhere in the source code after this change.
2. THE App SHALL remove `src/lib/database.ts` which contains the Supabase client and profile functions.
3. THE App SHALL remove `supabase-schema.sql` and `supabase-schema-fix.sql` from the project root.
4. THE App SHALL remove the `@supabase/supabase-js` entry from `package.json` dependencies.
5. THE AuthContext SHALL remove its import of `getProfile` and `createProfile` from `src/lib/database.ts` and the `profile` state that depends on them.
6. THE AuthContext SHALL remove the `profile` field from the `AuthContextType` interface and the context value.
7. WHEN `src/lib/database.ts` is deleted, THE App SHALL compile without TypeScript errors related to missing Supabase imports.
8. THE App SHALL remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.example`.

### Requirement 5: Remove Dead Code and Unused Dependencies

**User Story:** As a developer, I want all unused files, imports, and dependencies removed, so that the bundle size is smaller and the codebase is easier to maintain.

#### Acceptance Criteria

1. THE App SHALL remove any file in `src/` that is not imported by any active route or component.
2. THE App SHALL remove any npm dependency listed in `package.json` that is not imported anywhere in the source code.
3. THE App SHALL remove any unused import statement within each source file.
4. THE App SHALL remove `function.md`, `KICKED_SECTION_FIX.md`, `schema.md`, and any other non-essential markdown files from the project root that are not part of the build or documentation.
5. WHEN dead code is removed, THE App SHALL continue to compile and all active routes SHALL remain functional.
6. THE App SHALL remove the `eslint_report.json` and `eslint_report.txt` files from the project root.

### Requirement 6: Performance Improvements

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that I have a good experience on all devices.

#### Acceptance Criteria

1. THE App SHALL use React `lazy()` and `Suspense` for all page-level components so that each page's JavaScript is only loaded when navigated to.
2. THE App SHALL include the three new pages (My_Quizzes_Page, Reports_Page, Library_Page) in the lazy-loading setup in `src/App.tsx`.
3. THE vite.config.ts SHALL configure manual chunk splitting to separate vendor libraries (react, framer-motion, lucide-react) from application code.
4. THE App SHALL not import any component or library at the top level of `src/App.tsx` that is only used on a single page.
5. THE index.html SHALL include `<link rel="preconnect">` tags for external domains used by the app (Google Fonts, Gemini API domain).

### Requirement 7: SEO Improvements

**User Story:** As a product owner, I want the application's public pages to be discoverable by search engines with accurate metadata, so that users can find the app through organic search.

#### Acceptance Criteria

1. THE index.html SHALL include a `<title>` tag with the value "QuizMaster — Create & Play Interactive Quizzes".
2. THE index.html SHALL include a `<meta name="description">` tag with a concise description of the application.
3. THE index.html SHALL include Open Graph meta tags: `og:title`, `og:description`, `og:type`, and `og:url`.
4. THE index.html SHALL include a `<meta name="keywords">` tag with relevant keywords including "quiz", "interactive quiz", "classroom quiz", "AI quiz generator", "online quiz maker".
5. THE LandingPage SHALL use semantic HTML elements: `<header>`, `<main>`, `<section>`, `<footer>`, and `<nav>` for its primary structural regions.
6. THE LandingPage SHALL include a JSON-LD structured data `<script>` block of type `WebApplication` describing the QuizMaster app.
7. THE index.html SHALL include a `<link rel="canonical">` tag pointing to the production URL.
8. THE App SHALL add a `robots.txt` file in the `public/` directory that allows all crawlers and references the sitemap.
9. THE App SHALL add a `sitemap.xml` file in the `public/` directory listing the public routes: `/`, `/library`, `/auth`, `/join`.

### Requirement 8: Fix Remaining Issues

**User Story:** As a developer, I want all known TypeScript errors, broken imports, and ESLint violations fixed, so that the codebase is in a clean, maintainable state.

#### Acceptance Criteria

1. THE App SHALL compile with zero TypeScript errors after all changes are applied.
2. THE App SHALL have zero ESLint errors (warnings are acceptable) after all changes are applied.
3. THE TeacherSidebar "My Quizzes", "Reports", and "Library" navigation items SHALL link to their correct routes (`/teacher/my-quizzes`, `/teacher/reports`, `/library`) instead of `#` placeholder links.
4. THE App SHALL not reference any environment variable that has been removed (e.g., `VITE_SUPABASE_URL`) in any active source file.
5. IF a component references a `profile` field from `AuthContext` that has been removed, THEN THE App SHALL update that component to remove the reference without breaking its functionality.
