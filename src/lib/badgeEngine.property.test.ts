/**
 * Property-based tests for badgeEngine
 *
 * Feature: student-profile-enhancements
 * Property 1: badge idempotence
 *
 * Validates: Requirements 1.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { evaluateBadgeConditions, BADGE_DEFINITIONS } from './badgeEngine';
import type { ScoreRecord } from '../types/student';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbQuizId = fc.string({ minLength: 4, maxLength: 16 });

const arbScoreRecord: fc.Arbitrary<ScoreRecord> = fc
  .record({
    id: fc.string({ minLength: 4, maxLength: 16 }),
    quizId: arbQuizId,
    quizTitle: fc.string({ minLength: 1, maxLength: 40 }),
    score: fc.integer({ min: 0, max: 100 }),
    total: fc.integer({ min: 1, max: 100 }),
    percentage: fc.integer({ min: 0, max: 100 }),
    completedAt: fc
      .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
      .map((ms) => new Date(ms).toISOString()),
    subject: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  })
  .map(({ subject, ...rest }) =>
    subject !== undefined ? { ...rest, subject } : rest
  ) as fc.Arbitrary<ScoreRecord>;

const arbScores = fc.array(arbScoreRecord, { minLength: 0, maxLength: 20 });

const arbStreak = fc.integer({ min: 0, max: 30 });

// ---------------------------------------------------------------------------
// Property 1: Badge idempotence
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('badgeEngine property tests', () => {
  it(
    /**
     * **Validates: Requirements 1.4**
     *
     * Tag: Feature: student-profile-enhancements, Property 1: badge idempotence
     *
     * Evaluating the same scores twice yields no new badges on the second call.
     */
    'Property 1: badge idempotence — second evaluation with existing badges yields no new badges',
    () => {
      fc.assert(
        fc.property(arbScores, arbStreak, (scores, streak) => {
          // First call with no existing badges
          const firstResult = evaluateBadgeConditions(scores, streak, new Set());

          // Build the set of badge IDs from the first result
          const existingBadgeIds = new Set(firstResult.map((b) => b.badgeId));

          // Second call with those badges already present
          const secondResult = evaluateBadgeConditions(scores, streak, existingBadgeIds);

          // No new badges should be awarded on the second call
          expect(secondResult).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 2: Badge condition correctness
// Validates: Requirements 1.1, 1.2
// ---------------------------------------------------------------------------

describe('badgeEngine property tests — Property 2', () => {
  it(
    /**
     * **Validates: Requirements 1.1, 1.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 2: badge condition correctness
     *
     * For any scores and streak, the awarded set matches exactly the badges
     * whose conditions are satisfied.
     */
    'Property 2: badge condition correctness — awarded set matches exactly the badges whose conditions are satisfied',
    () => {
      fc.assert(
        fc.property(arbScores, arbStreak, (scores, streak) => {
          const awarded = evaluateBadgeConditions(scores, streak, new Set());
          return BADGE_DEFINITIONS.every(def => {
            const shouldEarn = def.evaluate(scores, streak).earned;
            const didEarn = awarded.some(b => b.badgeId === def.id);
            return shouldEarn === didEarn;
          });
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 8: Profile display name validation
// Validates: Requirements 8.2, 8.4, 9.2
// ---------------------------------------------------------------------------

import { validateDisplayName } from './badgeEngine';

describe('badgeEngine property tests — Property 8', () => {
  it(
    /**
     * **Validates: Requirements 8.2, 8.4, 9.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 8: profile display name validation
     *
     * validateDisplayName returns valid: true iff trimmed length is between 1 and 50 inclusive.
     */
    'Property 8: profile display name validation — valid iff trimmed length is 1–50',
    () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 100 }), (name) => {
          const trimmed = name.trim();
          const isValid = trimmed.length >= 1 && trimmed.length <= 50;
          const result = validateDisplayName(name);
          expect(result.valid).toBe(isValid);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'Property 8 (empty/whitespace): trimmed length 0 → valid: false',
    () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\s*$/),
          (name) => {
            const result = validateDisplayName(name);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'Property 8 (too long): trimmed length > 50 → valid: false',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 200 }).filter((s) => s.trim().length > 50),
          (name) => {
            const result = validateDisplayName(name);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
