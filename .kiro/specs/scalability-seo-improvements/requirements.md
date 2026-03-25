# Requirements Document

## Introduction

QuizMaster is a React + TypeScript + Vite application backed by Firebase/Firestore, deployed on Vercel. This spec covers two areas of improvement: (1) scalability to support 1,000 concurrent students in live quiz sessions, and (2) SEO improvements to rank on Google for educational keywords. All changes are additive and must not break existing functionality.

## Glossary

- **App**: The QuizMaster React/TypeScript/Vite frontend
- **Firestore**: Google Cloud Firestore, the primary database
- **Security_Rules**: Firestore security rules controlling read/write access per collection
- **Helmet**: The `react-helmet-async` library for injecting per-route HTML `<head>` metadata
- **Sitemap**: An XML file listing public URLs for search engine crawling
- **Chunk**: A separately bundled JavaScript file produced by Vite code-splitting
- **TanStack_Query**: `@tanstack/react-query` for server-state caching and deduplication
- **Privacy_Page**: Dedicated `/privacy` route rendering the privacy policy
- **Terms_Page**: Dedicated `/terms` route rendering the terms of service
- **Schema_Markup**: JSON-LD structured data embedded in page HTML for search engine rich results
- **LCP**: Largest Contentful Paint — a Core Web Vitals metric targeting < 2.5 s
- **CLS**: Cumulative Layout Shift — a Core Web Vitals metric targeting < 0.1

---

## Requirements

### Requirement 1: Firestore Composite Indexes

**User Story:** As a developer, I want composite Firestore indexes defined in a `firestore.indexes.json` file, so that compound queries perform efficiently at scale with 1,000 concurrent students.

#### Acceptance Criteria

1. THE App SHALL include a `firestore.indexes.json` file at the project root defining all composite indexes required by the application's Firestore queries.
2. WHEN `firestore.indexes.json` is deployed, THE App SHALL support compound queries on the `sessions` collection filtering by `hostId` and ordering by `createdAt` descending.
3. WHEN `firestore.indexes.json` is deployed, THE App SHALL support compound queries on the `answers` collection filtering by `sessionId` and ordering by `submittedAt` ascending.
4. WHEN `firestore.indexes.json` is deployed, THE App SHALL support compound queries on the `participants` collection filtering by `sessionId` and ordering by `score` descending.

---

### Requirement 2: Firestore Security Rules

**User Story:** As a developer, I want Firestore security rules in a `firestore.rules` file, so that database access is restricted to authorized users and the app is protected from unauthorized reads and writes.

#### Acceptance Criteria

1. THE App SHALL include a `firestore.rules` file at the project root defining access control for all Firestore collections.
2. WHEN an unauthenticated user attempts to write to any protected collection, THE Security_Rules SHALL deny the write request.
3. WHEN an authenticated teacher attempts to read or write their own quiz documents, THE Security_Rules SHALL allow the operation.
4. WHEN an authenticated teacher attempts to write to another teacher's quiz documents, THE Security_Rules SHALL deny the write request.
5. WHEN a student participant attempts to write their own answer document, THE Security_Rules SHALL allow the write.
6. WHEN a student participant attempts to write another participant's answer document, THE Security_Rules SHALL deny the write.
7. THE Security_Rules SHALL allow public read access to active session documents so students can join without authentication.

---

### Requirement 3: Performance Configuration Update

**User Story:** As a developer, I want `MAX_CONCURRENT_STUDENTS` raised to 1,000 in `src/config/performance.ts`, so that the application's internal limits reflect the target scale.

#### Acceptance Criteria

1. THE App SHALL set `MAX_CONCURRENT_STUDENTS` to `1000` in `src/config/performance.ts`.
2. WHEN `MAX_CONCURRENT_STUDENTS` is updated, THE App SHALL retain all other existing values in `PERFORMANCE_CONFIG` unchanged.

---

### Requirement 4: Vite Code Splitting

**User Story:** As a developer, I want Firebase, Recharts, and Gemini-related modules split into separate Vite chunks, so that initial page load time is reduced for users who do not immediately need those libraries.

#### Acceptance Criteria

1. THE App SHALL configure `vite.config.ts` `manualChunks` to place all Firebase SDK modules into a `vendor-firebase` chunk.
2. THE App SHALL configure `vite.config.ts` `manualChunks` to place Recharts modules into a `vendor-recharts` chunk.
3. THE App SHALL configure `vite.config.ts` `manualChunks` to place `src/lib/gemini.ts` into a `vendor-gemini` chunk.
4. WHEN the build runs, THE App SHALL produce separate bundle files for each configured chunk without breaking existing lazy-loaded routes.

---

### Requirement 5: Per-Route Meta Tags

**User Story:** As a developer, I want each public route to have a unique HTML title and meta description, so that search engines index each page with accurate keyword-rich metadata.

#### Acceptance Criteria

1. THE App SHALL install and configure `react-helmet-async` with a `HelmetProvider` wrapping the application root in `main.tsx`.
2. WHEN a user navigates to `/`, THE Helmet SHALL render a title containing "QuizMaster" and a meta description for the AI quiz creation platform.
3. WHEN a user navigates to `/login`, THE Helmet SHALL render a unique title and meta description for the login page.
4. WHEN a user navigates to `/signup`, THE Helmet SHALL render a unique title and meta description for the signup page.
5. WHEN a user navigates to `/student`, THE Helmet SHALL render a unique title and meta description for the student browse page.
6. WHEN a user navigates to `/join`, THE Helmet SHALL render a unique title and meta description for the join game page.
7. WHEN a user navigates to `/privacy`, THE Helmet SHALL render a unique title and meta description for the privacy policy page.
8. WHEN a user navigates to `/terms`, THE Helmet SHALL render a unique title and meta description for the terms of service page.

---

### Requirement 6: Privacy and Terms Pages

**User Story:** As a user, I want dedicated `/privacy` and `/terms` pages, so that I can read the privacy policy and terms of service, and search engines can index these legally required pages.

#### Acceptance Criteria

1. THE App SHALL include a `PrivacyPage` component accessible at the `/privacy` route.
2. THE App SHALL include a `TermsPage` component accessible at the `/terms` route.
3. WHEN a user visits `/privacy`, THE Privacy_Page SHALL display privacy policy content covering data collection, usage, and retention.
4. WHEN a user visits `/terms`, THE Terms_Page SHALL display terms of service content covering acceptable use and liability.
5. WHEN a user visits `/privacy` or `/terms`, THE App SHALL render the page without requiring authentication.
6. THE App SHALL update the footer links in `LandingPage.tsx` to navigate to `/privacy` and `/terms` using React Router `Link` components instead of placeholder `href="#"` anchors.

---

### Requirement 7: Sitemap and Robots

**User Story:** As a developer, I want a `sitemap.xml` and `robots.txt` in the `public/` directory, so that search engines can discover and crawl all public pages.

#### Acceptance Criteria

1. THE App SHALL include a `sitemap.xml` file in the `public/` directory that is served at the root URL.
2. WHEN `sitemap.xml` is present, THE App SHALL include entries for `/`, `/login`, `/signup`, `/student`, `/join`, `/privacy`, and `/terms`.
3. WHEN `sitemap.xml` is present, THE App SHALL set the `<loc>` element of each entry to the fully qualified production URL `https://quizmaster.app`.
4. WHEN `sitemap.xml` is present, THE App SHALL include a `<lastmod>` element for each entry.
5. THE App SHALL include a `robots.txt` file in `public/` that references the sitemap URL and allows all crawlers.

---

### Requirement 8: Semantic HTML and Schema Markup

**User Story:** As a developer, I want the landing page to use semantic HTML headings and enhanced Schema.org JSON-LD markup, so that search engines correctly understand the page structure and display rich results.

#### Acceptance Criteria

1. THE App SHALL replace non-semantic heading elements in `LandingPage.tsx` with proper `<h2>` and `<h3>` tags for section headings and feature titles.
2. THE App SHALL add `featureList`, `screenshot`, and `author` fields to the existing `WebApplication` JSON-LD object in `LandingPage.tsx`.
3. THE App SHALL add a `FAQPage` JSON-LD block to `LandingPage.tsx` covering at least three common user questions.
4. THE App SHALL add a `BreadcrumbList` JSON-LD block to `LandingPage.tsx` for the home page breadcrumb.

---

### Requirement 9: TanStack Query Caching

**User Story:** As a developer, I want TanStack Query wrapping Firestore reads in the quiz library, so that repeated queries are served from cache and reduce Firestore read costs at scale.

#### Acceptance Criteria

1. THE App SHALL install `@tanstack/react-query` and configure a `QueryClient` with a `QueryClientProvider` wrapping the application root in `main.tsx`.
2. WHEN a Firestore read for quiz library data is performed, THE TanStack_Query SHALL cache the result with a stale time of at least 60 seconds.
3. WHEN a cached Firestore query result is available and not stale, THE TanStack_Query SHALL return the cached result without issuing a new Firestore read.
4. IF a Firestore read fails, THEN THE TanStack_Query SHALL retry the request up to 2 times before surfacing an error to the component.
