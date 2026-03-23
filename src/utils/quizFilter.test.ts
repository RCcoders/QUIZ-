import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterQuizzes, type QuizItem } from './quizFilter';

// Arbitrary: minimal QuizItem
const arbQuizItem = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 60 }),
    description: fc.string({ minLength: 1, maxLength: 120 }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Property 3: Search filter is a subset
// Validates: Requirements 4.3
// ─────────────────────────────────────────────────────────────────────────────
describe('filterQuizzes – property tests', () => {
    it('Property 3 – filtered result is always a subset of the original list', () => {
        fc.assert(
            fc.property(fc.array(arbQuizItem), fc.string(), (quizzes, query) => {
                const result = filterQuizzes(quizzes, query);
                return result.every((r) => quizzes.some((q) => q.id === r.id));
            }),
            { numRuns: 200 }
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 4: Search filter is case-insensitive
    // Validates: Requirements 4.3
    // ─────────────────────────────────────────────────────────────────────────
    it('Property 4 – lowercase and uppercase queries return the same results', () => {
        fc.assert(
            fc.property(fc.array(arbQuizItem), fc.string(), (quizzes, query) => {
                const lower = filterQuizzes(quizzes, query.toLowerCase());
                const upper = filterQuizzes(quizzes, query.toUpperCase());
                if (lower.length !== upper.length) return false;
                return lower.every((l, i) => l.id === upper[i].id);
            }),
            { numRuns: 200 }
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 5: Empty search restores full list
    // Validates: Requirements 4.4
    // ─────────────────────────────────────────────────────────────────────────
    it('Property 5 – empty query returns all quizzes', () => {
        fc.assert(
            fc.property(fc.array(arbQuizItem), (quizzes) => {
                const result = filterQuizzes(quizzes, '');
                return result.length === quizzes.length &&
                    result.every((r, i) => r.id === quizzes[i].id);
            }),
            { numRuns: 200 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests – Requirements 4.3
// ─────────────────────────────────────────────────────────────────────────────
const quizzes: QuizItem[] = [
    { id: '1', title: 'Machine Learning Practice', description: 'Test your ML fundamentals.' },
    { id: '2', title: 'SQL Fundamentals', description: 'Master database queries.' },
    { id: '3', title: 'Neural Networks', description: 'Deep dive into neurons and layers.' },
];

describe('filterQuizzes – unit tests', () => {
    it('exact title match returns that quiz', () => {
        const result = filterQuizzes(quizzes, 'SQL Fundamentals');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    it('partial description match returns matching quizzes', () => {
        const result = filterQuizzes(quizzes, 'neurons');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('3');
    });

    it('no match returns empty array', () => {
        const result = filterQuizzes(quizzes, 'blockchain');
        expect(result).toHaveLength(0);
    });

    it('empty query returns all quizzes', () => {
        const result = filterQuizzes(quizzes, '');
        expect(result).toHaveLength(quizzes.length);
    });

    it('case-insensitive title match', () => {
        const result = filterQuizzes(quizzes, 'machine learning');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });
});
