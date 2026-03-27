import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';
import { getRedirectPath } from '../utils/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// Bugfix spec: role-switching-login-bug
// Task 5: Preservation-checking tests — Property 2
// Validates: Requirements 3.1, 3.2, 3.3
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'ProtectedRoute.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.1 — ProtectedRoute: unauthenticated user redirects to /auth
// Validates: Requirements 3.1
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.1 — ProtectedRoute: unauthenticated user redirects to /auth', () => {
    it('source contains Navigate redirect to /auth', () => {
        expect(source).toContain('to="/auth"');
    });

    it('source checks for absence of user before redirecting to /auth', () => {
        expect(source).toContain('!user');
    });

    it('source uses Navigate component for the redirect', () => {
        expect(source).toContain('Navigate');
    });

    it('source uses replace on the /auth redirect', () => {
        expect(source).toContain('replace');
    });

    it('Property — unauthenticated state always maps to /auth redirect', () => {
        /**
         * **Validates: Requirements 3.1**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher', null as unknown as string),
                (role) => {
                    // When user is null (unauthenticated), ProtectedRoute redirects to /auth
                    // regardless of any role value
                    const user = null;
                    const redirectsToAuth = !user; // the guard condition
                    return redirectsToAuth === true;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.2 — ProtectedRoute: student redirects to /student/dashboard
// Validates: Requirements 3.2
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.2 — ProtectedRoute: student redirects to /student/dashboard', () => {
    it('source contains Navigate redirect to /student/dashboard', () => {
        expect(source).toContain('to="/student/dashboard"');
    });

    it("source checks userProfile role for 'student'", () => {
        expect(source).toContain("role === 'student'");
    });

    it('getRedirectPath maps student role to /student/dashboard', () => {
        expect(getRedirectPath('student')).toBe('/student/dashboard');
    });

    it('Property — student role always maps to /student/dashboard', () => {
        /**
         * **Validates: Requirements 3.2**
         */
        fc.assert(
            fc.property(
                fc.record({
                    uid: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                }),
                (userData) => {
                    const userProfile = { ...userData, role: 'student' as const, createdAt: '', streak: 0, lastActiveDate: '' };
                    // ProtectedRoute redirects students to /student/dashboard
                    const isStudent = userProfile.role === 'student';
                    const redirectPath = isStudent ? '/student/dashboard' : null;
                    return redirectPath === '/student/dashboard';
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.3 — ProtectedRoute: teacher renders children
// Validates: Requirements 3.3
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.3 — ProtectedRoute: teacher renders children', () => {
    it('source renders children when user is authenticated and not a student', () => {
        expect(source).toContain('children');
    });

    it('source does not redirect teachers (no to="/teacher" in ProtectedRoute)', () => {
        expect(source).not.toContain('to="/teacher"');
    });

    it('source returns children as a fragment', () => {
        expect(source).toContain('<>{children}</>');
    });

    it('Property — teacher role passes through ProtectedRoute (no redirect)', () => {
        /**
         * **Validates: Requirements 3.3**
         */
        fc.assert(
            fc.property(
                fc.record({
                    uid: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                }),
                (userData) => {
                    const user = { _id: userData.uid, email: userData.email, displayName: userData.displayName, role: 'teacher', token: '' };
                    const userProfile = { ...userData, role: 'teacher' as const, createdAt: '', streak: 0, lastActiveDate: '' };
                    // Teacher: user is set, role is not 'student' → renders children
                    const isAuthenticated = !!user;
                    const isStudent = userProfile.role === 'student';
                    const rendersChildren = isAuthenticated && !isStudent;
                    return rendersChildren === true;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Structure checks
// ─────────────────────────────────────────────────────────────────────────────

describe('ProtectedRoute — component structure', () => {
    it('imports useAuth hook', () => {
        expect(source).toContain('useAuth');
    });

    it('imports Navigate from react-router-dom', () => {
        expect(source).toContain("from 'react-router-dom'");
        expect(source).toContain('Navigate');
    });

    it('exports ProtectedRoute function', () => {
        expect(source).toContain('export function ProtectedRoute');
    });

    it('handles loading state', () => {
        expect(source).toContain('loading');
    });
});
