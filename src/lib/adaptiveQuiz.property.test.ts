/**
 * Property-based tests for adaptiveQuiz
 *
 * Feature: student-profile-enhancements
 * Property 5: adaptive question count bounds
 *
 * Validates: Requirements 6.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { generateAdaptiveQuestions, buildPerformanceProfile } from './adaptiveQuiz';
import type { PerformanceProfile } from './adaptiveQuiz';
import type { GeneratedQuestion } from './gemini';
import type { ScoreRecord } from '../types/student';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuestion(index: number): GeneratedQuestion {
  return {
    question_text: `Question ${index}?`,
    option_a: 'Option A',
    option_b: 'Option B',
    option_c: 'Option C',
    option_d: 'Option D',
    correct_answer: 'A',
    difficulty: 'medium',
  };
}

/**
 * Build a mock Gemini API response body that returns `count` valid questions.
 */
function mockGeminiResponse(count: number): Response {
  const questions: GeneratedQuestion[] = Array.from({ length: count }, (_, i) =>
    makeQuestion(i + 1)
  );
  const body = JSON.stringify({
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(questions) }],
        },
      },
    ],
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbDifficulty = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const);

const arbPerformanceProfile: fc.Arbitrary<PerformanceProfile> = fc.record({
  subject: fc.string({ minLength: 1, maxLength: 30 }),
  recentScores: fc.array(
    fc.record({
      percentage: fc.integer({ min: 0, max: 100 }),
      difficulty: arbDifficulty,
    }),
    { minLength: 0, maxLength: 10 }
  ),
  weakTopics: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  dominantWeakDifficulty: arbDifficulty,
});

// numQuestions in the valid range [5, 20]
const arbNumQuestionsInRange = fc.integer({ min: 5, max: 20 });

// numQuestions below the minimum (< 5)
const arbNumQuestionsBelow = fc.integer({ min: 1, max: 4 });

// numQuestions above the maximum (> 20)
const arbNumQuestionsAbove = fc.integer({ min: 21, max: 50 });

// ---------------------------------------------------------------------------
// Property 5: Adaptive question count bounds
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

describe('adaptiveQuiz property tests — Property 5', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Provide a fake API key so the function doesn't throw early
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

    // Mock fetch to return a controlled set of questions sized to numQuestions
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      // Extract numQuestions from the prompt in the request body
      let count = 10; // default fallback
      try {
        const bodyStr = typeof init?.body === 'string' ? init.body : '';
        const parsed = JSON.parse(bodyStr);
        const text: string = parsed?.contents?.[0]?.parts?.[0]?.text ?? '';
        const match = text.match(/Generate (\d+) questions now:/);
        if (match) {
          count = parseInt(match[1], 10);
        }
      } catch {
        // ignore parse errors, use default
      }
      return mockGeminiResponse(count);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it(
    /**
     * **Validates: Requirements 6.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 5: adaptive question count bounds
     *
     * For any valid PerformanceProfile and numQuestions in [5, 20], the
     * returned array length is between 5 and 20 inclusive.
     */
    'Property 5: adaptive question count bounds — result length is between 5 and 20 for in-range numQuestions',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbPerformanceProfile,
          arbNumQuestionsInRange,
          async (profile, numQuestions) => {
            const result = await generateAdaptiveQuestions(profile, 'Some note content.', numQuestions);
            expect(result.length).toBeGreaterThanOrEqual(5);
            expect(result.length).toBeLessThanOrEqual(20);
            // For in-range inputs, the function should return exactly numQuestions
            expect(result.length).toBe(numQuestions);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 6.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 5: adaptive question count bounds
     *
     * When numQuestions < 5, the function clamps to 5 and returns at least 5 questions.
     */
    'Property 5: adaptive question count bounds — result length is at least 5 when numQuestions < 5 (clamped)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbPerformanceProfile,
          arbNumQuestionsBelow,
          async (profile, numQuestions) => {
            const result = await generateAdaptiveQuestions(profile, 'Some note content.', numQuestions);
            expect(result.length).toBeGreaterThanOrEqual(5);
            expect(result.length).toBeLessThanOrEqual(20);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 6.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 5: adaptive question count bounds
     *
     * When numQuestions > 20, the function clamps to 20 and returns at most 20 questions.
     */
    'Property 5: adaptive question count bounds — result length is at most 20 when numQuestions > 20 (clamped)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbPerformanceProfile,
          arbNumQuestionsAbove,
          async (profile, numQuestions) => {
            const result = await generateAdaptiveQuestions(profile, 'Some note content.', numQuestions);
            expect(result.length).toBeGreaterThanOrEqual(5);
            expect(result.length).toBeLessThanOrEqual(20);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 6: Adaptive difficulty weighting
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------

describe('adaptiveQuiz property tests — Property 6', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

    /**
     * Mock fetch that parses the prompt to extract the exact difficulty
     * breakdown (lines like "- easy: N questions") and returns questions
     * with those exact counts and difficulties.
     */
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const breakdown: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
      try {
        const bodyStr = typeof init?.body === 'string' ? init.body : '';
        const parsed = JSON.parse(bodyStr);
        const text: string = parsed?.contents?.[0]?.parts?.[0]?.text ?? '';
        for (const tier of ['easy', 'medium', 'hard'] as const) {
          const match = text.match(new RegExp(`- ${tier}: (\\d+) questions`));
          if (match) {
            breakdown[tier] = parseInt(match[1], 10);
          }
        }
      } catch {
        // ignore parse errors, use zeros
      }

      const questions: GeneratedQuestion[] = [];
      let idx = 0;
      for (const tier of ['easy', 'medium', 'hard'] as const) {
        for (let i = 0; i < breakdown[tier]; i++) {
          questions.push({
            question_text: `Question ${++idx}?`,
            option_a: 'Option A',
            option_b: 'Option B',
            option_c: 'Option C',
            option_d: 'Option D',
            correct_answer: 'A',
            difficulty: tier,
          });
        }
      }

      const body = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(questions) }],
            },
          },
        ],
      });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it(
    /**
     * **Validates: Requirements 6.1, 6.2**
     *
     * Tag: Feature: student-profile-enhancements, Property 6: adaptive difficulty weighting
     *
     * For any PerformanceProfile with a dominantWeakDifficulty, the returned
     * question set should contain more questions of that difficulty tier than
     * any other single tier.
     */
    'Property 6: adaptive difficulty weighting — dominant weak difficulty tier has the highest question count',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbPerformanceProfile,
          arbNumQuestionsInRange,
          async (profile, numQuestions) => {
            const result = await generateAdaptiveQuestions(profile, 'Some note content.', numQuestions);

            // Count questions per difficulty tier
            const counts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
            for (const q of result) {
              if (q.difficulty in counts) {
                counts[q.difficulty]++;
              }
            }

            const dominantCount = counts[profile.dominantWeakDifficulty];
            const otherTiers = (['easy', 'medium', 'hard'] as const).filter(
              (t) => t !== profile.dominantWeakDifficulty
            );

            // The dominant weak difficulty tier must have more questions than each other tier
            return otherTiers.every((tier) => dominantCount > counts[tier]);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 9: Performance profile weak difficulty derivation
// Validates: Requirements 6.1
// ---------------------------------------------------------------------------

// Extended ScoreRecord with optional difficulty field (matches internal type)
interface ScoreRecordWithDifficulty extends ScoreRecord {
  difficulty?: 'easy' | 'medium' | 'hard';
}

const arbScoreRecordWithDifficulty = (subject: string): fc.Arbitrary<ScoreRecordWithDifficulty> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    quizId: fc.string({ minLength: 1, maxLength: 20 }),
    quizTitle: fc.string({ minLength: 1, maxLength: 50 }),
    score: fc.integer({ min: 0, max: 20 }),
    total: fc.integer({ min: 1, max: 20 }),
    percentage: fc.integer({ min: 0, max: 100 }),
    completedAt: fc.constant(new Date().toISOString()),
    subject: fc.constant(subject),
    difficulty: fc.option(arbDifficulty, { nil: undefined }),
  });

/**
 * Compute the expected dominantWeakDifficulty from a set of score records,
 * mirroring the logic in buildPerformanceProfile.
 */
function computeExpectedWeakDifficulty(
  scores: ScoreRecordWithDifficulty[],
  subject: string
): 'easy' | 'medium' | 'hard' {
  const subjectScores = scores.filter(
    (s) => s.subject?.toLowerCase() === subject.toLowerCase()
  );

  if (subjectScores.length === 0) return 'medium';

  const tiers = ['easy', 'medium', 'hard'] as const;
  const avgByDifficulty: Record<'easy' | 'medium' | 'hard', number | null> = {
    easy: null,
    medium: null,
    hard: null,
  };

  for (const tier of tiers) {
    const tierScores = subjectScores.filter((s) => s.difficulty === tier);
    if (tierScores.length > 0) {
      const sum = tierScores.reduce((acc, s) => acc + s.percentage, 0);
      avgByDifficulty[tier] = sum / tierScores.length;
    }
  }

  let dominantWeakDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let lowestAvg = Infinity;

  for (const tier of tiers) {
    const avg = avgByDifficulty[tier];
    if (avg !== null && avg < lowestAvg) {
      lowestAvg = avg;
      dominantWeakDifficulty = tier;
    }
  }

  return dominantWeakDifficulty;
}

describe('adaptiveQuiz property tests — Property 9', () => {
  it(
    /**
     * **Validates: Requirements 6.1**
     *
     * Tag: Feature: student-profile-enhancements, Property 9: performance profile weak difficulty derivation
     *
     * For any collection of ScoreRecord objects with difficulty fields,
     * buildPerformanceProfile sets dominantWeakDifficulty to the tier with
     * the lowest average percentage.
     */
    'Property 9: performance profile weak difficulty derivation — dominantWeakDifficulty equals the tier with the lowest average percentage',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).chain((subject) =>
            fc.tuple(
              fc.array(arbScoreRecordWithDifficulty(subject), { minLength: 1, maxLength: 20 }),
              fc.constant(subject)
            )
          ),
          ([scores, subject]) => {
            const profile = buildPerformanceProfile(
              scores as ScoreRecord[],
              subject
            );
            const expected = computeExpectedWeakDifficulty(scores, subject);
            return profile.dominantWeakDifficulty === expected;
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 6.1**
     *
     * Tag: Feature: student-profile-enhancements, Property 9: performance profile weak difficulty derivation
     *
     * When no scores exist for the subject, dominantWeakDifficulty defaults to 'medium'.
     */
    'Property 9: performance profile weak difficulty derivation — defaults to medium when no scores match subject',
    () => {
      fc.assert(
        fc.property(
          fc.array(arbScoreRecordWithDifficulty('math'), { minLength: 0, maxLength: 10 }),
          (scores) => {
            const profile = buildPerformanceProfile(scores as ScoreRecord[], 'science');
            return profile.dominantWeakDifficulty === 'medium';
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
