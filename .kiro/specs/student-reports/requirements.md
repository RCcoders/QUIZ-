# Requirements Document

## Introduction

This document covers the **Student Reports** screen for QuizMaster — an "Academic Performance" page that gives students a rich, data-driven view of their quiz history. The page lives at `/student/reports` and is accessible from the student navigation bar. It surfaces performance trends over time, a subject-wise grade breakdown, a paginated quiz history table with CSV export, and a computed "Strategic Insights" panel — all derived from the student's existing `ScoreRecord` data in Firestore.

The feature also extends `StudentNavbar` with a "Reports" navigation link and adds a `subject` field to `ScoreRecord` to enable subject-level grouping.

---

## Glossary

- **Reports_Page**: The new page at `/student/reports` that displays the student's academic performance data.
- **StudentNavbar**: The shared top navigation bar used across all student pages.
- **ScoreRecord**: A Firestore document recording a student's quiz attempt (`quizId`, `quizTitle`, `score`, `total`, `percentage`, `completedAt`, `subject`).
- **Subject**: A string category tag on a `ScoreRecord` that groups quizzes into academic subjects (e.g., "Mathematics", "Science"). Derived from `quizTitle` prefix when not explicitly set.
- **Performance_Trend**: A monthly aggregation of a student's average quiz scores, used to render the line/area chart.
- **Subject_Breakdown**: A per-subject summary showing letter grade, average percentage, and a progress bar.
- **Letter_Grade**: A single-character grade (A, A–, B+, B, B–, C+, C, D, F) derived from a percentage score.
- **Strategic_Insights**: A computed panel showing the student's strongest subject ("Core Strength") and the subject most in need of improvement ("Growth Focus").
- **Quiz_History_Table**: A paginated table of the student's recent `ScoreRecord` entries with score badge, date, and a detail action.
- **Score_Badge**: A colored label showing the percentage score — green (≥ 80%), yellow (60–79%), red (< 60%).
- **CSV_Export**: A client-side download of the Quiz_History_Table data as a `.csv` file.
- **Empty_State**: The UI shown when a student has no `ScoreRecord` entries yet.

---

## Requirements

### Requirement 1: Reports Navigation Link

**User Story:** As a student, I want a "Reports" link in the navigation bar, so that I can access my performance data from any page.

#### Acceptance Criteria

1. THE StudentNavbar SHALL include a "Reports" navigation link that navigates to `/student/reports`.
2. WHEN a student is on the `/student/reports` page, THE StudentNavbar SHALL visually highlight the "Reports" link as the active tab.
3. THE StudentNavbar SHALL preserve all existing navigation links (Dashboard, Browse Quizzes, Join Live Game) alongside the new Reports link.
4. WHERE the viewport width is less than 768px, THE StudentNavbar SHALL include the "Reports" link in the collapsed hamburger menu.

---

### Requirement 2: Reports Page Access and Layout

**User Story:** As a student, I want a dedicated reports page, so that I can view all my performance data in one place.

#### Acceptance Criteria

1. THE Reports_Page SHALL be accessible at the `/student/reports` route and require authentication.
2. WHEN an unauthenticated user navigates to `/student/reports`, THE Reports_Page SHALL redirect to `/login`.
3. THE Reports_Page SHALL display a page header with the title "Academic Performance" and a descriptive subtitle.
4. THE Reports_Page SHALL use the shared `StudentNavbar` component at the top of the page.
5. THE Reports_Page SHALL use the same visual style as other student pages: background `#F5F5F5`, white cards with `boxShadow: '0 1px 4px rgba(0,0,0,0.08)'`, border-radius 12–16px, Inter font, inline styles.
6. WHILE the student's score data is loading, THE Reports_Page SHALL display a loading skeleton or spinner in place of each data section.
7. WHEN a student has no `ScoreRecord` entries, THE Reports_Page SHALL display an Empty_State with an illustration or icon, a message encouraging the student to complete their first quiz, and a link to the quiz browser.

---

### Requirement 3: Performance Trends Chart

**User Story:** As a student, I want to see a chart of my monthly average scores, so that I can track my progress over time.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a "Performance Trends" section containing a line/area chart of monthly average scores.
2. THE Performance_Trend data SHALL be computed by grouping `ScoreRecord` entries by calendar month and averaging the `percentage` values within each month.
3. THE chart SHALL display months on the x-axis and average score percentage (0–100) on the y-axis.
4. THE chart SHALL show at least the last 6 months of data, padding months with no quiz activity as zero or omitting them with a visible gap.
5. WHEN a student has fewer than 2 months of data, THE Performance_Trend chart SHALL still render with the available data points.
6. THE chart SHALL display a year badge (e.g., "2024–2025") indicating the academic year range of the displayed data.
7. THE chart SHALL use the primary color `#6366F1` for the line/area fill.

---

### Requirement 4: Strategic Insights Panel

**User Story:** As a student, I want to see computed insights about my strengths and areas for improvement, so that I can focus my study efforts.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a "Strategic Insights" panel adjacent to the Performance_Trend chart.
2. THE Strategic_Insights panel SHALL display a "CORE STRENGTH" section identifying the subject with the highest average score.
3. THE Strategic_Insights panel SHALL display a "GROWTH FOCUS" section identifying the subject with the lowest average score.
4. WHEN a student has data in only one subject, THE Strategic_Insights panel SHALL display that subject as the Core Strength and indicate no Growth Focus is available.
5. WHEN a student has no `ScoreRecord` entries, THE Strategic_Insights panel SHALL display placeholder text indicating no data is available.
6. THE Strategic_Insights panel SHALL use a dark indigo/purple background (`#312E81` or similar) with white text to visually distinguish it from other cards.
7. THE Strategic_Insights panel SHALL include a "VIEW FULL ANALYSIS" link that scrolls to or highlights the Subject_Breakdown section.

---

### Requirement 5: Subject-wise Breakdown

**User Story:** As a student, I want to see my performance broken down by subject, so that I can identify which subjects I'm excelling in and which need more attention.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a "Subject-wise Breakdown" section showing one card per subject.
2. EACH subject card SHALL display the subject name, a Letter_Grade, the average score percentage, and a progress bar filled to the average percentage.
3. THE Letter_Grade SHALL be derived from the subject's average percentage using the following mapping:
   - ≥ 93% → A
   - ≥ 90% → A–
   - ≥ 87% → B+
   - ≥ 83% → B
   - ≥ 80% → B–
   - ≥ 77% → C+
   - ≥ 73% → C
   - ≥ 70% → C–
   - ≥ 67% → D+
   - ≥ 60% → D
   - < 60% → F
4. THE subject grouping SHALL use the `subject` field on `ScoreRecord` when present, and SHALL fall back to extracting the first word or prefix of `quizTitle` when `subject` is absent.
5. THE progress bar SHALL use the primary color `#6366F1` and SHALL be proportional to the average percentage (0–100%).
6. WHEN a student has no records for any subject, THE Subject_Breakdown section SHALL display the Empty_State.

---

### Requirement 6: Recent Quiz History Table

**User Story:** As a student, I want to see a table of my recent quiz attempts, so that I can review my performance history at a glance.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a "Recent Quiz History" table showing the student's `ScoreRecord` entries sorted by `completedAt` descending (most recent first).
2. THE Quiz_History_Table SHALL include the following columns: Quiz Name, Date, Score (as a Score_Badge), Time Taken, and Action.
3. THE Score_Badge SHALL be color-coded: green (`#10B981`) for percentage ≥ 80%, yellow (`#F59E0B`) for 60–79%, red (`#EF4444`) for < 60%.
4. THE "Date" column SHALL display the `completedAt` value formatted as a human-readable date (e.g., "Jan 15, 2025").
5. THE "Time Taken" column SHALL display a placeholder value (e.g., "—") when time data is not available on the `ScoreRecord`.
6. THE "Action" column SHALL display a "VIEW DETAILS" link for each row.
7. WHEN a student clicks "VIEW DETAILS", THE Reports_Page SHALL navigate to the quiz results or quiz detail page for that `ScoreRecord`.
8. THE Quiz_History_Table SHALL display a maximum of 10 records per page and include pagination controls when there are more than 10 records.
9. WHEN a student has no `ScoreRecord` entries, THE Quiz_History_Table SHALL display an empty state row with a message.

---

### Requirement 7: CSV Export

**User Story:** As a student, I want to download my quiz history as a CSV file, so that I can keep a personal record or share it with a teacher.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a "Download CSV" button above or within the Quiz_History_Table.
2. WHEN a student clicks "Download CSV", THE Reports_Page SHALL generate and download a `.csv` file containing all of the student's `ScoreRecord` entries (not just the current page).
3. THE CSV file SHALL include the following columns: Quiz Name, Subject, Date, Score, Total, Percentage.
4. THE CSV file SHALL be named `quiz-history-{YYYY-MM-DD}.csv` using the current date.
5. WHEN a student has no `ScoreRecord` entries, THE "Download CSV" button SHALL be disabled.

---

### Requirement 8: Subject Field on ScoreRecord

**User Story:** As a developer, I want `ScoreRecord` to carry a `subject` field, so that the Reports page can group quiz attempts by academic subject.

#### Acceptance Criteria

1. THE `ScoreRecord` type SHALL include an optional `subject` field of type `string`.
2. WHEN a new `ScoreRecord` is saved to Firestore, THE system SHALL include the `subject` field if it is available from the quiz metadata.
3. WHEN the `subject` field is absent on a `ScoreRecord`, THE Reports_Page SHALL derive a subject label from the `quizTitle` using a deterministic fallback strategy.
4. THE fallback strategy SHALL extract the first colon-delimited prefix from `quizTitle` (e.g., `"Math: Algebra"` → `"Math"`), and if no colon is present, SHALL use the full `quizTitle` as the subject label.
