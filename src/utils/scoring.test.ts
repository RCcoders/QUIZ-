import { describe, it } from 'vitest';
import { expect } from 'vitest';
import * as fc from 'fast-check';
import {
    getRedirectPath,
    getPerformanceLabel,
    computeAverageScore,
    computeStreak,
} from './scoring';
import type { ScoreRecord } from '../types/student';

// Helper: build a minimal ScoreRecord for property tests
function makeRecord(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
    return {
        id: 'test',
        quizId: 'q1',
        quizTitle: 'Test Quiz',
        score: 5,
        total: 10,
        percentage: 50,
        completedAt: new Date().toISOString(),
        ...overrides,
    };
}

// Arbitrary: ScoreRecord with percentage in [0, 100]
const arbScoreRecord = fc.record({
    id: fc.string(),
    quizId: fc.string(),
    quizTitle: fc.string(),
    score: fc.nat(100),
    total: fc.integer({ min: 1, max: 100 }),
    percentage: fc.integer({ min: 0, max: 100 }),
    completedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
        .map(ms => new Date(ms).toISOString()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 8: Role-based redirect is exhaustive
// Validates: Requirements 2.1, 2.2, 2.3, 2.4
// ─────────────────────────────────────────────────────────────────────────────
describe('getRedirectPath', () => {
    it('Property 8 – student role always redirects to /student/dashboard', () => {
        fc.assert(
            fc.property(fc.constant('student'), (role) => {
                return getRedirectPath(role) === '/student/dashboard';
            }),
            { numRuns: 100 }
        );
    });

    it('Property 8 – teacher role always redirects to /teacher', () => {
        fc.assert(
            fc.property(fc.constant('teacher'), (role) => {
                return getRedirectPath(role) === '/teacher';
            }),
            { numRuns: 100 }
        );
    });

    it('Property 8 – any unknown role defaults to /student/dashboard', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== 'student' && s !== 'teacher'),
                (role) => {
                    return getRedirectPath(role) === '/student/dashboard';
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 8 – result is always one of the two valid paths', () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.constant('student'), fc.constant('teacher'), fc.string()),
                (role) => {
                    const path = getRedirectPath(role);
                    return path === '/student/dashboard' || path === '/teacher';
                }
            ),
            { numRuns: 200 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: getPerformanceLabel boundary values
// Validates: Requirements 6.2
// ─────────────────────────────────────────────────────────────────────────────
describe('getPerformanceLabel – unit tests', () => {
    it('returns "Keep Practicing" for 0', () => {
        expect(getPerformanceLabel(0)).toBe('Keep Practicing');
    });
    it('returns "Keep Practicing" for 59', () => {
        expect(getPerformanceLabel(59)).toBe('Keep Practicing');
    });
    it('returns "Good" for 60', () => {
        expect(getPerformanceLabel(60)).toBe('Good');
    });
    it('returns "Good" for 79', () => {
        expect(getPerformanceLabel(79)).toBe('Good');
    });
    it('returns "Excellent" for 80', () => {
        expect(getPerformanceLabel(80)).toBe('Excellent');
    });
    it('returns "Excellent" for 100', () => {
        expect(getPerformanceLabel(100)).toBe('Excellent');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 1: Performance label covers all score ranges
// Validates: Requirements 6.2
// ─────────────────────────────────────────────────────────────────────────────
describe('getPerformanceLabel', () => {
    it('Property 1 – label is always one of the three valid values', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 100 }), (pct) => {
                const label = getPerformanceLabel(pct);
                return label === 'Excellent' || label === 'Good' || label === 'Keep Practicing';
            }),
            { numRuns: 100 }
        );
    });

    it('Property 1 – label matches correct threshold for each range', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 100 }), (pct) => {
                const label = getPerformanceLabel(pct);
                if (pct >= 80) return label === 'Excellent';
                if (pct >= 60) return label === 'Good';
                return label === 'Keep Practicing';
            }),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: computeAverageScore edge cases
// Validates: Requirements 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('computeAverageScore – unit tests', () => {
    it('returns 0 for empty array', () => {
        expect(computeAverageScore([])).toBe(0);
    });
    it('returns the single record percentage for a one-element array', () => {
        expect(computeAverageScore([makeRecord({ percentage: 75 })])).toBe(75);
    });
    it('returns 0 when all records have percentage 0', () => {
        const records = [makeRecord({ percentage: 0 }), makeRecord({ percentage: 0 })];
        expect(computeAverageScore(records)).toBe(0);
    });
    it('returns correct average for multiple records', () => {
        const records = [makeRecord({ percentage: 40 }), makeRecord({ percentage: 80 })];
        expect(computeAverageScore(records)).toBe(60);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 2: Average score is bounded
// Validates: Requirements 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('computeAverageScore', () => {
    it('Property 2 – result is always in [0, 100] for non-empty arrays', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord, { minLength: 1 }), (records) => {
                const avg = computeAverageScore(records);
                return avg >= 0 && avg <= 100;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 2 – returns 0 for empty array', () => {
        expect(computeAverageScore([])).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 6: Score record percentage is consistent
// Validates: Requirements 5.7
// ─────────────────────────────────────────────────────────────────────────────
describe('score record percentage consistency', () => {
    it('Property 6 – percentage equals Math.round(score / total * 100)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }).chain(total =>
                    fc.integer({ min: 0, max: total }).map(score => ({ score, total }))
                ),
                ({ score, total }) => {
                    const expected = Math.round((score / total) * 100);
                    const record = makeRecord({ score, total, percentage: expected });
                    return record.percentage === expected;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: computeStreak edge cases
// Validates: Requirements 3.3
// ─────────────────────────────────────────────────────────────────────────────
describe('computeStreak – unit tests', () => {
    function isoDate(daysAgo: number): string {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().slice(0, 10) + 'T00:00:00.000Z';
    }

    it('returns 0 for no records', () => {
        expect(computeStreak([])).toBe(0);
    });

    it('returns 1 for a single record completed today', () => {
        expect(computeStreak([makeRecord({ completedAt: isoDate(0) })])).toBe(1);
    });

    it('returns 1 for a single record completed yesterday', () => {
        expect(computeStreak([makeRecord({ completedAt: isoDate(1) })])).toBe(1);
    });

    it('returns correct streak for consecutive days', () => {
        const records = [
            makeRecord({ completedAt: isoDate(0) }),
            makeRecord({ completedAt: isoDate(1) }),
            makeRecord({ completedAt: isoDate(2) }),
        ];
        expect(computeStreak(records)).toBe(3);
    });

    it('breaks streak on a gap in days', () => {
        // today and 2 days ago, but not yesterday — streak should be 1 (today only)
        const records = [
            makeRecord({ completedAt: isoDate(0) }),
            makeRecord({ completedAt: isoDate(2) }),
        ];
        expect(computeStreak(records)).toBe(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 7: Streak is non-negative
// Validates: Requirements 3.3
// ─────────────────────────────────────────────────────────────────────────────
describe('computeStreak', () => {
    it('Property 7 – streak is always >= 0 for any array of ScoreRecords', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord), (records) => {
                return computeStreak(records) >= 0;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 7 – streak is 0 for empty array', () => {
        expect(computeStreak([])).toBe(0);
    });
});
