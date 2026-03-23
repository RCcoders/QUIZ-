import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  deriveSubject,
  percentageToLetterGrade,
  scoreBadgeColor,
  computeTrendData,
  computeSubjectBreakdown,
  computeInsights,
  generateCSV,
  sortRecordsDescending,
} from './reportUtils';
import type { ScoreRecord } from '../types/student';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    id: 'r1',
    quizId: 'q1',
    quizTitle: 'Test Quiz',
    score: 7,
    total: 10,
    percentage: 70,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Arbitrary for a ScoreRecord with percentage in [0, 100]
const arbScoreRecord = fc.record({
  id: fc.string(),
  quizId: fc.string(),
  quizTitle: fc.string({ minLength: 1 }),
  score: fc.nat(100),
  total: fc.integer({ min: 1, max: 100 }),
  percentage: fc.integer({ min: 0, max: 100 }),
  completedAt: fc
    .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
    .map(ms => new Date(ms).toISOString()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5: Subject derivation follows colon-prefix rule
// Validates: Requirements 5.4, 8.3, 8.4
// ─────────────────────────────────────────────────────────────────────────────
describe('deriveSubject – unit tests', () => {
  it('returns subject field when set', () => {
    expect(deriveSubject(makeRecord({ subject: 'Mathematics' }))).toBe('Mathematics');
  });
  it('returns colon-prefix of quizTitle when subject absent', () => {
    expect(deriveSubject(makeRecord({ quizTitle: 'Math: Algebra', subject: undefined }))).toBe('Math');
  });
  it('returns full quizTitle when no colon and no subject', () => {
    expect(deriveSubject(makeRecord({ quizTitle: 'General Knowledge', subject: undefined }))).toBe('General Knowledge');
  });
  it('ignores empty string subject and falls back to quizTitle', () => {
    expect(deriveSubject(makeRecord({ quizTitle: 'Science: Biology', subject: '' }))).toBe('Science');
  });
});

describe('deriveSubject – Property 5: subject derivation follows colon-prefix rule', () => {
  it('Property 5 – returns subject field when non-empty', () => {
    fc.assert(
      fc.property(
        arbScoreRecord,
        fc.string({ minLength: 1 }),
        (record, subject) => {
          const r = { ...record, subject };
          return deriveSubject(r) === subject;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5 – returns colon-prefix when subject absent and colon present', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.includes(':')),
        fc.string({ minLength: 1 }),
        (prefix, suffix) => {
          const record = makeRecord({ quizTitle: `${prefix}:${suffix}`, subject: undefined });
          return deriveSubject(record) === prefix;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5 – returns full quizTitle when subject absent and no colon', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.includes(':')),
        (title) => {
          const record = makeRecord({ quizTitle: title, subject: undefined });
          return deriveSubject(record) === title;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: Letter grade mapping is exhaustive and monotone
// Validates: Requirements 5.3
// ─────────────────────────────────────────────────────────────────────────────
const VALID_GRADES = new Set(['A', 'A–', 'B+', 'B', 'B–', 'C+', 'C', 'C–', 'D+', 'D', 'F']);

// Grade ordering: higher index = lower grade
const GRADE_ORDER = ['A', 'A–', 'B+', 'B', 'B–', 'C+', 'C', 'C–', 'D+', 'D', 'F'];

describe('percentageToLetterGrade – unit tests', () => {
  it('returns A for 100', () => expect(percentageToLetterGrade(100)).toBe('A'));
  it('returns A for 93', () => expect(percentageToLetterGrade(93)).toBe('A'));
  it('returns A– for 90', () => expect(percentageToLetterGrade(90)).toBe('A–'));
  it('returns B+ for 87', () => expect(percentageToLetterGrade(87)).toBe('B+'));
  it('returns B for 83', () => expect(percentageToLetterGrade(83)).toBe('B'));
  it('returns B– for 80', () => expect(percentageToLetterGrade(80)).toBe('B–'));
  it('returns C+ for 77', () => expect(percentageToLetterGrade(77)).toBe('C+'));
  it('returns C for 73', () => expect(percentageToLetterGrade(73)).toBe('C'));
  it('returns C– for 70', () => expect(percentageToLetterGrade(70)).toBe('C–'));
  it('returns D+ for 67', () => expect(percentageToLetterGrade(67)).toBe('D+'));
  it('returns D for 60', () => expect(percentageToLetterGrade(60)).toBe('D'));
  it('returns F for 59', () => expect(percentageToLetterGrade(59)).toBe('F'));
  it('returns F for 0', () => expect(percentageToLetterGrade(0)).toBe('F'));
});

describe('percentageToLetterGrade – Property 4: exhaustive and monotone', () => {
  it('Property 4 – result is always a valid grade', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (pct) => {
        return VALID_GRADES.has(percentageToLetterGrade(pct));
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4 – grade ordering is monotone (higher pct => same or better grade)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (p1, p2) => {
          const higher = Math.max(p1, p2);
          const lower = Math.min(p1, p2);
          const gradeHigher = GRADE_ORDER.indexOf(percentageToLetterGrade(higher));
          const gradeLower = GRADE_ORDER.indexOf(percentageToLetterGrade(lower));
          // Higher percentage should have a grade index <= lower (better or equal grade)
          return gradeHigher <= gradeLower;
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 7: Score badge color matches thresholds
// Validates: Requirements 6.3
// ─────────────────────────────────────────────────────────────────────────────
describe('scoreBadgeColor – unit tests', () => {
  it('returns green for 100', () => expect(scoreBadgeColor(100)).toBe('#10B981'));
  it('returns green for 80', () => expect(scoreBadgeColor(80)).toBe('#10B981'));
  it('returns yellow for 79', () => expect(scoreBadgeColor(79)).toBe('#F59E0B'));
  it('returns yellow for 60', () => expect(scoreBadgeColor(60)).toBe('#F59E0B'));
  it('returns red for 59', () => expect(scoreBadgeColor(59)).toBe('#EF4444'));
  it('returns red for 0', () => expect(scoreBadgeColor(0)).toBe('#EF4444'));
});

describe('scoreBadgeColor – Property 7: color matches thresholds', () => {
  it('Property 7 – correct color for all percentages in [0, 100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (pct) => {
        const color = scoreBadgeColor(pct);
        if (pct >= 80) return color === '#10B981';
        if (pct >= 60) return color === '#F59E0B';
        return color === '#EF4444';
      }),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Properties 1 & 2: computeTrendData
// Validates: Requirements 3.2, 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('computeTrendData – unit tests', () => {
  it('returns exactly 6 items for empty array', () => {
    expect(computeTrendData([])).toHaveLength(6);
  });

  it('all items have recordCount 0 and average 0 for empty array', () => {
    const result = computeTrendData([]);
    result.forEach(p => {
      expect(p.recordCount).toBe(0);
      expect(p.average).toBe(0);
    });
  });

  it('correctly averages records in the current month', () => {
    const now = new Date();
    const iso = now.toISOString();
    const records = [
      makeRecord({ percentage: 80, completedAt: iso }),
      makeRecord({ percentage: 60, completedAt: iso }),
    ];
    const result = computeTrendData(records);
    const lastPoint = result[result.length - 1];
    expect(lastPoint.average).toBe(70);
    expect(lastPoint.recordCount).toBe(2);
  });
});

describe('computeTrendData – Properties 1 & 2', () => {
  it('Property 2 – always returns exactly 6 data points', () => {
    fc.assert(
      fc.property(fc.array(arbScoreRecord), (records) => {
        return computeTrendData(records).length === 6;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 1 – each month average equals arithmetic mean of its records', () => {
    fc.assert(
      fc.property(fc.array(arbScoreRecord, { minLength: 1, maxLength: 50 }), (records) => {
        const result = computeTrendData(records);

        // Build the same 6-month window the implementation uses
        const now = new Date();
        const windowKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          windowKeys.push(
            `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
          );
        }

        for (let idx = 0; idx < result.length; idx++) {
          const point = result[idx];
          const key = windowKeys[idx];
          const matchingRecords = records.filter(r => {
            const d = new Date(r.completedAt);
            const rKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
            return rKey === key;
          });
          if (matchingRecords.length === 0) {
            if (point.average !== 0 || point.recordCount !== 0) return false;
          } else {
            const expectedAvg = Math.round(
              matchingRecords.reduce((s, r) => s + r.percentage, 0) / matchingRecords.length
            );
            if (point.average !== expectedAvg) return false;
            if (point.recordCount !== matchingRecords.length) return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: Insights derivation is correct
// Validates: Requirements 4.2, 4.3
// ─────────────────────────────────────────────────────────────────────────────
describe('computeInsights – unit tests', () => {
  it('returns both null for empty subjects', () => {
    const result = computeInsights([]);
    expect(result.coreStrength).toBeNull();
    expect(result.growthFocus).toBeNull();
  });

  it('returns coreStrength only for single subject', () => {
    const subjects = [{ subject: 'Math', averagePercentage: 75, letterGrade: 'C', recordCount: 2 }];
    const result = computeInsights(subjects);
    expect(result.coreStrength?.subject).toBe('Math');
    expect(result.growthFocus).toBeNull();
  });

  it('correctly identifies max and min for two subjects', () => {
    const subjects = [
      { subject: 'Math', averagePercentage: 90, letterGrade: 'A–', recordCount: 3 },
      { subject: 'Science', averagePercentage: 55, letterGrade: 'F', recordCount: 2 },
    ];
    const result = computeInsights(subjects);
    expect(result.coreStrength?.subject).toBe('Math');
    expect(result.growthFocus?.subject).toBe('Science');
  });
});

const arbSubjectSummary = fc.record({
  subject: fc.string({ minLength: 1 }),
  averagePercentage: fc.integer({ min: 0, max: 100 }),
  letterGrade: fc.constantFrom('A', 'B', 'C', 'D', 'F'),
  recordCount: fc.integer({ min: 1, max: 50 }),
});

describe('computeInsights – Property 3: insights derivation is correct', () => {
  it('Property 3 – coreStrength has max averagePercentage', () => {
    fc.assert(
      fc.property(fc.array(arbSubjectSummary, { minLength: 1 }), (subjects) => {
        const { coreStrength } = computeInsights(subjects);
        if (!coreStrength) return false;
        return subjects.every(s => coreStrength.averagePercentage >= s.averagePercentage);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3 – growthFocus has min averagePercentage (when multiple subjects)', () => {
    fc.assert(
      fc.property(fc.array(arbSubjectSummary, { minLength: 2 }), (subjects) => {
        const { growthFocus } = computeInsights(subjects);
        if (!growthFocus) return false;
        return subjects.every(s => growthFocus.averagePercentage <= s.averagePercentage);
      }),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Properties 6 & 8: sortRecordsDescending and generateCSV
// Validates: Requirements 6.1, 7.2, 7.3
// ─────────────────────────────────────────────────────────────────────────────
describe('sortRecordsDescending – unit tests', () => {
  it('returns empty array for empty input', () => {
    expect(sortRecordsDescending([])).toHaveLength(0);
  });

  it('sorts descending by completedAt', () => {
    const records = [
      makeRecord({ completedAt: '2024-01-01T00:00:00.000Z' }),
      makeRecord({ completedAt: '2024-03-01T00:00:00.000Z' }),
      makeRecord({ completedAt: '2024-02-01T00:00:00.000Z' }),
    ];
    const sorted = sortRecordsDescending(records);
    expect(sorted[0].completedAt).toBe('2024-03-01T00:00:00.000Z');
    expect(sorted[1].completedAt).toBe('2024-02-01T00:00:00.000Z');
    expect(sorted[2].completedAt).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('sortRecordsDescending – Property 6: quiz history sort order', () => {
  it('Property 6 – adjacent pairs are always descending by completedAt', () => {
    fc.assert(
      fc.property(fc.array(arbScoreRecord), (records) => {
        const sorted = sortRecordsDescending(records);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].completedAt < sorted[i + 1].completedAt) return false;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('generateCSV – unit tests', () => {
  it('returns header-only for empty array', () => {
    const csv = generateCSV([]);
    expect(csv).toBe('Quiz Name,Subject,Date,Score,Total,Percentage');
  });

  it('produces header + 1 data row for single record', () => {
    const csv = generateCSV([makeRecord({ quizTitle: 'Math Quiz', score: 8, total: 10, percentage: 80 })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Quiz Name,Subject,Date,Score,Total,Percentage');
  });
});

describe('generateCSV – Property 8: CSV contains one row per record with correct columns', () => {
  it('Property 8 – number of data rows equals number of records', () => {
    fc.assert(
      fc.property(fc.array(arbScoreRecord, { minLength: 1 }), (records) => {
        const csv = generateCSV(records);
        const lines = csv.split('\n');
        // header + one row per record
        return lines.length === records.length + 1;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 8 – each data row contains score, total, and percentage values', () => {
    fc.assert(
      fc.property(fc.array(arbScoreRecord, { minLength: 1, maxLength: 20 }), (records) => {
        const csv = generateCSV(records);
        const lines = csv.split('\n');
        for (let i = 0; i < records.length; i++) {
          const row = lines[i + 1];
          const r = records[i];
          if (!row.includes(String(r.score))) return false;
          if (!row.includes(String(r.total))) return false;
          if (!row.includes(String(r.percentage))) return false;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
