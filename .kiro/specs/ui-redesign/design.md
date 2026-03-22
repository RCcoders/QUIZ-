# Design Document: UI Redesign

## Overview

This document describes the technical design for applying the QuizMaster design system across all application pages. The redesign is a pure UI-layer change: JSX markup and Tailwind/inline styles are updated to match the provided mockups while all business logic, API calls, authentication, and state management remain untouched.

The design system centers on:
- **Primary color**: `#FF5C1A` (orange) for CTAs, active states, and accents
- **Background**: `#F5F5F5` (light gray) as the default page background
- **Cards**: White (`#FFFFFF`) with `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` and `border-radius: 12px–16px`
- **Typography**: Inter (400/500/600/700) loaded from Google Fonts
- **Icons**: Lucide React (already installed)

---

## Architecture

The redesign follows a component-first approach. Changes are isolated to the UI layer of each file:

```
src/
├── index.css                  ← Add/update CSS variables for new design tokens
├── components/
│   └── TeacherSidebar.tsx     ← Redesign sidebar nav + Pro Tip card
└── pages/
    ├── TeacherDashboard.tsx   ← Redesign dashboard layout
    ├── AuthPage.tsx           ← Redesign split auth layout
    ├── JoinGame.tsx           ← Redesign join form
    ├── QuizEditor.tsx         ← Redesign three-panel editor
    ├── LandingPage.tsx        ← Redesign marketing page
    ├── GameHost.tsx           ← Redesign host control panel
    └── PlayGame.tsx           ← Redesign lobby state
```

No new files are created. No routing, context, hook, or library files are modified.

### Constraint: Logic Preservation

Each page file contains both UI markup and logic (event handlers, data fetching, state). The redesign modifies only the JSX return value and any purely presentational helper functions. All `useEffect`, `useState` (for non-UI state), Supabase calls, Firebase calls, and auth context usage remain unchanged.

---

## Components and Interfaces

### Design Token Updates (`src/index.css`)

New CSS variables are added to `:root`. Existing variables used by game-play pages are preserved.

```css
:root {
  /* New design system tokens */
  --ds-primary: #FF5C1A;
  --ds-primary-hover: #E64A10;
  --ds-primary-light: #FFF3EE;
  --ds-bg-page: #F5F5F5;
  --ds-bg-card: #FFFFFF;
  --ds-card-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  --ds-card-radius: 14px;
  --ds-border: #E5E7EB;
  --ds-text-primary: #111827;
  --ds-text-secondary: #6B7280;
  --ds-text-muted: #9CA3AF;
  --ds-success: #10B981;
  --ds-warning: #F59E0B;
  --ds-error: #EF4444;
}
```

All existing variables (`--accent-primary`, `--bg-primary`, etc.) are kept intact.

---

### TeacherSidebar (`src/components/TeacherSidebar.tsx`)

**Layout**: Fixed-width left sidebar (240px), full viewport height, white background, right border `1px solid #E5E7EB`.

**Sections (top to bottom)**:
1. Logo row: orange Play icon + "QuizMaster" text
2. Nav items: Dashboard, My Quizzes, Students, Reports, Library — each with Lucide icon + label
3. Active state: `background: #FFF3EE`, `color: #FF5C1A`, left border `3px solid #FF5C1A`
4. Pro Tip card: light orange background, upgrade CTA text, "Upgrade to Pro" button
5. Sign Out button at bottom

**New nav items added**: Students (Users icon), Library (Library icon) — these are display-only nav links; routing for them can point to existing routes or `#` placeholders.

---

### TeacherDashboard (`src/pages/TeacherDashboard.tsx`)

**Layout**: `flex` row — TeacherSidebar (240px) + main content area.

**Main content structure**:
```
┌─────────────────────────────────────────────────────┐
│ Top Bar: Search | Bell | Settings | Avatar           │
├─────────────────────────────────────────────────────┤
│ Welcome: "Hello, Ms. Sarah! 👋"  [Create New Quiz]  │
├──────────────┬──────────────┬──────────────┬────────┤
│ Stat Card 1  │ Stat Card 2  │ Stat Card 3  │ Stat 4 │
├──────────────┴──────────────┴──────────────┴────────┤
│ Recent Quizzes list (left 60%)  │ Performance (40%) │
└─────────────────────────────────────────────────────┘
```

**Stat cards**: White card, icon in colored circle, metric value (large bold), label, percentage badge (green for positive, red for negative).

**Recent Quizzes row**: Quiz icon, title, `N questions`, `N students`, avg score %, status badge (Active = green, Draft = gray).

**Performance panel**: Simple bar chart (CSS bars, no external chart library), weekly completion %, avg student time, "Download Report PDF" button.

---

### AuthPage (`src/pages/AuthPage.tsx`)

**Layout**: `flex` row, full viewport height.
- Left panel (50%): dark overlay on background image, centered tagline text
- Right panel (50%): white background, centered card with form

**Form card structure**:
1. "Welcome Back" heading
2. Student / Teacher tab toggle (pill-style, orange active tab)
3. Email input with Mail icon (left adornment)
4. Password input with Lock icon + Eye/EyeOff toggle (right adornment)
5. "Forgot password?" link (right-aligned, below password)
6. Orange "Sign In" button (full width)
7. Divider: "Or continue with"
8. Google button (white, border, Google icon)
9. "Don't have an account? Create an account" link
10. Footer: copyright + Privacy Policy + Terms of Service

All existing `handleSignIn`, `handleGoogleSignIn`, role state, and error state logic is preserved.

---

### JoinGame (`src/pages/JoinGame.tsx`)

**Layout**: Full-page `#F5F5F5` background, centered card (max-width 480px).

**Page structure**:
- Top bar: QuizMaster logo (left), Help button (right)
- Card:
  1. "Ready to Play?" heading + subtitle
  2. GAME JOIN CODE label + single `<input>` with placeholder "000 000"
  3. NICKNAME label + input with User icon
  4. EMAIL VERIFICATION label + input with Mail icon + helper text
  5. Orange "Join Game →" button
  6. Avatar group + "N students waiting in lobby" text
- Footer text: "By joining, you agree to our Terms of Service..."
- Orange bottom border: `border-bottom: 4px solid #FF5C1A` on the page or card

**Key change**: Replace any existing multi-box OTP input with a single `<input type="text">` field. The existing `gameCode` state variable is kept; only the input rendering changes.

---

### QuizEditor (`src/pages/QuizEditor.tsx`)

**Layout**: Full height, `flex` column.
- Top bar (fixed): title + subtitle + tab nav + action buttons
- Body: `flex` row — Left panel (320px) + Center editor (flex-1) + Right preview (300px)

**Left panel — Quiz Information**:
- Quiz Title input
- Subject dropdown
- Timer input (minutes)
- Description textarea

**Center — Question Editor**:
- Question card: QUESTION N label, TYPE dropdown, question text input, answer options (each with letter badge + text input + correct-answer checkbox), "+ Add another option" link
- "+ Add Question" dashed-border button at bottom

**Right panel — Live Preview**:
- Quiz title display
- Question preview (read-only)
- Answer option previews
- Quiz Strength bar (0–100%, colored by score)
- "Full Preview" button
- Quick Tip card (static tip text)

All existing `addQuestion`, `updateQuestion`, `saveDraft`, `publishQuiz` logic is preserved.

---

### LandingPage (`src/pages/LandingPage.tsx`)

**Sections (top to bottom)**:
1. **Header**: sticky, white background, QuizMaster logo, nav links, Login + "Create Quiz" buttons
2. **Hero**: two-column — left: heading + description + CTA buttons; right: orange square illustration (CSS div or SVG)
3. **Features**: 3-column card grid — AI Generation, Real-time Insights, Live Competition
4. **How It Works**: 3 numbered steps in a row
5. **Testimonials**: 3 quote cards in a row
6. **Pricing**: 3 pricing cards — Free, Pro Teacher (highlighted), School
7. **CTA**: full-width section, `background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)`, centered heading + button
8. **Footer**: dark background (`#0F172A`), logo, links, copyright

All existing routing (`useNavigate`) and auth-check logic is preserved.

---

### GameHost (`src/pages/GameHost.tsx`)

**Layout**: Full height, `flex` column.
- Top bar: quiz title + session ID + student count + class avg + time elapsed + Pause + End Session
- Stats row: 3 stat boxes (Total Students, Present, Answer Status with progress bar)
- Body: `flex` row — Question card (flex-1) + Right panel (320px)
- Bottom: Top Performers leaderboard table

**Question card**: white card, "Question X of Y" badge (orange), progress bar, question text, image placeholder, 4 answer option buttons (A/B/C/D with colored backgrounds), Show Hint + Correct Answer buttons, "Next Question →" button.

**Right panel**: Lock Students button, Broadcast button, Anti-Cheat Monitor (scrollable violation list), Activity Feed (message list + chat input).

**Leaderboard table**: columns — Rank (with medal icons for top 3), Student name, Score, Streak, Accuracy %.

All existing real-time subscriptions, anti-cheat logic, and session control functions are preserved.

---

### PlayGame Lobby (`src/pages/PlayGame.tsx`)

**Layout**: Full height, `flex` row.
- Left sidebar (220px): QuizMaster logo, Lobby/Leaderboard/Support nav, Quiz Tip card
- Main area: `flex` column
  - Top: student name + STUDENT badge + Leave Lobby button
  - Orange banner: "WAITING FOR HOST", quiz title, teacher name, PLAYERS JOINED count
  - Students grid: `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`, each card shows avatar + name; current student card has orange border + "READY" badge
- Right panel (280px): Rules of Engagement list, "Ready to Start?" card with animated progress bar

All existing real-time player sync, lobby state, and game start detection logic is preserved.

---

## Data Models

No new data models are introduced. The redesign consumes existing data shapes already used by each page:

- **TeacherDashboard**: reads quiz list, session counts, student counts from existing Supabase queries
- **AuthPage**: uses `AuthContext` user object and role string
- **JoinGame**: uses `gameCode` string, `nickname` string, `email` string state variables
- **QuizEditor**: uses existing `Quiz`, `Question`, `AnswerOption` types from `src/lib/database.ts`
- **GameHost**: uses existing session, participant, and question data from real-time subscriptions
- **PlayGame**: uses existing lobby participant list and session state

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

