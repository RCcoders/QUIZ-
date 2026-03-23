# Requirements Document

## Introduction

This document covers the student-facing features of QuizMaster, a React/TypeScript/Firebase quiz and education web app. The scope includes:

1. **Signup Page** — A dedicated registration page for new users (students and teachers), separate from the existing login flow.
2. **Student Dashboard** — The authenticated home page for students after login, showing progress, available quizzes, and quick actions.
3. **Student-Facing Pages** — All pages a student interacts with: browsing quizzes, taking a quiz, viewing results, joining live games, and managing their profile.

The existing `AuthPage` combines login and signup in one view. This spec separates them into distinct routes and adds a proper student identity layer (role-based routing, student dashboard, persistent progress).

---

## Glossary

- **Auth_System**: The Firebase Authentication layer and `AuthContext` that manages user sessions.
- **Signup_Page**: The dedicated `/signup` route where new users create an account.
- **Login_Page**: The existing `/auth` route, refactored to be login-only.
- **Student_Dashboard**: The authenticated landing page at `/student/dashboard` for users with the student role.
- **Student_Profile**: The stored Firestore document containing a student's display name, role, avatar, and preferences.
- **Quiz_Browser**: The `/student` page where students discover and select quizzes to take.
- **Quiz_Player**: The `/student/quiz/:id` page where a student answers quiz questions.
- **Results_Page**: The post-quiz summary page showing score, correct/incorrect answers, and performance breakdown.
- **Live_Game**: A real-time multiplayer quiz session hosted by a teacher, joined via a game code.
- **Role**: A string field (`"student"` or `"teacher"`) stored in the user's Firestore profile, used to route users to the correct dashboard after login.
- **Streak**: A count of consecutive days a student has completed at least one quiz.
- **Score_Record**: A Firestore document recording a student's attempt on a specific quiz, including score, percentage, and timestamp.

---

## Requirements

### Requirement 1: Dedicated Signup Page

**User Story:** As a new user, I want a dedicated signup page, so that I can create an account without being confused by a combined login/signup form.

#### Acceptance Criteria

1. THE Signup_Page SHALL be accessible at the `/signup` route.
2. WHEN a user submits the signup form with a valid email and password of at least 6 characters, THE Auth_System SHALL create a new Firebase user account.
3. WHEN a user submits the signup form, THE Signup_Page SHALL require the user to select a role (`student` or `teacher`) before submission.
4. WHEN account creation succeeds, THE Auth_System SHALL create a Student_Profile or teacher profile document in Firestore with the selected role, display name, and creation timestamp.
5. WHEN account creation succeeds and the selected role is `student`, THE Signup_Page SHALL redirect the user to `/student/dashboard`.
6. WHEN account creation succeeds and the selected role is `teacher`, THE Signup_Page SHALL redirect the user to `/teacher`.
7. IF the submitted email is already registered, THEN THE Signup_Page SHALL display a descriptive error message without clearing the form fields.
8. IF the submitted password is fewer than 6 characters, THEN THE Signup_Page SHALL display a validation error before submitting to Firebase.
9. WHEN a user clicks "Continue with Google", THE Auth_System SHALL initiate Google OAuth sign-in and create a profile document if one does not already exist.
10. THE Signup_Page SHALL include a link to the Login_Page for users who already have an account.
11. WHILE the signup form is submitting, THE Signup_Page SHALL disable the submit button and display a loading indicator.

---

### Requirement 2: Role-Based Post-Login Routing

**User Story:** As a returning user, I want to be sent to the correct dashboard after login, so that I land on the right page for my role without manual navigation.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE Auth_System SHALL read the user's `role` field from their Firestore profile.
2. WHEN the authenticated user's role is `student`, THE Login_Page SHALL redirect to `/student/dashboard`.
3. WHEN the authenticated user's role is `teacher`, THE Login_Page SHALL redirect to `/teacher`.
4. IF a user's Firestore profile does not contain a `role` field, THEN THE Auth_System SHALL default the role to `student` and redirect to `/student/dashboard`.
5. WHEN an authenticated student navigates directly to `/teacher`, THE Auth_System SHALL redirect them to `/student/dashboard`.
6. WHEN an unauthenticated user navigates to `/student/dashboard`, THE Auth_System SHALL redirect them to `/login`.

---

### Requirement 3: Student Dashboard

**User Story:** As a student, I want a personalized dashboard after login, so that I can see my progress, access quizzes, and know what to do next.

#### Acceptance Criteria

1. THE Student_Dashboard SHALL be accessible at `/student/dashboard` and require authentication.
2. THE Student_Dashboard SHALL display the student's display name and avatar (or initials fallback).
3. THE Student_Dashboard SHALL display the student's current Streak count.
4. THE Student_Dashboard SHALL display the student's total quizzes completed and average score percentage.
5. WHEN a student has no Score_Records, THE Student_Dashboard SHALL display an empty state encouraging them to take their first quiz.
6. THE Student_Dashboard SHALL display a "Continue Learning" section showing the most recently attempted quizzes.
7. THE Student_Dashboard SHALL display a "Recommended Quizzes" section with available quizzes from the Quiz_Browser.
8. THE Student_Dashboard SHALL include a prominent "Join Live Game" button that navigates to `/join`.
9. THE Student_Dashboard SHALL include a navigation link to the Quiz_Browser at `/student`.
10. WHEN a student clicks a quiz card on the dashboard, THE Student_Dashboard SHALL navigate to the Quiz_Player for that quiz.

---

### Requirement 4: Quiz Browser

**User Story:** As a student, I want to browse available quizzes, so that I can find and start a quiz that interests me.

#### Acceptance Criteria

1. THE Quiz_Browser SHALL display all available practice quizzes as cards with title, description, question count, and estimated time.
2. THE Quiz_Browser SHALL display a search input that filters the quiz list by title or description.
3. WHEN a search query is entered, THE Quiz_Browser SHALL update the displayed quiz list to show only quizzes whose title or description contains the query (case-insensitive).
4. WHEN the search query is cleared, THE Quiz_Browser SHALL restore the full quiz list.
5. THE Quiz_Browser SHALL display a "Join Live Game" button that navigates to `/join`.
6. WHEN a student is authenticated, THE Quiz_Browser SHALL display the student's name in the top navigation bar.
7. WHEN a student clicks a quiz card, THE Quiz_Browser SHALL navigate to the Quiz_Player for that quiz.

---

### Requirement 5: Quiz Player

**User Story:** As a student, I want to take a quiz in a focused, distraction-free environment, so that I can test my knowledge effectively.

#### Acceptance Criteria

1. WHEN an authenticated student navigates to `/student/quiz/:id`, THE Quiz_Player SHALL load the quiz without requiring the student to re-enter their name and email.
2. WHEN an unauthenticated user navigates to `/student/quiz/:id`, THE Quiz_Player SHALL display a name and email entry form before starting.
3. THE Quiz_Player SHALL display one question at a time with four answer options.
4. WHEN a student selects an answer, THE Quiz_Player SHALL immediately show whether the answer was correct or incorrect.
5. WHEN the timer expires on a question, THE Quiz_Player SHALL automatically advance to the next question and record the question as unanswered.
6. WHEN a student completes all questions, THE Quiz_Player SHALL display the Results_Page inline or navigate to a results route.
7. WHEN a student completes a quiz and is authenticated, THE Quiz_Player SHALL save a Score_Record to Firestore with the quiz ID, score, percentage, and timestamp.
8. THE Quiz_Player SHALL display a progress indicator showing the current question number out of the total.

---

### Requirement 6: Results Page

**User Story:** As a student, I want to see my quiz results with a breakdown of my answers, so that I can understand what I got right and wrong.

#### Acceptance Criteria

1. THE Results_Page SHALL display the student's final score as a percentage and as a fraction (e.g., "8 / 10").
2. THE Results_Page SHALL display a performance label based on score: "Excellent" (≥ 80%), "Good" (≥ 60%), or "Keep Practicing" (< 60%).
3. THE Results_Page SHALL display each question with the student's selected answer and the correct answer highlighted.
4. WHEN the student's answer was incorrect, THE Results_Page SHALL visually distinguish the student's answer from the correct answer.
5. THE Results_Page SHALL include a "Retake Quiz" button that restarts the same quiz.
6. THE Results_Page SHALL include a "Browse More Quizzes" button that navigates to the Quiz_Browser.
7. WHEN the student is authenticated, THE Results_Page SHALL display a message confirming the score was saved to their profile.

---

### Requirement 7: Live Game Join Flow

**User Story:** As a student, I want to join a live game using a code, so that I can participate in a teacher-hosted quiz session.

#### Acceptance Criteria

1. THE Live_Game join page SHALL be accessible at `/join` and `/join/:code`.
2. WHEN a student enters a valid game code and submits, THE Live_Game join page SHALL navigate to the game session at `/play/:sessionId`.
3. WHEN a student navigates to `/join/:code`, THE Live_Game join page SHALL pre-fill the game code input with the value from the URL parameter.
4. IF a student submits an invalid or expired game code, THEN THE Live_Game join page SHALL display an error message without navigating away.
5. WHEN an authenticated student joins a game, THE Live_Game join page SHALL use the student's saved display name as the default player name.

---

### Requirement 8: Student Navigation and Layout

**User Story:** As a student, I want consistent navigation across all student pages, so that I can move between sections without getting lost.

#### Acceptance Criteria

1. THE Student_Dashboard, Quiz_Browser, and Results_Page SHALL share a consistent top navigation bar with the QuizMaster logo, student name, and a sign-out option.
2. WHEN a student clicks the QuizMaster logo in the student navigation bar, THE navigation bar SHALL navigate to `/student/dashboard` if authenticated, or `/` if unauthenticated.
3. THE student navigation bar SHALL include a link to the Quiz_Browser.
4. THE student navigation bar SHALL include a "Join Live Game" button.
5. WHEN a student clicks "Sign Out" in the navigation bar, THE Auth_System SHALL sign the user out and redirect to `/`.
6. WHERE the student is on a mobile viewport (width < 768px), THE student navigation bar SHALL collapse navigation links into a hamburger menu.
