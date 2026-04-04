/**
 * Property-based tests for agentRoutes — adaptive quiz caching
 *
 * Feature: firebase-removal-optimization
 * Property 5: AI cache hit returns cached response
 * Property 6: Expired cache entry is treated as a miss
 *
 * Validates: Requirements 5.1, 5.2, 9.1, 9.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import agentRoutes from './agentRoutes.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../middleware/authMiddleware.js', () => ({
  protect: (req: any, _res: any, next: any) => { req.user = { _id: 'user1', role: 'student' }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../ai/teacherAgent.js', () => ({ generateTeacherQuiz: vi.fn() }));
vi.mock('../ai/studentAgent.js', () => ({
  generateStudentNotes: vi.fn(),
  ValidationError: class extends Error {
    status: number;
    constructor(m: string, s: number) { super(m); this.status = s; }
  },
}));
vi.mock('../ai/adaptiveAgent.js', () => ({ generateAdaptiveQuiz: vi.fn() }));

const aiCacheStore: any[] = [];
vi.mock('../models/AiCache.js', () => ({
  AiCache: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
  },
}));

import { clearRateLimiterCache } from '../middleware/aiRateLimiter.js';
import { AiCache } from '../models/AiCache.js';
import { generateAdaptiveQuiz } from '../ai/adaptiveAgent.js';

const app = express();
app.use(express.json());
app.use('/api', agentRoutes);

function setupCacheMocks() {
  vi.mocked(AiCache.findOne).mockImplementation(((query: any) =>
    Promise.resolve(
      aiCacheStore.find(
        (e) => e.cacheKey === query.cacheKey && e.agentType === query.agentType
      ) || null
    )
  ) as any);
  vi.mocked(AiCache.create).mockImplementation((async (doc: any) => {
    aiCacheStore.push({ ...doc });
    return doc;
  }) as any);
}

const mockQuizResponse = [
  {
    questionText: 'What is 2+2?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 'D' as const,
    explanation: 'Basic arithmetic',
    difficulty: 'easy' as const,
    topic: 'Math',
  },
];

// ---------------------------------------------------------------------------
// Property 5: AI cache hit returns cached response
// Validates: Requirements 5.1, 9.1, 9.2
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 5: AI cache hit returns cached response', () => {
  beforeEach(() => {
    clearRateLimiterCache();
    aiCacheStore.length = 0;
    vi.clearAllMocks();
    setupCacheMocks();
  });

  it(
    /**
     * **Validates: Requirements 5.1, 9.1, 9.2**
     *
     * Tag: Feature: firebase-removal-optimization, Property 5: AI cache hit returns cached response
     *
     * For any adaptive quiz request with a given subject and count, if an identical
     * request has already been processed and the cache entry is within the TTL,
     * the backend returns the cached response (with fromCache: true) without calling
     * the external AI API again.
     */
    'Property 5: AI cache hit returns cached response — generateAdaptiveQuiz called exactly once',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            subject: fc.constantFrom('Math', 'Science', 'History'),
            count: fc.integer({ min: 1, max: 20 }),
          }),
          async (params) => {
            clearRateLimiterCache();
            aiCacheStore.length = 0;
            setupCacheMocks();

            vi.mocked(generateAdaptiveQuiz).mockReset();
            vi.mocked(generateAdaptiveQuiz).mockResolvedValue(mockQuizResponse as any);

            // First request — cache miss, calls AI
            const res1 = await request(app).post('/api/run').send({ mode: 'ADAPTIVE_AGENT', data: params });
            expect(res1.status).toBe(200);
            expect(res1.body.data?.fromCache).toBeUndefined();

            // Second request — cache hit
            const res2 = await request(app).post('/api/run').send({ mode: 'ADAPTIVE_AGENT', data: params });
            expect(res2.status).toBe(200);
            expect(res2.body.data.fromCache).toBe(true);

            // AI generator called exactly once across both requests
            expect(vi.mocked(generateAdaptiveQuiz).mock.calls.length).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 6: Expired cache entry is treated as a miss
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 6: Expired cache entry is treated as a miss', () => {
  beforeEach(() => {
    clearRateLimiterCache();
    aiCacheStore.length = 0;
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 5.2**
     *
     * Tag: Feature: firebase-removal-optimization, Property 6: Expired cache entry is treated as a miss
     *
     * When AiCache.findOne returns null (simulating TTL expiry), the route must
     * call generateAdaptiveQuiz and return a fresh response.
     */
    'Property 6: Expired cache entry is treated as a miss — fresh response generated',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            subject: fc.constantFrom('Math', 'Science', 'History'),
            count: fc.integer({ min: 1, max: 20 }),
          }),
          async (params) => {
            clearRateLimiterCache();
            vi.clearAllMocks();

            // Simulate TTL expiry: findOne always returns null
            vi.mocked(AiCache.findOne).mockResolvedValue(null as any);
            vi.mocked(AiCache.create).mockResolvedValue({} as any);

            vi.mocked(generateAdaptiveQuiz).mockReset();
            vi.mocked(generateAdaptiveQuiz).mockResolvedValue(mockQuizResponse as any);

            const res = await request(app).post('/api/run').send({ mode: 'ADAPTIVE_AGENT', data: params });
            expect(res.status).toBe(200);
            expect(res.body.data?.fromCache).toBeUndefined();

            // AI generator must have been called (cache miss → fresh generation)
            expect(vi.mocked(generateAdaptiveQuiz).mock.calls.length).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    }
  );
});
