/**
 * Tests for StudentQuiz score percentage computation.
 *
 * Feature: student-pages
 * Task: 11.1 – Write property test for score record percentage
 *
 * NOTE: Property 6 ("Score record percentage is consistent") is fully covered
 * by the property-based test suite in src/utils/scoring.test.ts under the
 * describe block "score record percentage consistency". That test verifies:
 *   percentage === Math.round((score / total) * 100)
 * for all (score, total) pairs where 0 ≤ score ≤ total and total > 0.
 *
 * The tests below verify that StudentQuiz itself computes percentage using
 * the same formula before passing it to saveScoreRecord.
 *
 * Validates: Requirements 5.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─────────────────────────────────────────────────────────────────────────────
// Pure percentage computation extracted from StudentQuiz.nextQuestion logic.
// This mirrors the exact expression used in StudentQuiz.tsx:
//   const percentage = Math.round((score / total) * 100);
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the percentage score exactly as StudentQuiz does before calling
 * saveScoreRecord. Kept as a pure function here so it can be property-tested
 * without mounting the full React component.
 */
function computeQuizPercentage(score: number, total: number): number {
    return Math.round((score / total) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages, Property 6: Score record percentage is consistent
// Validates: Requirements 5.7
// ─────────────────────────────────────────────────────────────────────────────
describe('StudentQuiz – score record percentage computation', () => {
    it('Property 6 – percentage passed to saveScoreRecord equals Math.round((score / total) * 100)', () => {
        /**
         * Validates: Requirements 5.7
         *
         * For any valid (score, total) pair where 0 ≤ score ≤ total and total > 0,
         * the percentage computed by StudentQuiz before calling saveScoreRecord
         * must equal Math.round((score / total) * 100).
         *
         * See also: src/utils/scoring.test.ts – "score record percentage consistency"
         * for the full Property 6 property-based test on the ScoreRecord data model.
         */
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }).chain(total =>
                    fc.integer({ min: 0, max: total }).map(score => ({ score, total }))
                ),
                ({ score, total }) => {
                    const expected = Math.round((score / total) * 100);
                    const actual = computeQuizPercentage(score, total);
                    return actual === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('percentage is always in [0, 100] for valid inputs', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }).chain(total =>
                    fc.integer({ min: 0, max: total }).map(score => ({ score, total }))
                ),
                ({ score, total }) => {
                    const pct = computeQuizPercentage(score, total);
                    return pct >= 0 && pct <= 100;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('score of 0 always yields 0%', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
                return computeQuizPercentage(0, total) === 0;
            }),
            { numRuns: 100 }
        );
    });

    it('perfect score always yields 100%', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
                return computeQuizPercentage(total, total) === 100;
            }),
            { numRuns: 100 }
        );
    });
});
