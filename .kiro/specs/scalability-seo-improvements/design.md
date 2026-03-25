# Design Document: Scalability and SEO Improvements

## Overview

Technical design for scalability and SEO improvements in QuizMaster (React 19 + TypeScript + Vite 7, Firebase 12/Firestore, Vercel). All changes are additive — no existing architecture is removed. The two workstreams are independent and can be implemented in parallel.

## Architecture

Affected files by area:

| Area | Files |
|---|---|
| Firebase config | `firestore.indexes.json`, `firestore.rules` (project root) |
| Vite config | `vite.config.ts` |
| App entry | `src/main.tsx` |
| Pages | `src/pages/LandingPage.tsx`, new `src/pages/PrivacyPage.tsx`, new `src/pages/TermsPage.tsx` |
| Router | `src/App.tsx` (new `/privacy`, `/terms` routes) |
| Static assets | `public/sitemap.xml`, `public/robots.txt` |
| Config | `src/config/performance.ts` |

## Components and Interfaces

### 1. Firestore Composite Indexes

`firestore.indexes.json` is a Firebase CLI configuration file deployed with `firebase deploy --only firestore:indexes`. Based on the app's query patterns in `GameHost.tsx` and `TeacherDashboard.tsx`:

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "hostId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "answers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sessionId", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "participants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sessionId", "order": "ASCENDING" },
        { "fieldPath": "score", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 2. Firestore Security Rules

`firestore.rules` uses Firebase Security Rules v2. Access model:

- **quizzes**: public read; write only by owning teacher (`request.auth.uid == resource.data.teacherId`)
- **sessions**: public read (students join without auth); create/update/delete only by host (`request.auth.uid == resource.data.hostId`)
- **participants**: public read (leaderboard); create open (students join); update/delete only by the participant themselves (`request.auth.uid == resource.data.uid`)
- **answers**: authenticated read; create open; update/delete only by the answering student

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == resource.data.teacherId;
      allow create: if request.auth != null;
    }

    match /sessions/{sessionId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && request.auth.uid == resource.data.hostId;
    }

    match /participants/{participantId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null
        && request.auth.uid == resource.data.uid;
    }

    match /answers/{answerId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null
        && request.auth.uid == resource.data.studentId;
    }
  }
}
```

### 3. Performance Config

Single-line change in `src/config/performance.ts`:

```typescript
MAX_CONCURRENT_STUDENTS: 1000,  // was 100
```

All other `PERFORMANCE_CONFIG`, `ANTI_CHEAT_CONFIG`, and `SCORING_CONFIG` values remain unchanged.

### 4. Vite Code Splitting

Extend `vite.config.ts` `manualChunks` to add three new vendor chunks. The existing `vendor-react`, `vendor-motion`, and `vendor-icons` chunks are preserved:

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom'],
  'vendor-motion': ['framer-motion'],
  'vendor-icons': ['lucide-react'],
  'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  'vendor-recharts': ['recharts'],
  'vendor-gemini': ['./src/lib/gemini'],
},
```

This reduces the initial bundle by deferring ~180 KB (Firebase), ~220 KB (Recharts), and the Gemini client until they are actually needed.

### 5. react-helmet-async

Install `react-helmet-async`. Wrap the app root in `main.tsx` with `HelmetProvider`. Each public page component adds a `<Helmet>` block.

**`main.tsx` changes:**
```tsx
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

root.render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </HelmetProvider>
);
```

**Meta copy per route:**

| Route | Title | Description |
|---|---|---|
| `/` | QuizMaster — Create AI Quizzes Instantly | Transform any text or topic into an engaging quiz in seconds using AI. Free for teachers. |
| `/login` | Log In — QuizMaster | Sign in to your QuizMaster account to manage quizzes and view student results. |
| `/signup` | Sign Up Free — QuizMaster | Create a free QuizMaster account and start generating AI-powered quizzes in minutes. |
| `/student` | Student Dashboard — QuizMaster | View your quiz history, scores, and streaks on your QuizMaster student dashboard. |
| `/join` | Join a Quiz — QuizMaster | Enter a game code to join a live QuizMaster quiz session. |
| `/privacy` | Privacy Policy — QuizMaster | Read how QuizMaster collects, uses, and protects your personal data. |
| `/terms` | Terms of Service — QuizMaster | Read the QuizMaster terms of service and acceptable use policy. |

### 6. Privacy and Terms Pages

Two new page components with minimal but legally sufficient content. Both are unauthenticated public routes.

**`src/pages/PrivacyPage.tsx`** — sections: Introduction, Data We Collect, How We Use Data, Data Retention, Third-Party Services, Your Rights, Contact.

**`src/pages/TermsPage.tsx`** — sections: Acceptance, Use of Service, User Accounts, Acceptable Use, Intellectual Property, Disclaimer, Limitation of Liability, Changes to Terms, Contact.

Both pages share a consistent layout: sticky header with QuizMaster logo, scrollable content area, footer with links back to `/` and to the other legal page.

**Footer fix in `LandingPage.tsx`:** Replace all `<a href="#">` anchors in the Legal column and bottom bar with React Router `<Link>` components pointing to `/privacy` and `/terms`. Other footer links (Product, Company) can remain as `href="#"` since those pages don't exist yet.

**Router additions in `src/App.tsx`:**
```tsx
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
```

### 7. Sitemap and Robots

**`public/sitemap.xml`** — static file, manually maintained. Uses `lastmod` set to the current date at time of generation:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://quizmaster.app/</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://quizmaster.app/login</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://quizmaster.app/signup</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://quizmaster.app/student</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://quizmaster.app/join</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://quizmaster.app/privacy</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://quizmaster.app/terms</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

**`public/robots.txt`:**
```
User-agent: *
Allow: /
Sitemap: https://quizmaster.app/sitemap.xml
```

### 8. Semantic HTML and Schema Markup

**Semantic headings in `LandingPage.tsx`:**
- "Powerful Features for Modern Educators" → `<h2>`
- "How It Works" → `<h2>`
- "Loved by Educators" → `<h2>`
- "Simple, Transparent Pricing" → `<h2>`
- "Ready to Transform Your Classroom?" → `<h2>`
- Feature card titles (AI Generation, Real-time Insights, Live Competition) → `<h3>`
- How It Works step titles → `<h3>`
- Pricing plan names → `<h3>`

Currently these are rendered as `<div>` or `<h3>` with inline `font-size` styles. The visual appearance does not change — only the HTML element type changes.

**Enhanced JSON-LD in `LandingPage.tsx`:**

Extend the existing `WebApplication` object and add two new schemas:

```typescript
const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'QuizMaster',
  url: 'https://quizmaster.app/',
  description: 'Create, host, and play interactive quizzes in real time. AI-powered quiz generation for teachers and students.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  featureList: ['AI quiz generation', 'Real-time leaderboard', 'Student analytics', 'Live quiz sessions'],
  screenshot: 'https://quizmaster.app/screenshot.png',
  author: { '@type': 'Organization', name: 'QuizMaster' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I create a quiz with AI?',
      acceptedAnswer: { '@type': 'Answer', text: 'Paste any text, URL, or topic into QuizMaster and the AI generates up to 20 questions in seconds.' },
    },
    {
      '@type': 'Question',
      name: 'Is QuizMaster free to use?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, QuizMaster has a free tier that supports up to 5 quizzes and 30 students per session.' },
    },
    {
      '@type': 'Question',
      name: 'How do students join a live quiz?',
      acceptedAnswer: { '@type': 'Answer', text: 'Students visit quizmaster.app/join and enter the 6-character game code provided by their teacher.' },
    },
  ],
};

const jsonLdBreadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quizmaster.app/' },
  ],
};
```

### 9. TanStack Query Caching

Install `@tanstack/react-query`. Configure a `QueryClient` in `main.tsx` (shown in §5 above). The `defaultOptions` set `staleTime: 60_000` (60 s) and `retry: 2` globally, satisfying Requirements 9.2–9.4 for all queries.

The quiz library data fetch (currently a direct Firestore call in `TeacherDashboard.tsx`) is wrapped with `useQuery`:

```typescript
const { data: quizzes = [] } = useQuery({
  queryKey: ['quizzes', user?.uid],
  queryFn: () => fetchQuizzesForTeacher(user!.uid),
  enabled: !!user,
});
```

## Data Models

No new data models are introduced. The Firestore collections (`sessions`, `answers`, `participants`, `quizzes`) already exist; this spec only adds indexes and security rules for them.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Security rules deny unauthorized writes
*For any* Firestore collection and any unauthenticated request attempting a write, the security rules should deny the operation and return a permission-denied error.
**Validates: Requirements 2.2**

Property 2: Security rules allow owner writes only
*For any* quiz document, only a write request whose `auth.uid` matches the document's `teacherId` field should be permitted; all other authenticated write requests should be denied.
**Validates: Requirements 2.3, 2.4**

Property 3: Participant write isolation
*For any* answer document, only a write request whose `auth.uid` matches the document's `studentId` field should be permitted to update or delete it; writes from other authenticated users should be denied.
**Validates: Requirements 2.5, 2.6**

Property 4: Helmet renders unique titles per route
*For any* two distinct public routes, the `<title>` element rendered by `react-helmet-async` should be different strings.
**Validates: Requirements 5.2–5.8**

Property 5: Sitemap contains all required URLs
*For any* required public route path, the `sitemap.xml` file should contain a `<loc>` element whose value is the fully qualified URL for that path.
**Validates: Requirements 7.2, 7.3**

Property 6: TanStack Query caches results
*For any* query key, if the same query is issued twice within the stale time window, the second call should return the cached result without issuing a new network request.
**Validates: Requirements 9.2, 9.3**

Property 7: TanStack Query retries on failure
*For any* failing Firestore query, TanStack Query should retry the request exactly 2 times before surfacing an error to the component.
**Validates: Requirements 9.4**

## Error Handling

- **Firestore security rule denials**: The existing Firebase SDK surfaces these as `FirebaseError` with code `permission-denied`. Components already handle Firebase errors via `.catch()` — no new error handling needed.
- **TanStack Query errors**: Errors after 2 retries are exposed via the `error` field of `useQuery`. Components should render an error state when `isError` is true.
- **Missing Gemini chunk**: If the `vendor-gemini` chunk fails to load (network error), the existing error boundary in the quiz creation flow handles it.
- **Missing meta tags**: `react-helmet-async` is silent if a `Helmet` block is absent — the `index.html` static fallback meta tags remain as the default.

## Testing Strategy

### Unit Tests

- Verify `MAX_CONCURRENT_STUDENTS` equals `1000` in the exported config object.
- Verify `sitemap.xml` contains all 7 required `<loc>` entries.
- Verify `robots.txt` contains a `Sitemap:` directive pointing to the production URL.
- Verify `firestore.indexes.json` is valid JSON and contains exactly 3 index definitions.
- Verify each public page component renders a `<Helmet>` block with a non-empty title and description.

### Property-Based Tests

The project already has `fast-check` installed (see `package.json`). Property tests use `vitest` + `fast-check`.

- **Property 4** (unique Helmet titles): Generate pairs of distinct route paths from the set of public routes; render each page component in isolation; assert the resulting title strings are different.
- **Property 6** (TanStack Query caching): Use `@tanstack/react-query`'s `QueryClient` test utilities; issue the same query key twice within stale time; assert the `fetchFn` was called exactly once.
- **Property 7** (retry count): Mock a failing `fetchFn`; assert it is called exactly 3 times total (1 initial + 2 retries) before the query enters error state.

**Tag format:** `Feature: scalability-seo-improvements, Property {N}: {property_text}`

Each property-based test should run a minimum of 100 iterations where randomization is applicable.
