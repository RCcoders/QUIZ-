import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { generateStudentNotes } from './studentAgent.js';
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

describe('studentAgent Property Tests', () => {

  it('Property 4: Student notes output schema invariant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          noteText: fc.option(fc.string({ maxLength: 10000 }))
        }),
        async (params) => {
          const mockOpenAIResponse = {
            summary: `Summary of ${params.topic}`,
            keyConcepts: ['Concept 1', 'Concept 2'],
            importantQuestions: ['Question 1?']
          };

          vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(mockOpenAIResponse) } }],
          } as any);

          const result = await generateStudentNotes({
            topic: params.topic,
            noteText: params.noteText !== null ? params.noteText : undefined
          });

          expect(result).toHaveProperty('summary');
          expect(typeof result.summary).toBe('string');
          
          expect(result).toHaveProperty('keyConcepts');
          expect(Array.isArray(result.keyConcepts)).toBe(true);
          expect(result.keyConcepts.length).toBeGreaterThan(0);
          
          expect(result).toHaveProperty('importantQuestions');
          expect(Array.isArray(result.importantQuestions)).toBe(true);
          expect(result.importantQuestions.length).toBeGreaterThan(0);
        }
      )
    );
  });
});
