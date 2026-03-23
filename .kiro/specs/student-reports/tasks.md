# Implementation Plan: Student Reports

## Overview

Implement the Academic Performance reports page for QuizMaster students. Work proceeds in layers: data utilities first, then UI components, then page assembly, then navbar integration.

## Tasks

- [x] 1. Extend data types and install recharts
  - Add optional `subject?: string` and `timeTakenMs?: number` fields to `ScoreRecord` in `src/types/student.ts`
  - Add `recharts` to `package.json` dependencies (`npm install recharts`)
  - _Requirements: 8.1, 8.2_

- [x] 2. Implement report utility functions in `src/utils/reportUtils.ts`
  - [x] 2.1 Implement `deriveSubject`, `percentageToLetterGrade`, `scoreBadgeColor`, `formatDate`, `formatDuration`
    - `deriveSubject(record)`: return `record.subject` if set, else substring before first `":"` in `quizTitle`, else full `quizTitle`
    - `percentageToLetterGrade(pct)`: map to A/A–/B+/B/B–/C+/C/C–/D+/D/F per the threshold table in requirements 5.3
    - `scoreBadgeColor(pct)`: return `#10B981` (≥80), `#F59E0B` (60–79), `#EF4444` (<60)
    - `formatDate(iso)`: return e.g. "Jan 15, 2025" using `Intl.DateTimeFormat`
    - `formatDuration(ms?)`: return "Xm Ys" or "—" if undefined
    - _Requirements: 5.3, 5.4, 6.3, 6.4, 6.5, 8.3, 8.4_

  - [x] 2.2 Write property test for `deriveSubject` (Property 5)
    - **Property 5: Subject derivation follows colon-prefix rule**
    - **Validates: Requirements 5.4, 8.3, 8.4**

  - [x] 2.3 Write property test for `percentageToLetterGrade` (Property 4)
    - **Property 4: Letter grade mapping is exhaustive and monotone**
    - **Validates: Requirements 5.3**

  - [x] 2.4 Write property test for `scoreBadgeColor` (Property 7)
    - **Property 7: Score badge color matches thresholds**
    - **Validates: Requirements 6.3**

  - [x] 2.5 Implement `computeTrendData(records)`
    - Group records by calendar month, average percentages per month, pad to last 6 months with `average: 0, recordCount: 0`
    - Return `TrendDataPoint[]` sorted chronologically
    - _Requirements: 3.2, 3.4_

  - [x] 2.6 Write property test for `computeTrendData` (Properties 1 and 2)
    - **Property 1: Monthly trend grouping averages correctly**
    - **Property 2: Trend output always covers last 6 months**
    - **Validates: Requirements 3.2, 3.4**

  - [x] 2.7 Implement `computeSubjectBreakdown(records)` and `computeInsights(subjects)`
    - `computeSubjectBreakdown`: group by `deriveSubject`, compute average percentage and letter grade per group
    - `computeInsights`: return subject with max average as `coreStrength`, subject with min average as `growthFocus`; return `null` for each when not applicable
    - _Requirements: 4.2, 4.3, 5.1, 5.2_

  - [x] 2.8 Write property test for `computeInsights` (Property 3)
    - **Property 3: Insights derivation is correct**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 2.9 Implement `generateCSV(records)` and sort helper
    - `generateCSV`: produce header row + one data row per record with columns: Quiz Name, Subject, Date, Score, Total, Percentage
    - Sort helper: sort `ScoreRecord[]` descending by `completedAt`
    - _Requirements: 6.1, 7.2, 7.3_

  - [x] 2.10 Write property test for `generateCSV` (Property 8) and sort order (Property 6)
    - **Property 8: CSV contains one row per record with correct columns**
    - **Property 6: Quiz history sort order**
    - **Validates: Requirements 6.1, 7.2, 7.3**

- [x] 3. Checkpoint — Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build report UI components in `src/components/reports/`
  - [x] 4.1 Create `ScoreBadge.tsx`
    - Render a small pill with percentage text, background color from `scoreBadgeColor(percentage)`
    - _Requirements: 6.3_

  - [x] 4.2 Create `PerformanceTrendsChart.tsx`
    - Use recharts `AreaChart` with `Area`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`
    - Props: `data: TrendDataPoint[]`, `yearLabel: string`
    - Area fill: `#6366F1` at 20% opacity, stroke `#6366F1`
    - Display `yearLabel` as a badge in the card header
    - _Requirements: 3.1, 3.3, 3.6, 3.7_

  - [x] 4.3 Create `StrategicInsightsPanel.tsx`
    - Dark card (`background: '#312E81'`, white text)
    - Sections: "CORE STRENGTH" with subject name + grade, "GROWTH FOCUS" with subject name + grade
    - "VIEW FULL ANALYSIS →" anchor scrolls to `#subject-breakdown`
    - Handle null coreStrength/growthFocus with placeholder text
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.4 Create `SubjectBreakdownSection.tsx`
    - Render a row of cards, one per `SubjectSummary`
    - Each card: colored circle avatar with first letter, letter grade badge, subject name, average %, progress bar (`#6366F1`)
    - Empty state when `subjects` is empty
    - Add `id="subject-breakdown"` for scroll target
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

  - [x] 4.5 Create `QuizHistoryTable.tsx`
    - Columns: Quiz Name, Date (`formatDate`), Score (`<ScoreBadge />`), Time Taken (`formatDuration`), Action ("VIEW DETAILS" link)
    - Pagination: 10 rows/page, prev/next controls
    - "Download CSV" button (disabled when records empty) calls `onDownloadCSV` prop
    - Empty state row when no records
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.1, 7.5_

- [x] 5. Assemble `StudentReports` page at `src/pages/StudentReports.tsx`
  - Fetch data via `useStudentStats(uid)`
  - Derive `trendData`, `subjectBreakdown`, `insights` from utility functions
  - Compose layout: page header → trends+insights row → subject breakdown → quiz history table
  - Loading state: spinner/skeleton in place of each section while `loading === true`
  - Empty state: when `records.length === 0`, show `EmptyState` with link to `/student`
  - CSV download handler: call `generateCSV(records)`, trigger browser download with filename `quiz-history-{YYYY-MM-DD}.csv`
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 4.1, 5.1, 6.1, 7.1, 7.4_

- [x] 6. Add Reports route and update `StudentNavbar`
  - [x] 6.1 Register `/student/reports` route in the app router (e.g., `src/App.tsx`) behind the student auth guard
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Update `StudentNavbar` to accept optional `activePage?: string` prop and add "Reports" link
    - Add `<Link to="/student/reports">Reports</Link>` in desktop nav and mobile menu
    - Apply active style (`color: '#6366F1', borderBottom: '2px solid #6366F1'`) when `activePage === 'reports'`
    - Pass `activePage="reports"` from `StudentReports` page
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- recharts must be installed before implementing `PerformanceTrendsChart`
- All inline styles follow the existing QuizMaster visual system (no CSS modules or Tailwind)
- Property tests use fast-check with a minimum of 100 iterations each
- The `timeTakenMs` field on `ScoreRecord` is optional — the table shows "—" when absent
