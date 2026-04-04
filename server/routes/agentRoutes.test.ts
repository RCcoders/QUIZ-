import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express from 'express';
// @ts-ignore
import pdfParse from 'pdf-parse';
import agentRoutes from './agentRoutes.js';

// Mock dependencies
vi.mock('../middleware/authMiddleware.js', () => ({
  protect: (req: any, res: any, next: any) => { req.user = { _id: 'user1', role: 'teacher' }; next(); },
  authorize: () => (req: any, res: any, next: any) => next()
}));

vi.mock('../ai/teacherAgent.js', () => ({ generateTeacherQuiz: vi.fn() }));
vi.mock('../ai/studentAgent.js', () => ({
  generateStudentNotes: vi.fn(),
  ValidationError: class extends Error {
    status: number;
    constructor(m: string, s: number) { super(m); this.status = s; }
  }
}));
vi.mock('../ai/adaptiveAgent.js', () => ({ generateAdaptiveQuiz: vi.fn() }));

// AiCache mock with mutable in-memory store
const aiCacheStore: any[] = [];
vi.mock('../models/AiCache.js', () => ({
  AiCache: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  }
}));

vi.mock('pdf-parse', () => ({ default: vi.fn().mockResolvedValue({ text: 'Default text' }) }));
import { clearRateLimiterCache } from '../middleware/aiRateLimiter.js';
import { AiCache } from '../models/AiCache.js';

const app = express();
app.use(express.json());
app.use('/api', agentRoutes);

function setupCacheMocks() {
  vi.mocked(AiCache.findOne).mockImplementation(async (query: any) => {
    return aiCacheStore.find(entry =>
      entry.cacheKey === query.cacheKey && entry.agentType === query.agentType
    ) || null;
  });
  vi.mocked(AiCache.create).mockImplementation(async (doc: any) => {
    aiCacheStore.push({ ...doc });
    return doc;
  });
  vi.mocked(AiCache.find).mockImplementation(async (query: any) => {
    return aiCacheStore.filter(entry => {
      for (const [k, v] of Object.entries(query)) {
        if (entry[k] !== v) return false;
      }
      return true;
    });
  });
}

describe('agentRoutes', () => {
  beforeEach(() => {
    clearRateLimiterCache();
    aiCacheStore.length = 0;
    vi.clearAllMocks();
    setupCacheMocks();
  });

  it('10.3 Test: empty topic -> 400 "topic is required"', async () => {
    vi.mocked(AiCache.findOne).mockResolvedValueOnce(null);
    const res = await request(app).post('/api/teacher/quiz').send({ count: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('topic is required');
  });

  it('10.3 Test: noteText > 10,000 chars -> 400 "note text exceeds maximum length"', async () => {
    const { ValidationError } = await import('../ai/studentAgent.js');
    vi.mocked((await import('../ai/studentAgent.js')).generateStudentNotes).mockRejectedValueOnce(new ValidationError('note text exceeds maximum length', 400));
    const res = await request(app).post('/api/student/notes').send({ topic: 'Math', noteText: 'a'.repeat(10001) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('note text exceeds maximum length');
  });

  it('10.3 Test: non-PDF upload -> 400 "Only PDF files are accepted"', async () => {
    const res = await request(app)
      .post('/api/teacher/quiz-from-pdf')
      .attach('pdf', Buffer.from('hello'), 'test.txt');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only PDF files are accepted');
  });

  it('10.3 Test: PDF > 10 MB -> 400 "File size exceeds 10 MB limit"', async () => {
    const lgBuffer = Buffer.alloc(11 * 1024 * 1024);
    const res = await request(app)
      .post('/api/teacher/quiz-from-pdf')
      .attach('pdf', lgBuffer, 'test.pdf');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('File size exceeds 10 MB limit');
  });

  it('10.3 Test: image-only PDF (empty extracted text) -> 422 "No extractable text found in PDF"', async () => {
    vi.mocked(pdfParse).mockResolvedValueOnce({ text: '  ' } as any);
    const minPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
    const res = await request(app)
      .post('/api/teacher/quiz-from-pdf')
      .attach('pdf', minPdf, { filename: 'test.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(422);
    expect(res.body.message).toBe('No extractable text found in PDF');
  });

  it('10.4 Property 11: RAG pipeline extracts text and produces valid MCQ schema', async () => {
    const { generateTeacherQuiz } = await import('../ai/teacherAgent.js');
    const minPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
    
    vi.mocked(pdfParse).mockResolvedValueOnce({ text: 'Some readable text' } as any);
    
    vi.mocked(generateTeacherQuiz).mockResolvedValueOnce([{
      questionText: 'Q1', options: ['A','B','C','D'], correctAnswer: 'A', explanation: 'E', difficulty: 'easy', topic: 't'
    } as any]);

    const res = await request(app)
      .post('/api/teacher/quiz-from-pdf')
      .attach('pdf', minPdf, 'sample.pdf');
      
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('questionText');
    expect(res.body[0].options.length).toBe(4);
    expect(res.body[0].correctAnswer).toBe('A');
  });

  // Feature: ai-agent-system, Property 8: Cache hit returns identical response without calling OpenAI
  // Validates: Requirements 5.1, 5.2
  it('Property 8: Cache hit returns identical response without calling OpenAI', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 1 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
          count: fc.integer({ min: 1, max: 10 }),
          questionType: fc.constantFrom('mcq', 'subjective', 'poll') as fc.Arbitrary<'mcq' | 'subjective' | 'poll'>,
        }),
        async (params) => {
          // Reset state for each iteration
          clearRateLimiterCache();
          aiCacheStore.length = 0;
          setupCacheMocks();

          const { generateTeacherQuiz } = await import('../ai/teacherAgent.js');
          const mockResponse = [{
            questionText: `Q for ${params.topic}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A' as const,
            explanation: 'Explanation',
            difficulty: params.difficulty,
            topic: params.topic,
          }];

          // Reset call count for this iteration
          vi.mocked(generateTeacherQuiz).mockReset();
          vi.mocked(generateTeacherQuiz).mockResolvedValue(mockResponse as any);

          // First request — cache miss, calls OpenAI
          const res1 = await request(app)
            .post('/api/teacher/quiz')
            .send(params);
          expect(res1.status).toBe(200);

          // Second request — should be a cache hit, no new OpenAI call
          const res2 = await request(app)
            .post('/api/teacher/quiz')
            .send(params);
          expect(res2.status).toBe(200);

          // Responses must be identical
          expect(res1.body).toEqual(res2.body);

          // generateTeacherQuiz must have been called exactly once across both requests
          expect(vi.mocked(generateTeacherQuiz).mock.calls.length).toBe(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: ai-agent-system, Property 9: Adaptive agent responses are never cached
  // Validates: Requirements 5.5
  it('Property 9: Adaptive agent responses are never cached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1 }),
          topic: fc.string({ minLength: 1 }),
        }),
        async (_params) => {
          // Reset state for each iteration
          clearRateLimiterCache();
          aiCacheStore.length = 0;
          setupCacheMocks();

          const { generateAdaptiveQuiz } = await import('../ai/adaptiveAgent.js');
          vi.mocked(generateAdaptiveQuiz).mockResolvedValue([{
            questionText: 'Q1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A' as const,
            explanation: 'Exp',
            difficulty: 'medium' as const,
            topic: 'General',
          }]);

          const res = await request(app)
            .post('/api/adaptive/quiz')
            .send({ count: 1 });
          expect(res.status).toBe(200);

          // After the adaptive request, no entry with agentType 'adaptive' should exist in cache
          const adaptiveCacheEntries = aiCacheStore.filter(e => e.agentType === 'adaptive');
          expect(adaptiveCacheEntries.length).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});
