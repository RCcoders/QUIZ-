/**
 * Property-based tests for noteFilter
 *
 * Feature: student-profile-enhancements
 * Property 3: note filter correctness
 * Property 4: note filter is a subset
 *
 * Validates: Requirements 3.3, 3.4
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterNotes } from './noteFilter';
import type { Note } from '../types/student';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

function arbitraryNote(): fc.Arbitrary<Note> {
  return fc.record({
    id: fc.string({ minLength: 4, maxLength: 16 }),
    title: fc.string({ minLength: 0, maxLength: 60 }),
    subject: fc.string({ minLength: 1, maxLength: 30 }),
    content: fc.string({ minLength: 0, maxLength: 200 }),
    authorUid: fc.string({ minLength: 4, maxLength: 20 }),
    linkedQuizId: fc.option(fc.string({ minLength: 4, maxLength: 16 }), { nil: null }),
    published: fc.boolean(),
    createdAt: fc
      .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
      .map((ms) => new Date(ms).toISOString()),
    updatedAt: fc
      .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
      .map((ms) => new Date(ms).toISOString()),
  });
}

// ---------------------------------------------------------------------------
// Property 3: Note filter correctness
// Validates: Requirements 3.3, 3.4
// ---------------------------------------------------------------------------

describe('noteFilter property tests — Property 3', () => {
  it(
    /**
     * **Validates: Requirements 3.3, 3.4**
     *
     * Tag: Feature: student-profile-enhancements, Property 3: note filter correctness
     *
     * For any notes, query, and subject, every result note must match the
     * active subject (when not 'all') AND contain the query in title or
     * subject (case-insensitive, when query is not empty).
     */
    'Property 3: note filter correctness — every result matches the active subject and query',
    () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryNote()),
          fc.string(),
          fc.option(fc.string(), { nil: 'all' }),
          (notes, query, subject) => {
            const result = filterNotes(notes, query, subject ?? 'all');
            const q = query.trim().toLowerCase();
            return result.every(n =>
              ((subject ?? 'all') === 'all' || n.subject === (subject ?? 'all')) &&
              (q === '' || n.title.toLowerCase().includes(q) ||
                n.subject.toLowerCase().includes(q))
            );
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 4: Note filter is a subset
// Validates: Requirements 3.3, 3.4
// ---------------------------------------------------------------------------

describe('noteFilter property tests — Property 4', () => {
  it(
    /**
     * **Validates: Requirements 3.3, 3.4**
     *
     * Tag: Feature: student-profile-enhancements, Property 4: note filter is a subset
     *
     * For any notes, query, and subject, the result length is always less
     * than or equal to the input length.
     */
    'Property 4: note filter is a subset — result length ≤ input length for all inputs',
    () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryNote()),
          fc.string(),
          fc.string(),
          (notes, query, subject) => {
            const result = filterNotes(notes, query, subject);
            return result.length <= notes.length;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
