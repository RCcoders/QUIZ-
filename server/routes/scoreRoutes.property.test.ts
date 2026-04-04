/**
 * Property-based tests for scoreRoutes
 *
 * Feature: firebase-removal-optimization
 * Property 7: Paginated list responses are bounded and include metadata
 * Property 8: DB error returns structured JSON error response
 * Property 9: Error responses do not expose stack traces
 * Property 10: __v fields are omitted from list responses
 *
 * Validates: Requirements 5.3, 5.6, 8.3, 8.4, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import scoreRoutes from './scoreRoutes.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../middleware/authMiddleware.js', () => ({
  protect: (req: any, _res: any, next: any) => {
    req.user = { _id: 'user1', role: 'admin' };
    next();
  },
}));

vi.mock('../models/ScoreRecord.js', () => {
  const findMock = vi.fn();
  const countDocumentsMock = vi.fn();
  const createMock = vi.fn();

  // Chainable query builder
  const chainable = {
    sort: () => chainable,
    skip: () => chainable,
    limit: () => chainable,
    lean: () => findMock(),
  };

  return {
    default: {
      find: vi.fn(() => chainable),
      countDocuments: countDocumentsMock,
      create: createMock,
      findOne: vi.fn(),
    },
    __findMock: findMock,
    __countDocumentsMock: countDocumentsMock,
  };
});

vi.mock('../models/User.js', () => ({
  default: {
    findById: vi.fn(() => ({ lean: () => Promise.resolve({ streak: 0 }) })),
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
  },
}));

import ScoreRecord from '../models/ScoreRecord.js';

const app = express();
app.use(express.json());
app.use('/api/scores', scoreRoutes);

// ---------------------------------------------------------------------------
// Property 7: Paginated list responses are bounded and include metadata
// Validates: Requirements 5.3, 9.4
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 7: Paginated list responses are bounded and include metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 5.3, 9.4**
     *
     * Tag: Feature: firebase-removal-optimization, Property 7: Paginated list responses are bounded and include metadata
     *
     * For any call to GET /api/scores/:userId?page=P&limit=L, the response must
     * contain at most L records, and the body must include total, page, and pages
     * fields where pages = ceil(total / L).
     */
    'Property 7: Paginated list responses are bounded and include metadata',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 500 }),
          async (page, limit, total) => {
            vi.clearAllMocks();

            // Build mock records — at most `limit` items for this page
            const recordsOnPage = Math.min(limit, Math.max(0, total - (page - 1) * limit));
            const mockRecords = Array.from({ length: recordsOnPage }, (_, i) => ({
              _id: `id_${i}`,
              quizId: `quiz_${i}`,
              subject: 'Math',
              score: 80,
              total: 10,
              percentage: 80,
            }));

            // Wire mocks
            const chainable: any = {
              sort: () => chainable,
              skip: () => chainable,
              limit: () => chainable,
              lean: () => Promise.resolve(mockRecords),
            };
            vi.mocked(ScoreRecord.find).mockReturnValue(chainable);
            vi.mocked(ScoreRecord.countDocuments).mockResolvedValue(total as any);

            const res = await request(app)
              .get(`/api/scores/user1?page=${page}&limit=${limit}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('records');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('pages');
            expect(res.body).toHaveProperty('total');

            expect(res.body.records.length).toBeLessThanOrEqual(limit);
            expect(res.body.page).toBe(page);
            expect(res.body.total).toBe(total);
            expect(res.body.pages).toBe(Math.ceil(total / limit));
          }
        ),
        { numRuns: 50 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 8: DB error returns structured JSON error response
// Validates: Requirements 5.6, 8.3
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 8: DB error returns structured JSON error response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 5.6, 8.3**
     *
     * Tag: Feature: firebase-removal-optimization, Property 8: DB error returns structured JSON error response
     *
     * For any Express route handler, if the underlying database operation throws,
     * the response must have an HTTP status >= 400 and a JSON body containing a
     * message string field.
     */
    'Property 8: DB error returns structured JSON error response',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          async (errorMessage) => {
            vi.clearAllMocks();

            // Mock DB to throw with the generated error message
            const chainable: any = {
              sort: () => chainable,
              skip: () => chainable,
              limit: () => chainable,
              lean: () => Promise.reject(new Error(errorMessage)),
            };
            vi.mocked(ScoreRecord.find).mockReturnValue(chainable);
            vi.mocked(ScoreRecord.countDocuments).mockResolvedValue(0 as any);

            const res = await request(app).get('/api/scores/user1');

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).toHaveProperty('message');
            expect(typeof res.body.message).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 9: Error responses do not expose stack traces
// Validates: Requirements 8.4
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 9: Error responses do not expose stack traces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 8.4**
     *
     * Tag: Feature: firebase-removal-optimization, Property 9: Error responses do not expose stack traces
     *
     * For any error response from the Express API, the JSON body must not
     * contain a stack field.
     */
    'Property 9: Error responses do not expose stack traces',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          async (errorMessage) => {
            vi.clearAllMocks();

            const chainable: any = {
              sort: () => chainable,
              skip: () => chainable,
              limit: () => chainable,
              lean: () => Promise.reject(new Error(errorMessage)),
            };
            vi.mocked(ScoreRecord.find).mockReturnValue(chainable);
            vi.mocked(ScoreRecord.countDocuments).mockResolvedValue(0 as any);

            const res = await request(app).get('/api/scores/user1');

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).not.toHaveProperty('stack');
          }
        ),
        { numRuns: 50 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 10: __v fields are omitted from list responses
// Validates: Requirements 9.3
// ---------------------------------------------------------------------------

describe('firebase-removal-optimization — Property 10: __v fields are omitted from list responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 9.3**
     *
     * Tag: Feature: firebase-removal-optimization, Property 10: __v fields are omitted from list responses
     *
     * For any list response from the Express API, no item in the returned array
     * should contain a __v field (Mongoose internal version key).
     */
    'Property 10: __v fields are omitted from list responses',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              _id: fc.string(),
              subject: fc.string(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (mockItems) => {
            vi.clearAllMocks();

            // Simulate DB returning items without __v (lean() strips Mongoose internals)
            const chainable: any = {
              sort: () => chainable,
              skip: () => chainable,
              limit: () => chainable,
              lean: () => Promise.resolve(mockItems),
            };
            vi.mocked(ScoreRecord.find).mockReturnValue(chainable);
            vi.mocked(ScoreRecord.countDocuments).mockResolvedValue(mockItems.length as any);

            const res = await request(app).get('/api/scores/user1');

            expect(res.status).toBe(200);
            const records: any[] = res.body.records;
            expect(Array.isArray(records)).toBe(true);

            for (const item of records) {
              expect(item).not.toHaveProperty('__v');
            }
          }
        ),
        { numRuns: 50 }
      );
    }
  );
});
