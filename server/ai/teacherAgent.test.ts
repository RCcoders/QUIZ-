import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { generateTeacherQuiz } from './teacherAgent.js';
import { openai } from './openaiClient.js';

vi.mock('./openaiClient.js', () => {
  return {
    openai: {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    },
  };
});

describe('teacherAgent Property Tests', () => {

  it('Property 1: MCQ questions have required fields and exactly one correct answer', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 1 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
          count: fc.integer({ min: 1, max: 10 }),
        }),
        async (params) => {
          const mockOpenAIResponse = Array.from({ length: params.count }).map((_, i) => ({
            questionText: `Question ${i}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: ['A', 'B', 'C', 'D'][i % 4],
            explanation: 'Exp',
            difficulty: params.difficulty,
            topic: params.topic
          }));

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockOpenAIResponse) } }],
          } as any);

          const result = await generateTeacherQuiz({
            ...params,
            questionType: 'mcq'
          });

          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(params.count);

          for (const q of result) {
            expect(q).toHaveProperty('questionText');
            expect((q as any).options.length).toBe(4);
            expect(['A', 'B', 'C', 'D']).toContain((q as any).correctAnswer);
            expect(q).toHaveProperty('explanation');
            expect((q as any).difficulty).toBe(params.difficulty);
          }
        }
      )
    );
  });

  it('Property 2: Subjective questions have model answer and rubric', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 1 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
          count: fc.integer({ min: 1, max: 10 }),
        }),
        async (params) => {
          const mockOpenAIResponse = Array.from({ length: params.count }).map((_, i) => ({
            questionText: `Subjective ${i}`,
            modelAnswer: 'Model answer',
            rubric: 'Rubric',
            difficulty: params.difficulty,
            topic: params.topic
          }));

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockOpenAIResponse) } }],
          } as any);

          const result = await generateTeacherQuiz({
            ...params,
            questionType: 'subjective'
          });

          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(params.count);

          for (const q of result) {
            expect(q).toHaveProperty('questionText');
            expect(q).toHaveProperty('modelAnswer');
            expect(q).toHaveProperty('rubric');
            expect(q).not.toHaveProperty('options');
            expect(q).not.toHaveProperty('correctAnswer');
          }
        }
      )
    );
  });

  it('Property 3: Poll questions have 2-6 options and no correct answer', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 1 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
          count: fc.integer({ min: 1, max: 10 }),
          numOptions: fc.integer({ min: 2, max: 6 })
        }),
        async (params) => {
          const mockOpenAIResponse = Array.from({ length: params.count }).map((_, i) => ({
            questionText: `Poll ${i}`,
            options: Array.from({ length: params.numOptions }).map((_, j) => `Option ${j}`),
            topic: params.topic
          }));

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockOpenAIResponse) } }],
          } as any);

          const result = await generateTeacherQuiz({
            topic: params.topic,
            difficulty: params.difficulty,
            count: params.count,
            questionType: 'poll'
          });

          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(params.count);

          for (const q of result) {
            expect(q).toHaveProperty('questionText');
            const options = (q as any).options;
            expect(options.length).toBeGreaterThanOrEqual(2);
            expect(options.length).toBeLessThanOrEqual(6);
            expect(q).not.toHaveProperty('correctAnswer');
          }
        }
      )
    );
  });
});
