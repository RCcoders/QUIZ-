# Requirements Document

## Introduction

This document defines the requirements for redesigning all pages of the QuizMaster application to match a provided design system. The redesign is purely visual — all existing functionality (authentication, database calls, game logic, real-time updates) must remain intact. The goal is to apply a consistent, modern design language across all pages using the specified color palette, typography, spacing, and component patterns.

## Glossary

- **Design_System**: The set of visual rules defined by the mockups, including the orange primary color (#FF5C1A), light gray background (#F5F5F5), white cards with rounded corners, Inter font, and sidebar navigation patterns.
- **UI_Layer**: The visual presentation layer of each page — JSX markup, Tailwind CSS classes, and inline styles — excluding business logic, API calls, and state management.
- **TeacherDashboard**: The page at `src/pages/TeacherDashboard.tsx` showing teacher stats, recent quizzes, and performance data.
- **AuthPage**: The page at `src/pages/AuthPage.tsx` handling student and teacher sign-in.
- **JoinGame**: The page at `src/pages/JoinGame.tsx` where students enter a game code and nickname to join a session.
- **QuizEditor**: The page at `src/pages/QuizEditor.tsx` where teachers create and edit quizzes.
- **LandingPage**: The page at `src/pages/LandingPage.tsx`, the public-facing marketing page.
- **GameHost**: The page at `src/pages/GameHost.tsx` where teachers control a live quiz session.
- **PlayGame**: The page at `src/pages/PlayGame.tsx` where students participate in a live quiz session.
- **TeacherSidebar**: The shared sidebar component at `src/components/TeacherSidebar.tsx` used across teacher-facing pages.
- **Primary_Color**: #FF5C1A (orange), the brand accent color used for CTAs, active states, and highlights.
- **Background_Color**: #F5F5F5 (light gray), the default page background.
- **Card**: A white container with a subtle box shadow and 12–16px border radius.

---

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a consistent set of CSS variables and global styles that reflect the new design system, so that all pages share the same visual language without duplicating style definitions.

#### Acceptance Criteria

1. THE Design_System SHALL define `--primary: #FF5C1A` and `--bg-page: #F5F5F5` as CSS custom properties in `src/index.css`.
2. THE Design_System SHALL define Inter as the primary font family, loaded via Google Fonts.
3. THE Design_System SHALL define card styles with white background, `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`, and border-radius of 12px–16px.
4. THE Design_System SHALL preserve all existing CSS variables that are referenced by game-play pages (PlayGame, GameHost, StudentQuiz) to avoid breaking game functionality.

---

### Requirement 2: TeacherSidebar Redesign

**User Story:** As a teacher, I want a clean left sidebar with clear navigation and an upgrade prompt, so that I can easily move between dashboard sections.

#### Acceptance Criteria

1. THE TeacherSidebar SHALL display navigation items: Dashboard, My Quizzes, Students, Reports, and Library, each with a corresponding Lucide icon.
2. WHEN a navigation item is active, THE TeacherSidebar SHALL highlight it with a `#FF5C1A` background and white text.
3. THE TeacherSidebar SHALL display a "Pro Tip" upgrade card at the bottom of the sidebar above the sign-out button.
4. THE TeacherSidebar SHALL display the QuizMaster logo and brand name at the top.
5. THE TeacherSidebar SHALL maintain the existing `signOut` functionality from `AuthContext`.

---

### Requirement 3: TeacherDashboard Redesign

**User Story:** As a teacher, I want a dashboard that shows my key stats, recent quizzes, and performance data in a clean layout, so that I can quickly assess my teaching activity.

#### Acceptance Criteria

1. THE TeacherDashboard SHALL display a top bar with a search input, notification bell icon, settings icon, and user avatar.
2. THE TeacherDashboard SHALL display a welcome greeting using the authenticated teacher's name with a "Create New Quiz" button styled with `#FF5C1A` background.
3. THE TeacherDashboard SHALL display four stat cards showing: Total Quizzes, Active Sessions, Total Students, and Average Score, each with a percentage change badge.
4. THE TeacherDashboard SHALL display a "Recent Quizzes" list where each row shows a quiz icon, title, question count, student count, average score, and a status label.
5. THE TeacherDashboard SHALL display a performance panel containing a bar chart visualization, weekly completion percentage, average student time metric, and a "Download Report PDF" button.
6. THE TeacherDashboard SHALL use the `#F5F5F5` background with white Card components for each content section.

---

### Requirement 4: AuthPage Redesign

**User Story:** As a user, I want a polished sign-in page that clearly separates the branding from the login form, so that I can authenticate quickly and confidently.

#### Acceptance Criteria

1. THE AuthPage SHALL use a split layout with a left panel displaying a background image and the tagline "Master your subjects with interactive quizzes", and a right panel containing the login form.
2. THE AuthPage SHALL display a Student/Teacher tab toggle that switches the active role, preserving existing role-based authentication logic.
3. THE AuthPage SHALL display an email input field with a mail icon and a password input field with a lock icon and a show/hide password toggle.
4. THE AuthPage SHALL display a "Forgot password?" link adjacent to the password field.
5. THE AuthPage SHALL display an orange "Sign In" button using `#FF5C1A` as the background color.
6. THE AuthPage SHALL display an "Or continue with" divider followed by a Google sign-in button, preserving existing Google OAuth logic.
7. THE AuthPage SHALL display a "Don't have an account? Create an account" link that navigates to the registration flow.
8. THE AuthPage SHALL display a footer with copyright text, a Privacy Policy link, and a Terms of Service link.

---

### Requirement 5: JoinGame Redesign

**User Story:** As a student, I want a simple, welcoming join page where I can enter a game code and nickname, so that I can join a quiz session without friction.

#### Acceptance Criteria

1. THE JoinGame SHALL display the QuizMaster logo in the top-left and a Help button in the top-right.
2. THE JoinGame SHALL display a centered card on a `#F5F5F5` background with a "Ready to Play?" heading and a subtitle.
3. THE JoinGame SHALL display a single text input for the game join code with placeholder text "000 000", replacing any existing multi-box OTP-style input.
4. THE JoinGame SHALL display a nickname input field with a person icon.
5. THE JoinGame SHALL display an email verification input field with a mail icon and helper text "We'll send your results here after the quiz."
6. THE JoinGame SHALL display an orange "Join Game →" button using `#FF5C1A` as the background color.
7. THE JoinGame SHALL display an avatar group and a "students waiting in lobby" count below the join button.
8. THE JoinGame SHALL display a footer with the text "By joining, you agree to our Terms of Service. No account registration required for students."
9. THE JoinGame SHALL display an orange bottom border accent on the page or card.
10. IF a user submits the join form with an empty game code or nickname, THEN THE JoinGame SHALL prevent submission and display a validation message.

---

### Requirement 6: QuizEditor Redesign

**User Story:** As a teacher, I want a quiz editor with a clear three-panel layout showing quiz info, question editing, and a live preview, so that I can build quizzes efficiently.

#### Acceptance Criteria

1. THE QuizEditor SHALL display a top bar with the title "Create New Quiz", subtitle "Manual Assessment Builder", navigation tabs (Drafts, Templates, Settings), a "Save Draft" button, and a "Publish" button.
2. THE QuizEditor SHALL display a left panel with a "Quiz Information" section containing inputs for Quiz Title, Subject dropdown, Timer, and Description textarea.
3. THE QuizEditor SHALL display a question editor section with a question card showing a QUESTION label, a TYPE dropdown defaulting to "Multiple Choice", answer option inputs with correct-answer checkmark toggles, an "+ Add another option" link, and an "+ Add Question" dashed-border button.
4. THE QuizEditor SHALL display a right panel with a "Live Preview" section showing the quiz title, a question preview, answer options, a Quiz Strength indicator bar, a "Full Preview" button, and a "Quick Tip" card.
5. THE QuizEditor SHALL preserve all existing quiz creation, draft saving, and publishing logic.

---

### Requirement 7: LandingPage Redesign

**User Story:** As a visitor, I want a professional marketing page that clearly communicates QuizMaster's value and guides me to sign up or join a quiz, so that I can quickly understand the product.

#### Acceptance Criteria

1. THE LandingPage SHALL display an orange-themed header with the QuizMaster logo, navigation links (Features, How It Works, Pricing), a Login button, and a "Create Quiz" button with `#FF5C1A` background.
2. THE LandingPage SHALL display a hero section with the heading "Create AI Quiz Instantly.", a description, a "Create AI Quiz →" primary button, a "Join a Quiz" secondary button, and an orange square illustration.
3. THE LandingPage SHALL display a Features section with three cards: AI Generation, Real-time Insights, and Live Competition.
4. THE LandingPage SHALL display a "How It Works" section with three numbered steps.
5. THE LandingPage SHALL display a Testimonials section with three quote cards.
6. THE LandingPage SHALL display a Pricing section with three tiers: Free ($0), Pro Teacher ($12/month), and School (Custom pricing).
7. THE LandingPage SHALL display a CTA section with a dark blue/purple gradient background.
8. THE LandingPage SHALL display a footer with a dark background, footer links, and copyright text.
9. THE LandingPage SHALL preserve all existing navigation and routing logic.

---

### Requirement 8: GameHost Redesign

**User Story:** As a teacher hosting a live quiz, I want a control panel that shows real-time student activity, question management, and anti-cheat monitoring in a clear layout, so that I can run the session effectively.

#### Acceptance Criteria

1. THE GameHost SHALL display a top bar showing the quiz title, session ID, active student count, class average percentage, time elapsed, a Pause button, and an End Session button.
2. THE GameHost SHALL display a stats row with Total Students count, Present count, and an Answer Status section showing Finished/Remaining counts with a progress bar.
3. THE GameHost SHALL display a question card with a "Question X of Y" badge, a progress bar, question text, an optional image area, four answer option buttons (A/B/C/D), a "Show Hint" button, a "Correct Answer" button, and a "Next Question →" button.
4. THE GameHost SHALL display a right panel with a "Lock Students" button, a "Broadcast" button, an Anti-Cheat Monitor section listing violations, and an Activity Feed with a chat input.
5. THE GameHost SHALL display a Top Performers leaderboard table at the bottom with columns: Rank, Student, Score, Streak, and Accuracy.
6. THE GameHost SHALL preserve all existing real-time session management, anti-cheat detection, and student control logic.

---

### Requirement 9: PlayGame Lobby Redesign

**User Story:** As a student waiting in a game lobby, I want a welcoming waiting room that shows who else has joined and what the rules are, so that I feel prepared before the quiz starts.

#### Acceptance Criteria

1. THE PlayGame SHALL display a left sidebar with the QuizMaster logo, navigation items (Lobby, Leaderboard, Support), and a "Quiz Tip" card at the bottom.
2. THE PlayGame SHALL display the student's name with a "STUDENT" label and a "Leave Lobby" button in the top area.
3. THE PlayGame SHALL display an orange banner showing "WAITING FOR HOST" status, the quiz title, the teacher's name, and the PLAYERS JOINED count.
4. THE PlayGame SHALL display a joined students grid where each student is shown as an avatar card, with the current student's card highlighted and labeled "READY".
5. THE PlayGame SHALL display a right panel with a "Rules of Engagement" numbered list and a "Ready to Start?" card containing an awaiting sync progress bar.
6. THE PlayGame SHALL preserve all existing real-time lobby synchronization, player join/leave, and game start logic.

---

### Requirement 10: Functional Preservation

**User Story:** As a developer, I want all existing application logic to remain unchanged after the redesign, so that the redesign does not introduce regressions.

#### Acceptance Criteria

1. THE UI_Layer SHALL NOT modify any function that makes a Supabase or Firebase database call.
2. THE UI_Layer SHALL NOT modify any authentication logic in `src/contexts/AuthContext.tsx`.
3. THE UI_Layer SHALL NOT modify any game state management logic in `src/hooks/useAntiCheat.ts` or `src/lib/database.ts`.
4. WHEN the redesign is applied, THE Application SHALL continue to pass all existing routing and navigation paths defined in `src/App.tsx`.
5. THE UI_Layer SHALL NOT remove or rename any React component props that are consumed by parent components or routing logic.
