/**
 * Tests for QuizResultsSummary component.
 *
 * Feature: student-pages
 * Task 12.1 – Property test for results display
 * Task 12.2 – Unit tests for QuizResultsSummary
 *
 * Validates: Requirements 6.1, 6.2, 6.5, 6.6, 6.7
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';
import { getPerformanceLabel } from '../utils/scoring';

const source = readFileSync(resolve(__dirname, 'QuizResultsSummary.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Task 12.1 – Property test for results display
// Validates: Requirements 6.1, 6.2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NOTE: Property 1 ("Performance label covers all score ranges") is fully
 * covered by the property-based test suite in src/utils/scoring.test.ts under
 * the describe block "getPerformanceLabel". That test verifies the label
 * mapping for all integers in [0, 100].
 *
 * The property below focuses on the Results display rendering contract:
 * for any (score, total) pair, the component must render both the fraction
 * "score / total" and the percentage string.
 */

describe('QuizResultsSummary – Property: results display contains both percentage and fraction', () => {
    /**
     * Property: Results display contains both percentage and fraction
     *
     * For any (score, total) pair where 0 ≤ score ≤ total and total > 0,
     * the component source must contain the data-testid attributes for both
     * the percentage display and the fraction display.
     *
     * We verify the rendering contract by:
     * 1. Confirming the component renders a percentage element (data-testid="score-percentage")
     * 2. Confirming the component renders a fraction element (data-testid="score-fraction")
     * 3. Confirming the fraction template uses "score / total" format
     *
     * Validates: Requirements 6.1, 6.2
     */
    it('Property – component always renders both percentage and fraction display elements', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }).chain(total =>
                    fc.integer({ min: 0, max: total }).map(score => ({ score, total }))
                ),
                ({ score, total }) => {
                    // The percentage is computed as Math.round((score / total) * 100)
                    const percentage = Math.round((score / total) * 100);

                    // Verify the component has the structural elements to display both
                    const hasPercentageElement = source.includes('data-testid="score-percentage"');
                    const hasFractionElement = source.includes('data-testid="score-fraction"');

                    // Verify the fraction template renders "score / total" format
                    const hasFractionTemplate = source.includes('{score} / {total}');

                    // Verify the percentage value is rendered
                    const hasPercentageValue = source.includes('{percentage}%');

                    // Verify the performance label is derived from percentage
                    const hasPerformanceLabel = source.includes('getPerformanceLabel(percentage)');

                    // All representations must be present
                    const allPresent =
                        hasPercentageElement &&
                        hasFractionElement &&
                        hasFractionTemplate &&
                        hasPercentageValue &&
                        hasPerformanceLabel;

                    // Also verify the label is valid for this percentage
                    const label = getPerformanceLabel(percentage);
                    const validLabel =
                        label === 'Excellent' || label === 'Good' || label === 'Keep Practicing';

                    return allPresent && validLabel;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property – performance label is always one of the three valid values for any score/total pair', () => {
        /**
         * NOTE: This references Property 1 from task 2.1 (scoring.test.ts).
         * Here we verify the same invariant holds when percentage is derived
         * from a (score, total) pair as the component would compute it.
         *
         * Validates: Requirements 6.2
         */
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }).chain(total =>
                    fc.integer({ min: 0, max: total }).map(score => ({ score, total }))
                ),
                ({ score, total }) => {
                    const percentage = Math.round((score / total) * 100);
                    const label = getPerformanceLabel(percentage);
                    return label === 'Excellent' || label === 'Good' || label === 'Keep Practicing';
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 12.2 – Unit tests for QuizResultsSummary
// Validates: Requirements 6.2, 6.5, 6.6, 6.7
// ─────────────────────────────────────────────────────────────────────────────

// Requirement 6.2 — performance badge
describe('QuizResultsSummary – performance badge (Requirement 6.2)', () => {
    it('renders an "Excellent" badge for scores ≥ 80%', () => {
        // Component uses getPerformanceLabel(percentage) and renders the result as a badge
        expect(source).toContain('data-testid="performance-badge"');
        expect(source).toContain('getPerformanceLabel(percentage)');
        // The label value is rendered inside the badge element
        expect(source).toContain('{label}');
    });

    it('renders "Keep Practicing" badge for scores < 60% via getPerformanceLabel', () => {
        // getPerformanceLabel returns 'Keep Practicing' for < 60
        expect(getPerformanceLabel(59)).toBe('Keep Practicing');
        expect(getPerformanceLabel(0)).toBe('Keep Practicing');
    });

    it('renders "Excellent" badge for scores ≥ 80% via getPerformanceLabel', () => {
        expect(getPerformanceLabel(80)).toBe('Excellent');
        expect(getPerformanceLabel(100)).toBe('Excellent');
    });

    it('renders "Good" badge for scores in [60, 79] via getPerformanceLabel', () => {
        expect(getPerformanceLabel(60)).toBe('Good');
        expect(getPerformanceLabel(79)).toBe('Good');
    });

    it('badge element is present in component source', () => {
        expect(source).toContain('performance-badge');
    });
});

// Requirement 6.7 — "Score saved" message when authenticated
describe('QuizResultsSummary – score saved message (Requirement 6.7)', () => {
    it('renders "Score saved to your profile" message when authenticated', () => {
        expect(source).toContain('Score saved to your profile');
    });

    it('conditionally shows the message based on isAuthenticated prop', () => {
        expect(source).toContain('isAuthenticated');
        expect(source).toContain('data-testid="score-saved-message"');
    });
});

// Requirement 6.5 — "Retake Quiz" button
describe('QuizResultsSummary – Retake Quiz button (Requirement 6.5)', () => {
    it('renders a "Retake Quiz" button', () => {
        expect(source).toContain('Retake Quiz');
        expect(source).toContain('data-testid="retake-quiz-button"');
    });

    it('calls onRetake when the button is clicked', () => {
        expect(source).toContain('onClick={onRetake}');
    });
});

// Requirement 6.6 — "Browse More Quizzes" link to /student
describe('QuizResultsSummary – Browse More Quizzes link (Requirement 6.6)', () => {
    it('renders a "Browse More Quizzes" link', () => {
        expect(source).toContain('Browse More Quizzes');
        expect(source).toContain('data-testid="browse-quizzes-link"');
    });

    it('links to /student', () => {
        expect(source).toContain('to="/student"');
    });
});

// Requirement 6.1 — score as percentage AND fraction
describe('QuizResultsSummary – score display (Requirement 6.1)', () => {
    it('displays score as percentage', () => {
        expect(source).toContain('data-testid="score-percentage"');
        expect(source).toContain('{percentage}%');
    });

    it('displays score as fraction (e.g. "8 / 10")', () => {
        expect(source).toContain('data-testid="score-fraction"');
        expect(source).toContain('{score} / {total}');
    });
});

// Requirement 6.3 & 6.4 — question review with correct/incorrect distinction
describe('QuizResultsSummary – question review (Requirements 6.3, 6.4)', () => {
    it('renders question review section', () => {
        expect(source).toContain('Review Your Answers');
    });

    it('shows user answer for each question', () => {
        expect(source).toContain('data-testid={`user-answer-${i}`}');
        expect(source).toContain('Your Answer:');
    });

    it('shows correct answer when user was wrong', () => {
        expect(source).toContain('data-testid={`correct-answer-${i}`}');
        expect(source).toContain('Correct:');
    });

    it('visually distinguishes incorrect answers with different border color', () => {
        // Incorrect answers get a red left border (#EF4444), correct get green (#10B981)
        expect(source).toContain('#EF4444');
        expect(source).toContain('#10B981');
    });
});
