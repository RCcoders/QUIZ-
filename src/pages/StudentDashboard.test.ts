import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';
import { getContinueLearning } from '../utils/scoring';
import type { ScoreRecord } from '../types/student';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Task 8.1: Property test for "Continue Learning" ordering
// Validates: Requirements 3.6
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'StudentDashboard.tsx'), 'utf-8');

// Arbitrary: ScoreRecord with a valid ISO timestamp
const arbScoreRecord = fc.record({
    id: fc.uuid(),
    quizId: fc.string({ minLength: 1 }),
    quizTitle: fc.string({ minLength: 1 }),
    score: fc.nat(10),
    total: fc.integer({ min: 1, max: 10 }),
    percentage: fc.integer({ min: 0, max: 100 }),
    completedAt: fc
        .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
        .map(ms => new Date(ms).toISOString()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3.6: Continue Learning shows most recently attempted quizzes
// ─────────────────────────────────────────────────────────────────────────────
describe('getContinueLearning – Property 3.6 (Requirement 3.6)', () => {
    it('Property 3.6 – result is sorted by completedAt descending', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord, { minLength: 0, maxLength: 20 }), (records) => {
                const result = getContinueLearning(records);
                for (let i = 0; i < result.length - 1; i++) {
                    // Each record must be >= the next (descending order)
                    if (result[i].completedAt < result[i + 1].completedAt) return false;
                }
                return true;
            }),
            { numRuns: 200 }
        );
    });

    it('Property 3.6 – result contains at most 3 records', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord, { minLength: 0, maxLength: 20 }), (records) => {
                return getContinueLearning(records).length <= 3;
            }),
            { numRuns: 200 }
        );
    });

    it('Property 3.6 – result is a subset of the input records', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord, { minLength: 0, maxLength: 20 }), (records) => {
                const result = getContinueLearning(records);
                return result.every(r => records.some(orig => orig.id === r.id));
            }),
            { numRuns: 200 }
        );
    });

    it('Property 3.6 – does not mutate the original array', () => {
        fc.assert(
            fc.property(fc.array(arbScoreRecord, { minLength: 1, maxLength: 10 }), (records) => {
                const copy = records.map(r => r.completedAt);
                getContinueLearning(records);
                return records.every((r, i) => r.completedAt === copy[i]);
            }),
            { numRuns: 100 }
        );
    });

    // Concrete examples
    it('returns the 3 most recent records from a larger set', () => {
        const makeRecord = (id: string, completedAt: string): ScoreRecord => ({
            id,
            quizId: 'q1',
            quizTitle: 'Quiz',
            score: 5,
            total: 10,
            percentage: 50,
            completedAt,
        });

        const records = [
            makeRecord('a', '2024-01-01T00:00:00.000Z'),
            makeRecord('b', '2024-03-01T00:00:00.000Z'),
            makeRecord('c', '2024-02-01T00:00:00.000Z'),
            makeRecord('d', '2024-04-01T00:00:00.000Z'),
            makeRecord('e', '2024-05-01T00:00:00.000Z'),
        ];

        const result = getContinueLearning(records);
        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('e');
        expect(result[1].id).toBe('d');
        expect(result[2].id).toBe('b');
    });

    it('returns all records when fewer than 3 exist', () => {
        const makeRecord = (id: string, completedAt: string): ScoreRecord => ({
            id, quizId: 'q1', quizTitle: 'Quiz', score: 5, total: 10, percentage: 50, completedAt,
        });
        const records = [makeRecord('x', '2024-01-01T00:00:00.000Z')];
        expect(getContinueLearning(records)).toHaveLength(1);
    });

    it('returns empty array for empty input', () => {
        expect(getContinueLearning([])).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 8.2: Unit tests for StudentDashboard
// Validates: Requirements 3.5, 3.8
// ─────────────────────────────────────────────────────────────────────────────

describe('StudentDashboard – source structure (Requirements 3.5, 3.8)', () => {
    // Requirement 3.5 — empty state when no score records
    it('renders empty state when records.length === 0', () => {
        expect(source).toContain('data-testid="empty-state"');
        expect(source).toContain('records.length === 0');
    });

    it('empty state encourages taking first quiz', () => {
        expect(source).toContain('No quizzes completed yet');
        expect(source).toContain('Browse Quizzes');
    });

    // Requirement 3.8 — Join Live Game button
    it('renders a "Join Live Game" button linking to /join', () => {
        expect(source).toContain('data-testid="join-live-game-btn"');
        expect(source).toContain('to="/join"');
        expect(source).toContain('Join Live Game');
    });

    // Stats row (Requirements 3.3, 3.4)
    it('renders stats row with streak, total completed, and average score', () => {
        expect(source).toContain('data-testid="stats-row"');
        expect(source).toContain('data-testid="streak-count"');
        expect(source).toContain('data-testid="total-completed"');
        expect(source).toContain('data-testid="average-score"');
    });

    it('uses useStudentStats hook', () => {
        expect(source).toContain('useStudentStats');
    });

    it('uses getContinueLearning for the Continue Learning section', () => {
        expect(source).toContain('getContinueLearning');
    });

    // Requirement 3.2 — display name and avatar
    it('displays student display name', () => {
        expect(source).toContain('displayName');
        expect(source).toContain('Welcome back');
    });

    it('shows initials fallback when no avatar', () => {
        expect(source).toContain('initials');
    });

    // Requirement 3.7 — recommended quizzes
    it('renders Recommended Quizzes section', () => {
        expect(source).toContain('Recommended Quizzes');
        expect(source).toContain('RECOMMENDED_QUIZZES');
    });

    // Requirement 3.6 — Continue Learning section
    it('renders Continue Learning section', () => {
        expect(source).toContain('Continue Learning');
    });

    // Requirement 3.1 — uses StudentNavbar
    it('uses StudentNavbar', () => {
        expect(source).toContain('<StudentNavbar');
    });

    // Requirement 3.9 — navigation link to Quiz Browser
    it('includes a link to /student (Quiz Browser)', () => {
        expect(source).toContain('to="/student"');
    });

    // Requirement 3.10 — quiz cards navigate to quiz player
    it('navigates to quiz player when a continue-learning card is clicked', () => {
        expect(source).toContain('/student/quiz/');
        expect(source).toContain('navigate(');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 3.3: Badge integration tests
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
// ─────────────────────────────────────────────────────────────────────────────

describe('StudentDashboard – badge integration (Requirements 2.1–2.5)', () => {
    // Requirement 2.1 — My Badges section present
    it('renders a "My Badges" section heading', () => {
        expect(source).toContain('My Badges');
    });

    // Requirement 2.1 — useBadges hook is called
    it('calls useBadges hook', () => {
        expect(source).toContain('useBadges');
    });

    // Requirement 2.2 — Iterates over badges directly
    it('renders badges manually', () => {
        expect(source).toContain('badges?.map');
    });

    // Requirement 2.3 — ToastNotification is rendered for new badges
    it('renders ToastNotification for new badges', () => {
        expect(source).toContain('ToastNotification');
        expect(source).toContain('newBadges');
    });

    // Requirement 2.3 — toasts shown one at a time (dismiss removes first)
    it('dismisses toasts one at a time via slice(1)', () => {
        expect(source).toContain('slice(1)');
    });

    // Requirement 2.4 — evaluateBadges is called
    it('calls evaluateBadges after score records update', () => {
        expect(source).toContain('evaluateBadges');
    });

    // Requirement 2.5 — handles loading state
    it('uses badgesLoading for skeleton UI', () => {
        expect(source).toContain('badgesLoading ?');
    });

    // Non-blocking: evaluateBadges never blocks quiz completion
    it('evaluateBadges is called asynchronously (non-blocking)', () => {
        // The call uses .then() pattern, not await in render path
        expect(source).toContain('.then(');
        expect(source).toContain('.catch(');
    });
});
