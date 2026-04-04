/**
 * Unit tests for adaptiveQuiz
 *
 * Feature: student-profile-enhancements
 * Validates: Requirements 6.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPerformanceProfile, generateAdaptiveQuestions } from './adaptiveQuiz';
import type { ScoreRecord } from '../types/student';
import type { GeneratedQuestion } from './gemini';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ScoreRecordWithDifficulty extends ScoreRecord {
  difficulty?: 'easy' | 'medium' | 'hard';
}

function makeScore(
  overrides: Partial<ScoreRecordWithDifficulty> & { percentage: number }
): ScoreRecordWithDifficulty {
  return {
    id: overrides.id ?? 'score-1',
    quizId: overrides.quizId ?? 'quiz-1',
    quizTitle: overrides.quizTitle ?? 'Test Quiz',
    score: overrides.score ?? overrides.percentage,
    total: overrides.total ?? 100,
    percentage: overrides.percentage,
    completedAt: overrides.completedAt ?? new Date().toISOString(),
    subject: overrides.subject,
    difficulty: overrides.difficulty,
  };
}

function makeGeminiResponse(questions: GeneratedQuestion[]): Response {
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
// buildPerformanceProfile — pure function tests
// Validates: Requirements 6.1
// ---------------------------------------------------------------------------

describe('buildPerformanceProfile', () => {
  it('no scores → defaults to medium difficulty and empty weakTopics', () => {
    const profile = buildPerformanceProfile([], 'math');

    expect(profile.dominantWeakDifficulty).toBe('medium');
    expect(profile.weakTopics).toEqual([]);
    expect(profile.recentScores).toEqual([]);
    expect(profile.subject).toBe('math');
  });

  it('all easy scores with low percentages → dominantWeakDifficulty is easy', () => {
    const scores: ScoreRecordWithDifficulty[] = [
      makeScore({ id: 's1', quizId: 'q1', percentage: 20, subject: 'math', difficulty: 'easy' }),
      makeScore({ id: 's2', quizId: 'q2', percentage: 30, subject: 'math', difficulty: 'easy' }),
    ];

    const profile = buildPerformanceProfile(scores as ScoreRecord[], 'math');

    expect(profile.dominantWeakDifficulty).toBe('easy');
  });

  it('mixed scores where hard has lowest average → dominantWeakDifficulty is hard', () => {
    const scores: ScoreRecordWithDifficulty[] = [
      makeScore({ id: 's1', quizId: 'q1', percentage: 80, subject: 'science', difficulty: 'easy' }),
      makeScore({ id: 's2', quizId: 'q2', percentage: 75, subject: 'science', difficulty: 'medium' }),
      makeScore({ id: 's3', quizId: 'q3', percentage: 30, subject: 'science', difficulty: 'hard' }),
    ];

    const profile = buildPerformanceProfile(scores as ScoreRecord[], 'science');

    expect(profile.dominantWeakDifficulty).toBe('hard');
  });

  it('subject filtering: scores for different subjects are ignored', () => {
    const scores: ScoreRecordWithDifficulty[] = [
      makeScore({ id: 's1', quizId: 'q1', percentage: 10, subject: 'history', difficulty: 'easy' }),
      makeScore({ id: 's2', quizId: 'q2', percentage: 10, subject: 'history', difficulty: 'hard' }),
    ];

    // Querying for 'math' — no matching scores → defaults to medium
    const profile = buildPerformanceProfile(scores as ScoreRecord[], 'math');

    expect(profile.dominantWeakDifficulty).toBe('medium');
    expect(profile.recentScores).toEqual([]);
    expect(profile.weakTopics).toEqual([]);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_GEMINI_API_KEY', 'test_key');
});

// ---------------------------------------------------------------------------
// generateAdaptiveQuestions — mocked fetch tests
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------

describe('generateAdaptiveQuestions', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('calls the Gemini API and returns the generated questions', async () => {
    const mockQuestions: GeneratedQuestion[] = [
      {
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        difficulty: 'easy',
      },
      {
        question_text: 'What is the capital of France?',
        option_a: 'Berlin',
        option_b: 'Madrid',
        option_c: 'Paris',
        option_d: 'Rome',
        correct_answer: 'C',
        difficulty: 'medium',
      },
      {
        question_text: 'What is the derivative of x²?',
        option_a: 'x',
        option_b: '2x',
        option_c: 'x²',
        option_d: '2',
        correct_answer: 'B',
        difficulty: 'hard',
      },
      {
        question_text: 'What is H2O?',
        option_a: 'Oxygen',
        option_b: 'Hydrogen',
        option_c: 'Water',
        option_d: 'Salt',
        correct_answer: 'C',
        difficulty: 'easy',
      },
      {
        question_text: 'What planet is closest to the sun?',
        option_a: 'Venus',
        option_b: 'Earth',
        option_c: 'Mars',
        option_d: 'Mercury',
        correct_answer: 'D',
        difficulty: 'medium',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeGeminiResponse(mockQuestions));

    const profile = buildPerformanceProfile([], 'math');
    const result = await generateAdaptiveQuestions(profile, 'Some note content.', 5);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toHaveLength(5);
    expect(result[0].question_text).toBe('What is 2+2?');
  });

  it('throws when API returns 400 (bad request)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Bad request' } }), { status: 400 })
    );

    const profile = buildPerformanceProfile([], 'math');

    await expect(
      generateAdaptiveQuestions(profile, 'Some content.', 5)
    ).rejects.toThrow('Invalid request');
  });
});
