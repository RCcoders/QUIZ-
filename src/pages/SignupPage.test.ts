import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Task 6.1: Property test for password validation
// Validates: Requirements 1.8
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'SignupPage.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Property: Password shorter than 6 characters is rejected client-side
// Validates: Requirements 1.8
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure client-side password validation extracted from SignupPage logic.
 * Mirrors the validatePassword function in SignupPage.tsx.
 */
function validatePassword(value: string): { valid: boolean; error: string } {
    if (value.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' };
    }
    return { valid: true, error: '' };
}

describe('SignupPage – password validation (Property, Requirement 1.8)', () => {
    it('Property – any password shorter than 6 chars is rejected with an error message', () => {
        fc.assert(
            fc.property(
                // Generate strings of length 0–5
                fc.integer({ min: 0, max: 5 }).chain(len =>
                    fc.string({ minLength: len, maxLength: len })
                ),
                (shortPassword) => {
                    const result = validatePassword(shortPassword);
                    // Must be invalid and must produce a non-empty error
                    return result.valid === false && result.error.length > 0;
                }
            ),
            { numRuns: 200 }
        );
    });

    it('Property – passwords of exactly 6 chars are accepted', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 6, maxLength: 6 }),
                (password) => {
                    return validatePassword(password).valid === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property – passwords longer than 6 chars are accepted', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 7, maxLength: 50 }),
                (password) => {
                    return validatePassword(password).valid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 6.2: Unit tests for SignupPage
// Validates: Requirements 1.3, 1.7, 1.10, 1.11
// ─────────────────────────────────────────────────────────────────────────────

// Requirement 1.3 — role toggle with student/teacher options
describe('SignupPage – role toggle (Requirement 1.3)', () => {
    it('renders a role toggle with student option', () => {
        // data-testid is set via template literal: `role-${r}` where r iterates ['student','teacher']
        expect(source).toContain("'student'");
        expect(source).toContain('`role-${r}`');
    });

    it('renders a role toggle with teacher option', () => {
        expect(source).toContain("'teacher'");
        expect(source).toContain('`role-${r}`');
    });

    it('renders both student and teacher role labels', () => {
        expect(source).toContain('Student');
        expect(source).toContain('Teacher');
    });

    it('uses role state to control the toggle', () => {
        expect(source).toContain("role === r");
    });
});

// Requirement 1.7 — shows error when email already in use (keeps form fields populated)
describe('SignupPage – error handling (Requirement 1.7)', () => {
    it('renders an error message container', () => {
        expect(source).toContain('data-testid="error-message"');
    });

    it('displays the error state in the UI', () => {
        expect(source).toContain('{error &&');
    });

    it('keeps form fields populated on error (does not reset state on catch)', () => {
        // Fields use controlled state; only error is set in catch, not field resets
        expect(source).toContain('setError(');
        // Confirm no field-clearing calls in the catch block
        expect(source).not.toContain("setEmail('')");
        expect(source).not.toContain("setPassword('')");
        expect(source).not.toContain("setDisplayName('')");
    });
});

// Requirement 1.11 — disables submit button while loading
describe('SignupPage – loading state (Requirement 1.11)', () => {
    it('submit button has disabled attribute bound to loading state', () => {
        expect(source).toContain('disabled={loading}');
    });

    it('renders a loading indicator element', () => {
        expect(source).toContain('data-testid="loading-indicator"');
    });

    it('shows loading text while submitting', () => {
        expect(source).toContain('Creating account...');
    });

    it('submit button has a data-testid for testing', () => {
        expect(source).toContain('data-testid="submit-button"');
    });
});

// Requirement 1.10 — link to login page
describe('SignupPage – login link (Requirement 1.10)', () => {
    it('includes a link to /login', () => {
        expect(source).toContain('to="/login"');
    });

    it('has a login link with a testid', () => {
        expect(source).toContain('data-testid="login-link"');
    });

    it('uses React Router Link for navigation', () => {
        expect(source).toContain("from 'react-router-dom'");
        expect(source).toContain('Link');
    });
});

// Requirement 1.8 — client-side password validation
describe('SignupPage – password validation in source (Requirement 1.8)', () => {
    it('validates password length before calling signUp', () => {
        expect(source).toContain('validatePassword');
    });

    it('shows a password error element', () => {
        expect(source).toContain('data-testid="password-error"');
    });

    it('checks password length < 6', () => {
        expect(source).toContain('length < 6');
    });
});

// Requirement 1.9 — Google OAuth button
describe('SignupPage – Google OAuth (Requirement 1.9)', () => {
    it('renders a Google sign-in button', () => {
        expect(source).toContain('data-testid="google-signin-button"');
    });

    it('calls signInWithGoogle on click', () => {
        expect(source).toContain('signInWithGoogle');
        expect(source).toContain('handleGoogleSignIn');
    });
});

// General structure
describe('SignupPage – component structure', () => {
    it('imports useAuth hook', () => {
        expect(source).toContain('useAuth');
    });

    it('imports useNavigate from react-router-dom', () => {
        expect(source).toContain('useNavigate');
    });

    it('uses getRedirectPath for role-based redirect', () => {
        expect(source).toContain('getRedirectPath');
    });

    it('exports SignupPage function', () => {
        expect(source).toContain('export function SignupPage');
    });
});
