# Implementation Plan: UI Redesign

## Overview

Apply the QuizMaster design system across all pages and components. Each task modifies only the UI layer (JSX markup and styles) of the target file. All business logic, API calls, auth context usage, and state management must remain untouched.

Design system reference:
- Primary: `#FF5C1A` | Background: `#F5F5F5` | Cards: white, `border-radius: 14px`, `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`
- Font: Inter | Icons: Lucide React

---

## Tasks

- [x] 1. Add design system tokens to `src/index.css`
  - Add `:root` CSS custom properties: `--ds-primary`, `--ds-primary-hover`, `--ds-primary-light`, `--ds-bg-page`, `--ds-bg-card`, `--ds-card-shadow`, `--ds-card-radius`, `--ds-border`, `--ds-text-primary`, `--ds-text-secondary`, `--ds-text-muted`, `--ds-success`, `--ds-warning`, `--ds-error`
  - Ensure all existing CSS variables (e.g. `--accent-primary`, `--bg-primary`) are preserved and not overwritten
  - Add a base `body` rule setting `background: var(--ds-bg-page)` and `font-family: 'Inter', sans-serif`
  - Verify the Google Fonts `<link>` for Inter is present in `index.html` (add if missing)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Redesign `src/components/TeacherSidebar.tsx`
  - [x] 2.1 Implement sidebar shell and logo row
    - Set sidebar to fixed-width 240px, full viewport height, white background, right border `1px solid #E5E7EB`
    - Render QuizMaster logo: orange Play icon (Lucide) + "QuizMaster" bold text
    - _Requirements: 2.4_
  - [x] 2.2 Implement navigation items with active state
    - Render nav items: Dashboard (LayoutDashboard), My Quizzes (BookOpen), Students (Users), Reports (BarChart2), Library (Library) — each with icon + label
    - Apply active state styles: `background: #FFF3EE`, `color: #FF5C1A`, left border `3px solid #FF5C1A`
    - Students and Library items may link to `#` if no route exists yet
    - _Requirements: 2.1, 2.2_
  - [x] 2.3 Implement Pro Tip card and Sign Out button
    - Render Pro Tip card at bottom of nav: light orange background (`#FFF3EE`), upgrade CTA text, "Upgrade to Pro" button styled with `#FF5C1A` border
    - Render Sign Out button below the Pro Tip card, wired to existing `signOut` from `AuthContext`
    - _Requirements: 2.3, 2.5_

- [x] 3. Redesign `src/pages/TeacherDashboard.tsx`
  - [x] 3.1 Implement page shell and top bar
    - Set page layout to `flex` row: TeacherSidebar (240px) + main content area with `#F5F5F5` background
    - Render top bar: search input (Search icon), Bell icon button, Settings icon button, user avatar circle with teacher initials
    - _Requirements: 3.1, 3.6_
  - [x] 3.2 Implement welcome row and stat cards
    - Render welcome greeting using authenticated teacher's display name (e.g. "Hello, Ms. Sarah! 👋") with a "Create New Quiz" button (`background: #FF5C1A`, white text)
    - Render four stat cards in a responsive grid: Total Quizzes, Active Sessions, Total Students, Average Score — each with a colored icon circle, large bold metric value, label, and a percentage change badge (green positive, red negative)
    - Wire "Create New Quiz" button to existing navigation/handler
    - _Requirements: 3.2, 3.3_
  - [x] 3.3 Implement Recent Quizzes list
    - Render a white card section titled "Recent Quizzes"
    - Each row: quiz icon, title, question count, student count, avg score %, status badge (Active = green pill, Draft = gray pill)
    - Populate rows from existing quiz data already fetched by the page
    - _Requirements: 3.4_
  - [x] 3.4 Implement Performance panel
    - Render a white card section (right column, ~40% width) with a simple CSS bar chart (no external chart library), weekly completion %, avg student time metric, and a "Download Report PDF" button
    - Bar chart uses `div` elements with heights proportional to data values; data comes from existing state
    - _Requirements: 3.5_

- [x] 4. Redesign `src/pages/AuthPage.tsx`
  - [x] 4.1 Implement split layout shell
    - Set page to `flex` row, full viewport height
    - Left panel (50%): dark overlay (`rgba(0,0,0,0.55)`) on a background image, centered tagline "Master your subjects with interactive quizzes"
    - Right panel (50%): white background, vertically centered form card
    - _Requirements: 4.1_
  - [x] 4.2 Implement Student/Teacher tab toggle and input fields
    - Render pill-style Student / Teacher tab toggle; active tab uses `#FF5C1A` background and white text; preserve existing role state variable
    - Render email input with Mail icon (left adornment) and password input with Lock icon + Eye/EyeOff toggle (right adornment); preserve existing `handleSignIn` and form state
    - Render "Forgot password?" link right-aligned below the password field
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 4.3 Implement sign-in button, OAuth, and footer links
    - Render full-width orange "Sign In" button (`background: #FF5C1A`); wire to existing `handleSignIn`
    - Render "Or continue with" divider and Google sign-in button (white, border, Google icon); wire to existing `handleGoogleSignIn`
    - Render "Don't have an account? Create an account" link; wire to existing navigation
    - Render footer with copyright text, Privacy Policy link, Terms of Service link
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [x] 5. Redesign `src/pages/JoinGame.tsx`
  - [x] 5.1 Implement page shell and top bar
    - Set page background to `#F5F5F5`, full viewport height
    - Render top bar: QuizMaster logo (left), Help button (right)
    - Add orange bottom border accent: `border-bottom: 4px solid #FF5C1A` on the card or page footer
    - _Requirements: 5.1, 5.9_
  - [x] 5.2 Implement join form card
    - Render centered white card (max-width 480px) with "Ready to Play?" heading and subtitle
    - Replace any existing multi-box OTP input with a single `<input type="text">` bound to the existing `gameCode` state variable; placeholder "000 000"
    - Render nickname input with User icon, email input with Mail icon and helper text "We'll send your results here after the quiz."
    - Render orange "Join Game →" button (`background: #FF5C1A`); wire to existing submit handler
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 5.3 Implement lobby count display and footer
    - Render avatar group (3–4 placeholder avatar circles) and "N students waiting in lobby" text below the join button; bind count to existing lobby state if available
    - Render footer text: "By joining, you agree to our Terms of Service. No account registration required for students."
    - Ensure form validation prevents submission when game code or nickname is empty; display inline validation message
    - _Requirements: 5.7, 5.8, 5.10_

- [x] 6. Redesign `src/pages/QuizEditor.tsx`
  - [x] 6.1 Implement top bar
    - Render fixed top bar: "Create New Quiz" title, "Manual Assessment Builder" subtitle, tab nav (Drafts, Templates, Settings), "Save Draft" button (outlined), "Publish" button (`background: #FF5C1A`)
    - Wire "Save Draft" and "Publish" to existing `saveDraft` and `publishQuiz` handlers
    - _Requirements: 6.1_
  - [x] 6.2 Implement left panel — Quiz Information
    - Render left panel (320px): "Quiz Information" section heading, Quiz Title input, Subject dropdown, Timer input (minutes), Description textarea
    - Bind all inputs to existing state variables
    - _Requirements: 6.2_
  - [x] 6.3 Implement center panel — Question Editor
    - Render question card per question: "QUESTION N" label, TYPE dropdown (default "Multiple Choice"), question text input, answer option rows (letter badge + text input + correct-answer checkbox toggle), "+ Add another option" link
    - Render "+ Add Question" dashed-border button at bottom; wire to existing `addQuestion` handler
    - Bind all inputs to existing `updateQuestion` handlers
    - _Requirements: 6.3_
  - [x] 6.4 Implement right panel — Live Preview
    - Render right panel (300px): quiz title display, question preview (read-only), answer option previews, Quiz Strength indicator bar (0–100%, color shifts green as score increases), "Full Preview" button, static "Quick Tip" card
    - Quiz Strength bar reads from existing question/answer state to compute a completeness score
    - _Requirements: 6.4_

- [x] 7. Redesign `src/pages/LandingPage.tsx`
  - [x] 7.1 Implement header and hero section
    - Render sticky header: white background, QuizMaster logo, nav links (Features, How It Works, Pricing), Login button (outlined), "Create Quiz" button (`background: #FF5C1A`)
    - Render hero section: two-column layout — left: "Create AI Quiz Instantly." heading + description + "Create AI Quiz →" primary button + "Join a Quiz" secondary button; right: orange square illustration (CSS `div` with `background: #FF5C1A`, rounded corners)
    - Wire Login and "Create Quiz" buttons to existing `useNavigate` calls
    - _Requirements: 7.1, 7.2_
  - [x] 7.2 Implement Features and How It Works sections
    - Render Features section: 3-column card grid — AI Generation (Zap icon), Real-time Insights (BarChart2 icon), Live Competition (Trophy icon); each card has icon, title, description
    - Render "How It Works" section: 3 numbered steps in a row with step number circle, title, description
    - _Requirements: 7.3, 7.4_
  - [x] 7.3 Implement Testimonials and Pricing sections
    - Render Testimonials section: 3 quote cards, each with quote text, avatar, name, role
    - Render Pricing section: 3 cards — Free ($0), Pro Teacher ($12/month, highlighted with `#FF5C1A` border), School (Custom); each card lists features with checkmarks
    - _Requirements: 7.5, 7.6_
  - [x] 7.4 Implement CTA section and footer
    - Render CTA section: full-width, `background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)`, centered heading + orange CTA button
    - Render footer: dark background (`#0F172A`), QuizMaster logo, footer link columns, copyright text
    - _Requirements: 7.7, 7.8, 7.9_

- [x] 8. Redesign `src/pages/GameHost.tsx`
  - [x] 8.1 Implement top bar and stats row
    - Render top bar: quiz title, session ID badge, active student count, class average %, time elapsed (from existing timer state), Pause button, End Session button; wire buttons to existing handlers
    - Render stats row: Total Students count box, Present count box, Answer Status box (Finished/Remaining counts + progress bar); bind all values to existing session state
    - _Requirements: 8.1, 8.2_
  - [x] 8.2 Implement question card
    - Render white question card: "Question X of Y" badge (orange), progress bar, question text, image placeholder area, four answer option buttons (A/B/C/D with distinct background colors), "Show Hint" button, "Correct Answer" button, "Next Question →" button
    - Wire all buttons to existing question navigation and reveal handlers
    - _Requirements: 8.3_
  - [x] 8.3 Implement right panel — controls and activity feed
    - Render right panel (320px): "Lock Students" button, "Broadcast" button, Anti-Cheat Monitor section (scrollable list of violations from existing anti-cheat state), Activity Feed (message list + chat input)
    - Wire Lock Students and Broadcast to existing handlers; bind violation list and activity feed to existing state
    - _Requirements: 8.4_
  - [x] 8.4 Implement Top Performers leaderboard
    - Render leaderboard table at bottom: columns — Rank (medal icons for top 3: gold/silver/bronze), Student name, Score, Streak, Accuracy %
    - Bind rows to existing leaderboard/participant state
    - _Requirements: 8.5_

- [x] 9. Redesign `src/pages/PlayGame.tsx` (lobby state)
  - [x] 9.1 Implement left sidebar
    - Render left sidebar (220px): QuizMaster logo, nav items (Lobby with Home icon, Leaderboard with Trophy icon, Support with HelpCircle icon), Quiz Tip card at bottom (light orange background, static tip text)
    - _Requirements: 9.1_
  - [x] 9.2 Implement top area and orange banner
    - Render top area: student display name + "STUDENT" badge + "Leave Lobby" button; wire Leave Lobby to existing leave handler
    - Render orange banner (`background: #FF5C1A`, white text): "WAITING FOR HOST" label, quiz title, teacher name, PLAYERS JOINED count; bind all values to existing lobby state
    - _Requirements: 9.2, 9.3_
  - [x] 9.3 Implement students grid
    - Render students grid using `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`; each card shows avatar circle + student name
    - Highlight the current student's card with an orange border (`2px solid #FF5C1A`) and a "READY" badge
    - Bind grid to existing participant list from real-time state
    - _Requirements: 9.4_
  - [x] 9.4 Implement right panel
    - Render right panel (280px): "Rules of Engagement" numbered list (static rules text), "Ready to Start?" card with an animated indeterminate progress bar indicating awaiting host sync
    - _Requirements: 9.5_

- [x] 10. Final checkpoint — verify functional preservation
  - Ensure all existing tests pass (run `npm test -- --run` or equivalent)
  - Manually verify routing paths defined in `src/App.tsx` still resolve correctly
  - Confirm no Supabase/Firebase call sites, `AuthContext` usage, `useAntiCheat`, or `database.ts` imports were modified
  - Confirm no component props consumed by parent components or routing were removed or renamed
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task modifies only JSX markup and styles — never business logic
- Work through tasks in order; each page can be done independently after task 1 (CSS tokens) is complete
- If a page's existing state variable names are unclear, read the file before editing to map state to new UI bindings
