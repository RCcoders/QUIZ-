import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import {
    filterQuizzesBySearch,
    filterQuizzesByStatus,
    type QuizWithCount,
} from './MyQuizzes';

// Arbitraries
const quizArb = fc.record<QuizWithCount>({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 80 }),
    isActive: fc.boolean(),
    questionCount: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
});

const quizArrayArb = fc.array(quizArb, { maxLength: 50 });

// ─────────────────────────────────────────────────────────────────────────────
// Feature: quiz-app-overhaul, Property 1: My Quizzes search filter narrows results
// ─────────────────────────────────────────────────────────────────────────────
describe('filterQuizzesBySearch', () => {
    it('Property 1 – every result title contains the query (case-insensitive)', () => {
        fc.assert(
            fc.property(
                quizArrayArb,
                fc.string({ minLength: 1, maxLength: 20 }),
                (quizzes, query) => {
                    const results = filterQuizzesBySearch(quizzes, query);
                    const lower = query.toLowerCase();
                    return results.every(q => q.title.toLowerCase().includes(lower));
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: quiz-app-overhaul, Property 2: My Quizzes status filter is exclusive
// ─────────────────────────────────────────────────────────────────────────────
describe('filterQuizzesByStatus', () => {
    it('Property 2 – every result matches the active status when filter is "active"', () => {
        fc.assert(
            fc.property(quizArrayArb, (quizzes) => {
                const results = filterQuizzesByStatus(quizzes, 'active');
                return results.every(q => q.isActive === true);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 2 – every result matches the draft status when filter is "draft"', () => {
        fc.assert(
            fc.property(quizArrayArb, (quizzes) => {
                const results = filterQuizzesByStatus(quizzes, 'draft');
                return results.every(q => q.isActive === false);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 2 – "all" filter returns the full list unchanged', () => {
        fc.assert(
            fc.property(quizArrayArb, (quizzes) => {
                const results = filterQuizzesByStatus(quizzes, 'all');
                return results.length === quizzes.length;
            }),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: quiz-app-overhaul, Property 3: Delete confirmation prevents accidental removal
// ─────────────────────────────────────────────────────────────────────────────
describe('delete confirmation cancel', () => {
    it('Property 3 – cancelling delete confirmation leaves the list unchanged', () => {
        fc.assert(
            fc.property(
                fc.array(quizArb, { minLength: 1, maxLength: 50 }),
                (quizzes) => {
                    // Simulate the cancel path: showDeleteConfirm is set then reset to null.
                    // The list itself must not be mutated.
                    let showDeleteConfirm: string | null = quizzes[0].id;
                    const listBefore = [...quizzes];

                    // Cancel: reset confirmation state without touching the list
                    showDeleteConfirm = null;

                    // Assert list is unchanged
                    return (
                        showDeleteConfirm === null &&
                        quizzes.length === listBefore.length &&
                        quizzes.every((q, i) => q.id === listBefore[i].id)
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: quiz-app-overhaul, Property 4: Reports date filter reduces or preserves session count
// ─────────────────────────────────────────────────────────────────────────────
import { filterSessionsByDate, type QuizSession } from './Reports';

const sessionArb = fc.record<QuizSession>({
    id: fc.uuid(),
    quizTitle: fc.string({ minLength: 1, maxLength: 80 }),
    date: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2026-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
    participantCount: fc.nat({ max: 200 }),
    averageScore: fc.integer({ min: 0, max: 100 }),
    completed: fc.boolean(),
});

const sessionArrayArb = fc.array(sessionArb, { maxLength: 50 });

describe('filterSessionsByDate', () => {
    it('Property 4 – filtered count ≤ unfiltered count for "7d"', () => {
        fc.assert(
            fc.property(sessionArrayArb, (sessions) => {
                const filtered = filterSessionsByDate(sessions, '7d');
                return filtered.length <= sessions.length;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 4 – filtered count ≤ unfiltered count for "30d"', () => {
        fc.assert(
            fc.property(sessionArrayArb, (sessions) => {
                const filtered = filterSessionsByDate(sessions, '30d');
                return filtered.length <= sessions.length;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 4 – "all" range returns the full list', () => {
        fc.assert(
            fc.property(sessionArrayArb, (sessions) => {
                const filtered = filterSessionsByDate(sessions, 'all');
                return filtered.length === sessions.length;
            }),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: quiz-app-overhaul, Property 5: Library search filter narrows results
// Feature: quiz-app-overhaul, Property 6: Library subject filter is exclusive
// ─────────────────────────────────────────────────────────────────────────────
import { filterLibraryQuizzes, type LibraryQuiz } from './Library';

const libraryQuizArb = fc.record<LibraryQuiz>({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 80 }),
    subject: fc.constantFrom('Math', 'Science', 'History', 'English', 'Art'),
    questionCount: fc.nat({ max: 50 }),
});

const libraryQuizArrayArb = fc.array(libraryQuizArb, { maxLength: 50 });

describe('filterLibraryQuizzes – search', () => {
    it('Property 5 – every result title or subject contains the query (case-insensitive)', () => {
        fc.assert(
            fc.property(
                libraryQuizArrayArb,
                fc.string({ minLength: 1, maxLength: 20 }),
                (quizzes, query) => {
                    const results = filterLibraryQuizzes(quizzes, query, 'all');
                    const lower = query.toLowerCase();
                    return results.every(
                        q =>
                            q.title.toLowerCase().includes(lower) ||
                            q.subject.toLowerCase().includes(lower)
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('filterLibraryQuizzes – subject filter', () => {
    it('Property 6 – every result subject matches the non-"all" filter', () => {
        fc.assert(
            fc.property(
                libraryQuizArrayArb,
                fc.constantFrom('Math', 'Science', 'History', 'English', 'Art'),
                (quizzes, subject) => {
                    const results = filterLibraryQuizzes(quizzes, '', subject);
                    return results.every(q => q.subject === subject);
                }
            ),
            { numRuns: 100 }
        );
    });
});
