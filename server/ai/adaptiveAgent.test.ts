import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { getWeakTopics, generateAdaptiveQuiz } from './adaptiveAgent.js';
import ScoreRecord from '../models/ScoreRecord.js';
import { openai } from './openaiClient.js';

vi.mock('../models/ScoreRecord.js', () => {
  return {
    default: {
      find: vi.fn(),
    },
  };
});

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

describe('adaptiveAgent Property Tests', () => {
  it('Property 5: Weak topic threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            subject: fc.string({ minLength: 1 }),
            percentage: fc.float({ min: 0, max: 100 }),
            completedAt: fc.date()
          }),
          { minLength: 1 }
        ),
        async (records) => {
          const sorted = [...records].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
          
          const chain = {
            sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(sorted) })
          };
          vi.mocked(ScoreRecord.find).mockReturnValue(chain as any);

          const result = await getWeakTopics('user123');
          
          const subjectMap = new Map<string, number[]>();
          for (const r of sorted) {
            const arr = subjectMap.get(r.subject) || [];
            if (arr.length < 10) arr.push(r.percentage);
            subjectMap.set(r.subject, arr);
          }

          const expectedWeak = Array.from(subjectMap.entries())
            .map(([subj, scores]) => ({ subject: subj, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
            .filter(x => x.avg < 70);

          expect(result.length).toBe(expectedWeak.length);
          for (const weak of result) {
            expect(weak.avgPercentage).toBeLessThan(70);
            const expected = expectedWeak.find(e => e.subject === weak.subject);
            expect(expected).toBeDefined();
            // Allow small float precision diffs
            expect(Math.abs(weak.avgPercentage - expected!.avg)).toBeLessThan(0.0001);
          }
        }
      )
    );
  });

  it('Property 6: Adaptive quiz weak topic weighting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1 }), // weak topics
        fc.integer({ min: 5, max: 20 }), // count
        async (weakTopics, count) => {
          // setup weak topics in db
          const fakeRecords = weakTopics.map(wt => ({ subject: wt, percentage: 50, completedAt: new Date() }));
          vi.mocked(ScoreRecord.find).mockReturnValue({
            sort: () => ({ lean: () => Promise.resolve(fakeRecords) })
          } as any);

          const minWeakCount = Math.ceil(count * 0.6);
          const mockQuestions = Array.from({ length: count }).map((_, i) => ({
             questionText: 'Q' + i,
             options: ['A', 'B', 'C', 'D'],
             correctAnswer: 'A',
             explanation: 'Exp',
             difficulty: 'medium',
             topic: i < minWeakCount ? weakTopics[0] : 'General'
          }));

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockQuestions) } }],
          } as any);

          const quiz = await generateAdaptiveQuiz('user123', { count });
          
          let weakCount = 0;
          for (const q of quiz) {
            if (weakTopics.includes(q.topic)) {
              weakCount++;
            }
          }

          expect(weakCount).toBeGreaterThanOrEqual(Math.floor(count * 0.6));
        }
      )
    );
  });

  it('Property 7: Difficulty override is respected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
        async (difficulty) => {
          vi.mocked(ScoreRecord.find).mockReturnValue({
            sort: () => ({ lean: () => Promise.resolve([]) })
          } as any);

          const mockQuestions = [{
             questionText: 'Q1',
             options: ['A', 'B', 'C', 'D'],
             correctAnswer: 'A',
             explanation: 'Exp',
             difficulty: difficulty,
             topic: 'General'
          }];

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockQuestions) } }],
          } as any);

          const quiz = await generateAdaptiveQuiz('user123', { count: 1, difficulty });
          expect(quiz[0].difficulty).toBe(difficulty);
        }
      )
    );
  });
});
