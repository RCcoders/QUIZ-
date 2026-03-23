import type { ScoreRecord } from '../types/student';

// ─── Derived Types ────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  month: string;       // e.g. "Sep", "Oct"
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

// ─── Simple Utilities ─────────────────────────────────────────────────────────

/**
 * Derives a subject label from a ScoreRecord.
 * Priority: subject field > colon-prefix of quizTitle > full quizTitle
 */
export function deriveSubject(record: ScoreRecord): string {
  if (record.subject !== undefined && record.subject !== '') {
    return record.subject;
  }
  const colonIdx = record.quizTitle.indexOf(':');
  if (colonIdx !== -1) {
    return record.quizTitle.substring(0, colonIdx);
  }
  return record.quizTitle;
}

/**
 * Maps a percentage (0–100) to a letter grade per the defined threshold table.
 */
export function percentageToLetterGrade(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A–';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B–';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C–';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

/**
 * Returns the Score_Badge background color for a given percentage.
 * Green ≥ 80, Yellow 60–79, Red < 60
 */
export function scoreBadgeColor(pct: number): string {
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
}

/**
 * Formats an ISO timestamp to a human-readable date, e.g. "Jan 15, 2025".
 */
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoString));
}

/**
 * Formats a duration in milliseconds to "Xm Ys". Returns "—" if undefined.
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// ─── Trend Data ───────────────────────────────────────────────────────────────

/**
 * Groups records by calendar month, averages percentages per month,
 * and pads to the last 6 months (chronological order).
 */
export function computeTrendData(records: ScoreRecord[]): TrendDataPoint[] {
  // Build a map: "YYYY-MM" -> { sum, count }
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const record of records) {
    const date = new Date(record.completedAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const existing = buckets.get(key) ?? { sum: 0, count: 0 };
    buckets.set(key, { sum: existing.sum + record.percentage, count: existing.count + 1 });
  }

  // Generate the last 6 calendar months (ending with current month)
  const now = new Date();
  const result: TrendDataPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const bucket = buckets.get(key);
    result.push({
      month,
      average: bucket ? Math.round(bucket.sum / bucket.count) : 0,
      recordCount: bucket ? bucket.count : 0,
    });
  }

  return result;
}

// ─── Subject Breakdown & Insights ────────────────────────────────────────────

/**
 * Groups records by derived subject, computes average percentage and letter grade.
 */
export function computeSubjectBreakdown(records: ScoreRecord[]): SubjectSummary[] {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const record of records) {
    const subject = deriveSubject(record);
    const existing = buckets.get(subject) ?? { sum: 0, count: 0 };
    buckets.set(subject, { sum: existing.sum + record.percentage, count: existing.count + 1 });
  }

  const result: SubjectSummary[] = [];
  for (const [subject, { sum, count }] of buckets) {
    const averagePercentage = Math.round(sum / count);
    result.push({
      subject,
      averagePercentage,
      letterGrade: percentageToLetterGrade(averagePercentage),
      recordCount: count,
    });
  }

  return result;
}

/**
 * Returns the subject with the highest average as coreStrength and
 * the subject with the lowest average as growthFocus.
 * Returns null for each when not applicable.
 */
export function computeInsights(subjects: SubjectSummary[]): ReportInsights {
  if (subjects.length === 0) {
    return { coreStrength: null, growthFocus: null };
  }

  let maxSubject = subjects[0];
  let minSubject = subjects[0];

  for (const s of subjects) {
    if (s.averagePercentage > maxSubject.averagePercentage) maxSubject = s;
    if (s.averagePercentage < minSubject.averagePercentage) minSubject = s;
  }

  const coreStrength: SubjectInsight = {
    subject: maxSubject.subject,
    averagePercentage: maxSubject.averagePercentage,
    letterGrade: maxSubject.letterGrade,
  };

  // Only set growthFocus when there are at least 2 distinct subjects
  const growthFocus: SubjectInsight | null =
    subjects.length > 1
      ? {
          subject: minSubject.subject,
          averagePercentage: minSubject.averagePercentage,
          letterGrade: minSubject.letterGrade,
        }
      : null;

  return { coreStrength, growthFocus };
}

// ─── CSV & Sort ───────────────────────────────────────────────────────────────

/**
 * Sorts ScoreRecord[] descending by completedAt (most recent first).
 */
export function sortRecordsDescending(records: ScoreRecord[]): ScoreRecord[] {
  return [...records].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

/**
 * Generates a CSV string from an array of ScoreRecords.
 * Columns: Quiz Name, Subject, Date, Score, Total, Percentage
 */
export function generateCSV(records: ScoreRecord[]): string {
  const header = 'Quiz Name,Subject,Date,Score,Total,Percentage';
  const rows = records.map(r => {
    const quizName = `"${r.quizTitle.replace(/"/g, '""')}"`;
    const subject = `"${deriveSubject(r).replace(/"/g, '""')}"`;
    const date = formatDate(r.completedAt);
    return `${quizName},${subject},${date},${r.score},${r.total},${r.percentage}`;
  });
  return [header, ...rows].join('\n');
}
