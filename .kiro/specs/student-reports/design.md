# Design Document: Student Reports

## Overview

The Student Reports feature adds an "Academic Performance" page at `/student/reports` that gives students a rich, data-driven view of their quiz history. It is built entirely on top of the existing `ScoreRecord` Firestore data — no new backend endpoints are needed.

The page has four main sections:
1. **Performance Trends** — a recharts area chart of monthly average scores
2. **Strategic Insights** — a computed panel showing strongest and weakest subjects
3. **Subject-wise Breakdown** — per-subject letter grade cards
4. **Recent Quiz History** — a paginated table with CSV export

The feature also extends `StudentNavbar` with a "Reports" tab and adds an optional `subject` field to `ScoreRecord`.

---

## Architecture

```mermaid
graph TD
    A[/student/reports] --> B[StudentReports page]
    B --> C[StudentNavbar - Reports tab active]
    B --> D[useStudentStats hook]
    D --> E[getScoreRecords - Firestore]
    B --> F[computeTrendData]
    B --> G[computeSubjectBreakdown]
    B --> H[computeInsights]
    B --> I[generateCSV]

    F --> J[PerformanceTrendsChart - recharts]
    G --> K[SubjectBreakdownCards]
    H --> L[StrategicInsightsPanel]
    D --> M[QuizHistoryTable]
    M --> N[CSV download]
```

### Route Map Addition

| Route | Component | Auth Required |
|---|---|---|
| `/student/reports` | `StudentReports` | Yes (student) |

---

## Components and Interfaces

### New Components

#### `StudentReports` (`src/pages/StudentReports.tsx`)
The top-level page component. Fetches data via `useStudentStats`, derives all computed values, and composes the four sections. Handles loading and empty states.

```typescript
// Layout structure
<div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
  <StudentNavbar activePage="reports" />
  <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
    <PageHeader />
    <TrendsAndInsightsRow>
      <PerformanceTrendsChart data={trendData} />
      <StrategicInsightsPanel insights={insights} />
    </TrendsAndInsightsRow>
    <SubjectBreakdownSection subjects={subjectBreakdown} />
    <QuizHistoryTable records={records} />
  </main>
</div>
```

#### `PerformanceTrendsChart` (`src/components/reports/PerformanceTrendsChart.tsx`)
Wraps a recharts `AreaChart` with the monthly trend data. Uses `#6366F1` for the area fill with 20% opacity and a solid stroke.

Props:
```typescript
interface PerformanceTrendsChartProps {
  data: TrendDataPoint[];
  yearLabel: string; // e.g. "2024–2025"
}
```

#### `StrategicInsightsPanel` (`src/components/reports/StrategicInsightsPanel.tsx`)
Dark-background card showing core strength and growth focus. Includes a "VIEW FULL ANALYSIS →" anchor that scrolls to the subject breakdown section.

Props:
```typescript
interface StrategicInsightsPanelProps {
  coreStrength: SubjectInsight | null;
  growthFocus: SubjectInsight | null;
}
```

#### `SubjectBreakdownSection` (`src/components/reports/SubjectBreakdownSection.tsx`)
Renders a horizontal scrollable row of subject cards. Each card shows the subject icon (a colored circle with the first letter), letter grade, subject name, average percentage, and a progress bar.

Props:
```typescript
interface SubjectBreakdownSectionProps {
  subjects: SubjectSummary[];
}
```

#### `QuizHistoryTable` (`src/components/reports/QuizHistoryTable.tsx`)
Paginated table (10 rows/page) with columns: Quiz Name, Date, Score Badge, Time Taken, Action. Includes the "Download CSV" button.

Props:
```typescript
interface QuizHistoryTableProps {
  records: ScoreRecord[];
  onDownloadCSV: () => void;
}
```

#### `ScoreBadge` (`src/components/reports/ScoreBadge.tsx`)
Small inline badge component. Color-coded by percentage threshold.

Props:
```typescript
interface ScoreBadgeProps {
  percentage: number;
}
```

### Modified Components

#### `StudentNavbar` (`src/components/StudentNavbar.tsx`)
- Add an optional `activePage?: string` prop.
- Add a "Reports" `<Link to="/student/reports">` in the desktop nav and mobile menu.
- Apply an active style (e.g., `color: '#6366F1', borderBottom: '2px solid #6366F1'`) when `activePage === 'reports'`.

---

## Data Models

### Extended `ScoreRecord` (`src/types/student.ts`)

```typescript
export interface ScoreRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string; // ISO timestamp
  subject?: string;    // NEW — optional subject tag
  timeTakenMs?: number; // NEW — optional duration in ms
}
```

### Derived Types (`src/utils/reportUtils.ts`)

```typescript
export interface TrendDataPoint {
  month: string;       // "Sep", "Oct", etc.
  average: number;     // 0–100, rounded
  recordCount: number;
}

export interface SubjectSummary {
  subject: string;
  averagePercentage: number;
  letterGrade: string;
  recordCount: number;
}

export interface SubjectInsight {
  subject: string;
  averagePercentage: number;
  letterGrade: string;
}

export interface ReportInsights {
  coreStrength: SubjectInsight | null;
  growthFocus: SubjectInsight | null;
}
```

### Utility Functions (`src/utils/reportUtils.ts`)

```typescript
// Groups records by calendar month, averages percentages, pads to last 6 months
export function computeTrendData(records: ScoreRecord[]): TrendDataPoint[]

// Groups records by subject (using subject field or quizTitle prefix fallback),
// computes average percentage and letter grade per subject
export function computeSubjectBreakdown(records: ScoreRecord[]): SubjectSummary[]

// Derives subject label: colon-prefix of quizTitle, or full quizTitle if no colon
export function deriveSubject(record: ScoreRecord): string

// Maps percentage to letter grade per the defined threshold table
export function percentageToLetterGrade(percentage: number): string

// Returns core strength (max avg) and growth focus (min avg) from subject summaries
export function computeInsights(subjects: SubjectSummary[]): ReportInsights

// Maps percentage to Score_Badge color
export function scoreBadgeColor(percentage: number): string

// Converts ScoreRecord array to a CSV string
export function generateCSV(records: ScoreRecord[]): string

// Formats ISO timestamp to "Jan 15, 2025"
export function formatDate(isoString: string): string

// Formats ms duration to "2m 30s", returns "—" for undefined
export function formatDuration(ms: number | undefined): string
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Monthly trend grouping averages correctly

*For any* array of `ScoreRecord` objects, `computeTrendData` SHALL produce output where each month's `average` equals the arithmetic mean (rounded to the nearest integer) of the `percentage` values of all records whose `completedAt` falls within that calendar month.

**Validates: Requirements 3.2**

---

### Property 2: Trend output always covers last 6 months

*For any* array of `ScoreRecord` objects (including empty), `computeTrendData` SHALL return exactly 6 data points corresponding to the 6 most recent calendar months, with `average: 0` and `recordCount: 0` for months with no records.

**Validates: Requirements 3.4**

---

### Property 3: Insights derivation is correct

*For any* non-empty array of `SubjectSummary` objects, `computeInsights` SHALL return a `coreStrength` whose `averagePercentage` is greater than or equal to every other subject's `averagePercentage`, and a `growthFocus` whose `averagePercentage` is less than or equal to every other subject's `averagePercentage`.

**Validates: Requirements 4.2, 4.3**

---

### Property 4: Letter grade mapping is exhaustive and monotone

*For any* integer percentage in [0, 100], `percentageToLetterGrade` SHALL return a non-empty string from the defined grade set {A, A–, B+, B, B–, C+, C, C–, D+, D, F}, and for any two percentages p1 ≥ p2, the grade of p1 SHALL be greater than or equal to the grade of p2 in the defined ordering.

**Validates: Requirements 5.3**

---

### Property 5: Subject derivation follows colon-prefix rule

*For any* `ScoreRecord`, `deriveSubject` SHALL return the `subject` field if it is a non-empty string; otherwise it SHALL return the substring of `quizTitle` before the first `":"` character if one exists, or the full `quizTitle` if no `":"` is present.

**Validates: Requirements 5.4, 8.3, 8.4**

---

### Property 6: Quiz history sort order

*For any* array of `ScoreRecord` objects passed to the sort used in `QuizHistoryTable`, the resulting order SHALL be descending by `completedAt` — that is, for every adjacent pair (a, b) in the output, `a.completedAt >= b.completedAt`.

**Validates: Requirements 6.1**

---

### Property 7: Score badge color matches thresholds

*For any* integer percentage in [0, 100], `scoreBadgeColor` SHALL return `#10B981` when percentage ≥ 80, `#F59E0B` when 60 ≤ percentage < 80, and `#EF4444` when percentage < 60.

**Validates: Requirements 6.3**

---

### Property 8: CSV contains one row per record with correct columns

*For any* non-empty array of `ScoreRecord` objects, `generateCSV` SHALL return a string where the number of data rows (excluding the header) equals the length of the input array, and each row contains the quiz name, subject, date, score, total, and percentage values from the corresponding record.

**Validates: Requirements 7.2, 7.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Firestore read fails | Show error banner "Unable to load your reports. Please try again." with a retry button |
| No score records | Show `Empty_State` component with link to `/student` |
| `ScoreRecord` missing `subject` field | `deriveSubject` falls back to `quizTitle` prefix — no error thrown |
| `ScoreRecord` missing `timeTakenMs` | `formatDuration(undefined)` returns `"—"` |
| recharts not installed | Build will fail — add `recharts` to `package.json` as part of implementation |
| CSV download in unsupported browser | Use `URL.createObjectURL` with a fallback `window.open` for older browsers |
| Single subject (no growth focus) | `computeInsights` returns `growthFocus: null`; panel shows "No comparison data yet" |

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on specific examples and edge cases for the utility functions:

- `deriveSubject`: record with `subject` set, record with colon in title, record with no colon, empty title.
- `percentageToLetterGrade`: boundary values at each threshold (93, 90, 87, 83, 80, 77, 73, 70, 67, 60, 59).
- `scoreBadgeColor`: values at 80, 79, 60, 59, 0, 100.
- `formatDate`: valid ISO string, edge case of midnight UTC.
- `formatDuration`: undefined input returns `"—"`, 0ms, 90000ms (1m 30s).
- `generateCSV`: empty array produces header-only output, single record, special characters in quiz title.
- `computeInsights`: empty array returns both null, single subject returns coreStrength only, two subjects.

### Property-Based Tests (fast-check + Vitest)

Each property test runs a minimum of 100 iterations.

- **Property 1** — Monthly trend averages: generate random `ScoreRecord` arrays with varied `completedAt` dates and `percentage` values in [0,100]. Assert each month bucket's average equals the mean of its records' percentages.
  - Tag: `Feature: student-reports, Property 1: monthly trend grouping averages correctly`

- **Property 2** — Trend covers 6 months: generate random `ScoreRecord` arrays (including empty). Assert `computeTrendData` always returns exactly 6 items.
  - Tag: `Feature: student-reports, Property 2: trend output always covers last 6 months`

- **Property 3** — Insights derivation: generate random arrays of `SubjectSummary` with at least 1 entry. Assert `coreStrength.averagePercentage >= all others` and `growthFocus.averagePercentage <= all others`.
  - Tag: `Feature: student-reports, Property 3: insights derivation is correct`

- **Property 4** — Letter grade exhaustive and monotone: generate integer percentages in [0,100]. Assert result is always in the valid grade set. Generate pairs (p1, p2) where p1 >= p2 and assert grade ordering is preserved.
  - Tag: `Feature: student-reports, Property 4: letter grade mapping is exhaustive and monotone`

- **Property 5** — Subject derivation: generate `ScoreRecord` objects with and without `subject` field, with and without colons in `quizTitle`. Assert the colon-prefix rule is followed.
  - Tag: `Feature: student-reports, Property 5: subject derivation follows colon-prefix rule`

- **Property 6** — Sort order: generate random `ScoreRecord` arrays. Assert the sorted output is descending by `completedAt`.
  - Tag: `Feature: student-reports, Property 6: quiz history sort order`

- **Property 7** — Score badge color: generate integer percentages in [0,100]. Assert the returned color matches the threshold rules.
  - Tag: `Feature: student-reports, Property 7: score badge color matches thresholds`

- **Property 8** — CSV row count: generate random non-empty `ScoreRecord` arrays. Assert the CSV has exactly `records.length + 1` lines (header + data rows) and each data row contains the expected field values.
  - Tag: `Feature: student-reports, Property 8: CSV contains one row per record with correct columns`

### Component Tests

- `StudentNavbar` with `activePage="reports"`: assert Reports link is present and has active styles.
- `StudentReports` with `loading=true`: assert loading skeleton is rendered.
- `StudentReports` with empty records: assert empty state message is shown.
- `ScoreBadge`: renders green/yellow/red for representative percentage values.
- `QuizHistoryTable`: renders correct number of rows, pagination controls appear when > 10 records.
