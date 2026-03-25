# Implementation Plan: Scalability & SEO Improvements

## Overview

Incremental implementation of scalability and SEO improvements. Tasks are ordered so each step produces working, integrated code. Firebase config files, static assets, and code changes are independent and can be done in any order within each group.

## Tasks

- [x] 1. Update performance config and Vite code splitting
  - [x] 1.1 Set MAX_CONCURRENT_STUDENTS to 1000 in `src/config/performance.ts`
    - Change the single value; leave all other PERFORMANCE_CONFIG, ANTI_CHEAT_CONFIG, and SCORING_CONFIG values unchanged
    - _Requirements: 3.1, 3.2_
  - [x] 1.2 Write unit test for performance config value
    - Assert `PERFORMANCE_CONFIG.MAX_CONCURRENT_STUDENTS === 1000`
    - Assert all other config keys retain their original values
    - _Requirements: 3.1, 3.2_
  - [x] 1.3 Add vendor-firebase, vendor-recharts, and vendor-gemini chunks to `vite.config.ts`
    - Extend the existing `manualChunks` object; preserve the three existing vendor entries
    - `vendor-firebase`: `['firebase/app', 'firebase/auth', 'firebase/firestore']`
    - `vendor-recharts`: `['recharts']`
    - `vendor-gemini`: `['./src/lib/gemini']`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Firebase config files
  - [x] 2.1 Create `firestore.indexes.json` at the project root
    - Define three composite indexes: sessions (hostId ASC + createdAt DESC), answers (sessionId ASC + submittedAt ASC), participants (sessionId ASC + score DESC)
    - Include an empty `fieldOverrides` array
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 Write unit test for firestore.indexes.json
    - Parse the file as JSON and assert it contains exactly 3 index definitions
    - Assert each index has the correct collectionGroup, queryScope, and fields
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.3 Create `firestore.rules` at the project root
    - Implement rules_version '2' with match blocks for quizzes, sessions, participants, and answers collections
    - quizzes: public read, write only by owning teacher (auth.uid == resource.data.teacherId)
    - sessions: public read, create by authenticated users, update/delete by host
    - participants: public read, open create, update/delete by owner
    - answers: authenticated read, open create, update/delete by student
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 2.4 Write property test for security rules owner isolation
    - **Property 2: Security rules allow owner writes only**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
    - Use `@firebase/rules-unit-testing` or parse the rules file and verify the owner-check expressions are present for each collection
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Static SEO assets
  - [x] 3.1 Create `public/sitemap.xml`
    - Include `<url>` entries for: `/`, `/login`, `/signup`, `/student`, `/join`, `/privacy`, `/terms`
    - Each entry must have `<loc>` with fully qualified `https://quizmaster.app` URL, `<lastmod>` with today's date, `<changefreq>`, and `<priority>`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 3.2 Write property test for sitemap completeness
    - **Property 5: Sitemap contains all required URLs**
    - **Validates: Requirements 7.2, 7.3**
    - Parse `public/sitemap.xml` as XML/string; assert all 7 required `<loc>` values are present; assert each `<url>` block contains a `<lastmod>` element
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 3.3 Create `public/robots.txt`
    - Content: `User-agent: *`, `Allow: /`, `Sitemap: https://quizmaster.app/sitemap.xml`
    - _Requirements: 7.5_
  - [x] 3.4 Write unit test for robots.txt
    - Read `public/robots.txt` and assert it contains the Sitemap directive pointing to the production URL
    - _Requirements: 7.5_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Install dependencies and configure app root
  - [x] 5.1 Install `react-helmet-async` and `@tanstack/react-query`
    - Run: `npm install react-helmet-async @tanstack/react-query`
    - _Requirements: 5.1, 9.1_
  - [x] 5.2 Wrap app root in `main.tsx` with HelmetProvider and QueryClientProvider
    - Import `HelmetProvider` from `react-helmet-async`
    - Import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`
    - Create `queryClient` with `defaultOptions: { queries: { staleTime: 60_000, retry: 2 } }`
    - Wrap the `<App />` render with `<HelmetProvider><QueryClientProvider client={queryClient}>...</QueryClientProvider></HelmetProvider>`
    - _Requirements: 5.1, 9.1_
  - [x] 5.3 Write unit test for QueryClient configuration
    - Assert the QueryClient's default staleTime is >= 60000 ms
    - Assert the QueryClient's default retry count is 2
    - _Requirements: 9.2, 9.4_
  - [x] 5.4 Write property test for TanStack Query caching
    - **Property 6: TanStack Query caches results within stale time**
    - **Validates: Requirements 9.2, 9.3**
    - Use QueryClient test utilities; issue the same query key twice within stale time; assert the fetchFn was called exactly once
    - _Requirements: 9.2, 9.3_
  - [x] 5.5 Write property test for TanStack Query retry behavior
    - **Property 7: TanStack Query retries failing queries exactly 2 times**
    - **Validates: Requirements 9.4**
    - Mock a fetchFn that always rejects; assert it is called exactly 3 times (1 initial + 2 retries) before the query enters error state
    - _Requirements: 9.4_

- [x] 6. Add per-route Helmet meta tags
  - [x] 6.1 Add Helmet block to `LandingPage.tsx` (route `/`)
    - Title: "QuizMaster — Create AI Quizzes Instantly"
    - Description: "Transform any text or topic into an engaging quiz in seconds using AI. Free for teachers."
    - _Requirements: 5.2_
  - [x] 6.2 Add Helmet blocks to login and signup pages
    - Login title: "Log In — QuizMaster"; signup title: "Sign Up Free — QuizMaster"
    - Add unique meta descriptions for each
    - _Requirements: 5.3, 5.4_
  - [x] 6.3 Add Helmet blocks to student and join pages
    - Student title: "Student Dashboard — QuizMaster"
    - Join title: "Join a Quiz — QuizMaster"
    - _Requirements: 5.5, 5.6_
  - [x] 6.4 Write property test for unique Helmet titles per route
    - **Property 4: Helmet renders unique titles per route**
    - **Validates: Requirements 5.2–5.8**
    - Render each public page component in isolation using `renderToStaticMarkup` or a test renderer; collect all title strings; assert no two are identical
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 7. Create Privacy and Terms pages
  - [x] 7.1 Create `src/pages/PrivacyPage.tsx`
    - Sections: Introduction, Data We Collect, How We Use Data, Data Retention, Third-Party Services, Your Rights, Contact
    - Add Helmet block: title "Privacy Policy — QuizMaster", unique meta description
    - No authentication required — render without auth context
    - _Requirements: 6.1, 6.3, 6.5, 5.7_
  - [x] 7.2 Create `src/pages/TermsPage.tsx`
    - Sections: Acceptance, Use of Service, User Accounts, Acceptable Use, Intellectual Property, Disclaimer, Limitation of Liability, Changes to Terms, Contact
    - Add Helmet block: title "Terms of Service — QuizMaster", unique meta description
    - No authentication required
    - _Requirements: 6.2, 6.4, 6.5, 5.8_
  - [x] 7.3 Add `/privacy` and `/terms` routes to `src/App.tsx`
    - Import PrivacyPage and TermsPage; add `<Route path="/privacy" element={<PrivacyPage />} />` and `<Route path="/terms" element={<TermsPage />} />`
    - _Requirements: 6.1, 6.2_
  - [x] 7.4 Fix footer links in `LandingPage.tsx`
    - Replace `<a href="#">Privacy Policy</a>` with `<Link to="/privacy">Privacy Policy</Link>` in the Legal column and bottom bar
    - Replace `<a href="#">Terms of Service</a>` with `<Link to="/terms">Terms of Service</Link>` in the Legal column and bottom bar
    - Replace `<a href="#">Cookie Policy</a>` with `<Link to="/privacy">Cookie Policy</Link>`
    - Import `Link` from `react-router-dom` if not already imported
    - _Requirements: 6.6_
  - [x] 7.5 Write unit tests for Privacy and Terms pages
    - Render each page without auth context and assert it does not redirect
    - Assert PrivacyPage contains "Privacy Policy" heading text
    - Assert TermsPage contains "Terms of Service" heading text
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 8. Semantic HTML and Schema.org markup in LandingPage
  - [x] 8.1 Replace non-semantic div headings with h2/h3 tags in `LandingPage.tsx`
    - Section headings ("Powerful Features...", "How It Works", "Loved by Educators", "Simple, Transparent Pricing", "Ready to Transform...") → `<h2>`
    - Feature card titles, step titles, pricing plan names → `<h3>`
    - Preserve all existing inline styles; only change the element type
    - _Requirements: 8.1_
  - [x] 8.2 Enhance the WebApplication JSON-LD object in `LandingPage.tsx`
    - Add `featureList: ['AI quiz generation', 'Real-time leaderboard', 'Student analytics', 'Live quiz sessions']`
    - Add `screenshot: 'https://quizmaster.app/screenshot.png'`
    - Add `author: { '@type': 'Organization', name: 'QuizMaster' }`
    - _Requirements: 8.2_
  - [x] 8.3 Add FAQPage and BreadcrumbList JSON-LD blocks to `LandingPage.tsx`
    - FAQPage: 3 questions covering AI quiz creation, free tier, and how students join
    - BreadcrumbList: single item for the home page
    - Render each as a separate `<script type="application/ld+json">` tag via `dangerouslySetInnerHTML`
    - _Requirements: 8.3, 8.4_
  - [x] 8.4 Write unit tests for Schema.org markup
    - Render LandingPage and assert the WebApplication JSON-LD contains featureList, screenshot, and author fields
    - Assert the FAQPage JSON-LD has at least 3 mainEntity items
    - Assert the BreadcrumbList JSON-LD has at least 1 itemListElement
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 9. Wire TanStack Query into TeacherDashboard quiz fetch
  - [x] 9.1 Wrap the quiz library Firestore fetch in `TeacherDashboard.tsx` with `useQuery`
    - Replace the existing `useState<QuizWithCount[]>([])` + direct Firestore call with `useQuery({ queryKey: ['quizzes', user?.uid], queryFn: () => fetchQuizzesForTeacher(user!.uid), enabled: !!user })`
    - Extract the Firestore fetch logic into a standalone `fetchQuizzesForTeacher(uid: string)` function
    - Handle `isLoading` and `isError` states in the component
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Firebase config files (tasks 2.1, 2.3) require `firebase-tools` installed globally to deploy: `firebase deploy --only firestore`
- `react-helmet-async` and `@tanstack/react-query` must be installed (task 5.1) before tasks 6 and 9 can be implemented
- The `vendor-gemini` manualChunk path `'./src/lib/gemini'` is relative to the project root — verify this resolves correctly in the Vite config
- Property tests use `fast-check` (already in devDependencies) + `vitest`
