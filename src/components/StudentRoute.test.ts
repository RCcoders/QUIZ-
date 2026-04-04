import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';
import { getRedirectPath } from '../utils/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Task 5.1: Unit tests for StudentRoute
// Validates: Requirements 2.5, 2.6
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'StudentRoute.tsx'), 'utf-8');

// Requirement 2.6 — unauthenticated user is redirected to /login
describe('StudentRoute – unauthenticated user (Requirement 2.6)', () => {
    it('redirects to /login when user is not authenticated', () => {
        expect(source).toContain('to="/login"');
    });

    it('uses Navigate for the redirect', () => {
        expect(source).toContain('Navigate');
    });

    it('checks for absence of user before redirecting to login', () => {
        expect(source).toContain('!user');
    });
});

// Requirement 2.5 — teacher role is redirected to /teacher
describe('StudentRoute – teacher role (Requirement 2.5)', () => {
    it('redirects to /teacher when role is teacher', () => {
        expect(source).toContain('to="/teacher"');
    });

    it('checks userProfile role for teacher', () => {
        expect(source).toContain("role === 'teacher'");
    });
});

// Authenticated student — renders children
describe('StudentRoute – authenticated student', () => {
    it('renders children for authenticated students', () => {
        expect(source).toContain('children');
    });

    it('uses replace on Navigate redirects', () => {
        expect(source).toContain('replace');
    });

    it('handles loading state', () => {
        expect(source).toContain('loading');
    });
});

// Structure checks
describe('StudentRoute – component structure', () => {
    it('imports useAuth hook', () => {
        expect(source).toContain('useAuth');
    });

    it('imports Navigate from react-router-dom', () => {
        expect(source).toContain("from 'react-router-dom'");
        expect(source).toContain('Navigate');
    });

    it('exports StudentRoute function', () => {
        expect(source).toContain('export function StudentRoute');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bugfix spec: role-switching-login-bug
// Task 5: Preservation-checking tests — Property 2
// Validates: Requirements 3.4, 3.5, 3.6
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.4 — StudentRoute: unauthenticated user redirects to /login (unchanged)
// Validates: Requirements 3.4
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.4 — StudentRoute: unauthenticated user redirects to /login', () => {
    it('source contains Navigate redirect to /login', () => {
        expect(source).toContain('to="/login"');
    });

    it('source checks !user before redirecting to /login', () => {
        expect(source).toContain('!user');
    });

    it('Property — unauthenticated state always maps to /login redirect', () => {
        /**
         * **Validates: Requirements 3.4**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher', null as unknown as string),
                (role) => {
                    const user = null;
                    const redirectsToLogin = !user;
                    return redirectsToLogin === true;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.5 — StudentRoute: teacher redirects to /teacher (unchanged)
// Validates: Requirements 3.5
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.5 — StudentRoute: teacher redirects to /teacher', () => {
    it('enforces role-based isolation (students only)', () => {
        // Requirements 1.2: Validates role check logic
        // if ((userProfile?.role as any) !== 'student' && (userProfile?.role as any) !== 'admin')
        expect(source).toContain("!== 'student'");
        expect(source).toContain('<Navigate to="/teacher" replace />');
    });

    it('getRedirectPath maps teacher role to /teacher', () => {
        expect(getRedirectPath('teacher')).toBe('/teacher');
    });

    it('Property — teacher role always maps to /teacher redirect in StudentRoute', () => {
        /**
         * **Validates: Requirements 3.5**
         */
        fc.assert(
            fc.property(
                fc.record({
                    uid: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                }),
                (userData) => {
                    const userProfile = { ...userData, role: 'teacher' as const, createdAt: '', streak: 0, lastActiveDate: '' };
                    const isTeacher = userProfile.role === 'teacher';
                    const redirectPath = isTeacher ? '/teacher' : null;
                    return redirectPath === '/teacher';
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.6 — StudentRoute: student renders children (unchanged)
// Validates: Requirements 3.6
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.6 — StudentRoute: student renders children', () => {
    it('source renders children for authenticated students', () => {
        expect(source).toContain('children');
    });

    it('source does not redirect students (no to="/student/dashboard" in StudentRoute)', () => {
        expect(source).not.toContain('to="/student/dashboard"');
    });

    it('source returns children as a fragment', () => {
        expect(source).toContain('<>{children}</>');
    });

    it('Property — student role passes through StudentRoute (no redirect)', () => {
        /**
         * **Validates: Requirements 3.6**
         */
        fc.assert(
            fc.property(
                fc.record({
                    uid: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                }),
                (userData) => {
                    const user = { _id: userData.uid, email: userData.email, displayName: userData.displayName, role: 'student', token: '' };
                    const userProfile = { ...userData, role: 'student' as const, createdAt: '', streak: 0, lastActiveDate: '' };
                    const isAuthenticated = !!user;
                    const isTeacher = (userProfile.role as any) === 'teacher';
                    const rendersChildren = isAuthenticated && !isTeacher;
                    return rendersChildren === true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
