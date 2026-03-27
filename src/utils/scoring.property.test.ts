/**
 * Property-based tests for scoring utilities
 *
 * Feature: student-profile-enhancements
 * Property 7: score record round-trip
 *
 * Validates: Requirements 6.6
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Captured store — shared between addDoc and getDocs mocks
// ---------------------------------------------------------------------------

const store: Record<string, unknown> = {};

// ---------------------------------------------------------------------------
// Mock firebase/firestore before importing scoring utilities
// ---------------------------------------------------------------------------

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({ _path: segments.join('/') })),
  addDoc: vi.fn(async (ref: { _path: string }, data: unknown) => {
    const id = `doc_${Math.random().toString(36).slice(2, 10)}`;
    store[`${ref._path}/${id}`] = data;
    return { id };
  }),
  getDocs: vi.fn(async (q: { _ref: { _path: string } }) => {
    const prefix = q._ref._path + '/';
    const entries = Object.entries(store).filter(([k]) => k.startsWith(prefix));
    return {
      docs: entries.map(([key, data]) => ({
        id: key.split('/').pop() as string,
        data: () => data,
      })),
    };
  }),
  query: vi.fn((ref: unknown) => ({ _ref: ref })),
  orderBy: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({ db: {} }));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import { saveScoreRecord, getScoreRecords } from './scoring';
import type { ScoreRecord } from '../types/student';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbUid = fc.string({ minLength: 4, maxLength: 16 });

const arbScoreRecord: fc.Arbitrary<Omit<ScoreRecord, 'id'>> = fc.record({
  quizId: fc.string({ minLength: 4, maxLength: 16 }),
  quizTitle: fc.string({ minLength: 1, maxLength: 40 }),
  score: fc.integer({ min: 0, max: 100 }),
  total: fc.integer({ min: 1, max: 100 }),
  percentage: fc.integer({ min: 0, max: 100 }),
  completedAt: fc
    .integer({
      min: new Date('2020-01-01').getTime(),
      max: new Date('2030-01-01').getTime(),
    })
    .map((ms) => new Date(ms).toISOString()),
});

// ---------------------------------------------------------------------------
// Property 7: Score record round-trip
// Validates: Requirements 6.6
// ---------------------------------------------------------------------------

describe('scoring property tests — Property 7', () => {
  it(
    /**
     * **Validates: Requirements 6.6**
     *
     * Tag: Feature: student-profile-enhancements, Property 7: score record round-trip
     *
     * For any valid ScoreRecord, saving it and reading it back from Firestore
     * returns a record with the same quizId, score, total, and percentage.
     */
    'Property 7: score record round-trip — saved ScoreRecord fields match what is read back from Firestore',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbUid, arbScoreRecord, async (uid, record) => {
          // Isolate each iteration by clearing the store
          for (const key of Object.keys(store)) {
            delete store[key];
          }

          await saveScoreRecord(uid, record);
          const readBack = await getScoreRecords(uid);

          expect(readBack).toHaveLength(1);
          const saved = readBack[0];

          expect(saved.quizId).toBe(record.quizId);
          expect(saved.score).toBe(record.score);
          expect(saved.total).toBe(record.total);
          expect(saved.percentage).toBe(record.percentage);
        }),
        { numRuns: 100 }
      );
    }
  );
});
