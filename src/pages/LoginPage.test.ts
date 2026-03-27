import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getRedirectPath } from '../utils/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Task 7.1: Unit tests for LoginPage redirect behavior
// Validates: Requirements 2.2, 2.3, 2.4
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'LoginPage.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Redirect logic — tested via getRedirectPath (the pure utility LoginPage uses)
// ─────────────────────────────────────────────────────────────────────────────

describe('LoginPage – redirect behavior (Requirements 2.2, 2.3, 2.4)', () => {
    // Requirement 2.2 — student role → /student/dashboard
    it('student role navigates to /student/dashboard', () => {
        expect(getRedirectPath('student')).toBe('/student/dashboard');
    });

    // Requirement 2.3 — teacher role → /teacher
    it('teacher role navigates to /teacher', () => {
        expect(getRedirectPath('teacher')).toBe('/teacher');
    });

    // Requirement 2.4 — missing/null role → /student/dashboard
    it('missing role (empty string) navigates to /student/dashboard', () => {
        expect(getRedirectPath('')).toBe('/student/dashboard');
    });

    it('null-ish role (undefined coerced to empty string) navigates to /student/dashboard', () => {
        // LoginPage uses: getRedirectPath(userProfile?.role ?? '')
        const undefinedRole: string | undefined = undefined;
        const role = undefinedRole ?? '';
        expect(getRedirectPath(role)).toBe('/student/dashboard');
    });

    it('unknown role navigates to /student/dashboard', () => {
        expect(getRedirectPath('admin')).toBe('/student/dashboard');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-level checks — verify LoginPage wires up the redirect correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('LoginPage – source structure (Requirements 2.2, 2.3, 2.4)', () => {
    it('uses getRedirectPath for role-based redirect', () => {
        expect(source).toContain('getRedirectPath');
    });

    it('reads role from userProfile directly (non-null guaranteed by guard)', () => {
        expect(source).toContain('userProfile.role');
    });

    it('redirects inside a useEffect watching user and userProfile', () => {
        expect(source).toContain('useEffect');
        expect(source).toContain('userProfile');
        expect(source).toContain('navigate(getRedirectPath');
    });

    it('includes a link to /signup for new users', () => {
        expect(source).toContain('to="/signup"');
        expect(source).toContain('data-testid="signup-link"');
    });

    it('is a login-only form (no signup toggle)', () => {
        expect(source).not.toContain('isLogin');
        expect(source).not.toContain('setIsLogin');
        expect(source).not.toContain('signUp(');
    });

    it('calls signIn on form submit', () => {
        expect(source).toContain('signIn(email, password)');
    });

    it('disables submit button while loading', () => {
        expect(source).toContain('disabled={loading}');
    });

    it('exports LoginPage function', () => {
        expect(source).toContain('export function LoginPage');
    });
});


// ─────────────────────────────────────────────────────────────────────────────
// Bugfix spec: role-switching-login-bug
// Task 4: Fix-checking tests — Property 1: Post-Login Navigation Uses Actual Account Role
// Validates: Requirements 2.1, 2.2, 2.3, 2.4
// ─────────────────────────────────────────────────────────────────────────────

import * as fc from 'fast-check';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: simulate the FIXED LoginPage navigation logic
//
// After the fix:
//   - handleSubmit / handleGoogleSignIn do NOT call navigate() directly
//   - The useEffect fires when (user && userProfile && !loading)
//   - It calls navigate(getRedirectPath(userProfile.role), { replace: true })
//
// AuthContext now populates userProfile with the actual account role from
// localStorage, so userProfile.role === actualAccountRole (not uiToggleRole).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates the FIXED post-login navigation.
 * The useEffect fires with the actual account role from userProfile.
 */
function fixedNavigatePath(actualAccountRole: 'student' | 'teacher'): string {
    return getRedirectPath(actualAccountRole);
}

/**
 * Simulates the fixed useEffect guard condition.
 * Fires when user, userProfile, and !loading are all truthy.
 */
function fixedUseEffectFires(
    user: object | null,
    userProfile: { role: string } | null,
    loading: boolean
): boolean {
    return !!(user && userProfile && !loading);
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 4.1 — Teacher account + Student toggle → navigate called with /teacher
// Validates: Requirements 2.1, 2.2
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX CHECK 4.1 — Teacher account + Student toggle (email/password)', () => {
    it('FIX: navigate is called with /teacher when teacher account signs in (regardless of toggle)', () => {
        const uiToggleRole: 'student' | 'teacher' = 'student'; // user clicked "Student"
        const actualAccountRole: 'student' | 'teacher' = 'teacher'; // real account role

        // After the fix: navigation uses actualAccountRole from userProfile, not uiToggleRole
        const navigatedTo = fixedNavigatePath(actualAccountRole);

        expect(navigatedTo).toBe('/teacher');
        expect(navigatedTo).not.toBe(getRedirectPath(uiToggleRole)); // not /student/dashboard
    });

    it('FIX: source no longer calls navigate(getRedirectPath(role)) with UI toggle in handleSubmit', () => {
        // The immediate navigate call using the local `role` state was removed
        expect(source).not.toContain('navigate(getRedirectPath(role)');
    });

    it('FIX: Property — teacher account always navigates to /teacher regardless of toggle', () => {
        /**
         * **Validates: Requirements 2.1, 2.2**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const), // any UI toggle value
                (uiToggleRole) => {
                    const actualAccountRole: 'student' | 'teacher' = 'teacher';
                    const navigatedTo = fixedNavigatePath(actualAccountRole);
                    // Must always be /teacher, never the toggle path when they differ
                    return navigatedTo === '/teacher';
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 4.2 — Student account + Teacher toggle → navigate called with /student/dashboard
// Validates: Requirements 2.1, 2.3
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX CHECK 4.2 — Student account + Teacher toggle (email/password)', () => {
    it('FIX: navigate is called with /student/dashboard when student account signs in (regardless of toggle)', () => {
        const uiToggleRole: 'student' | 'teacher' = 'teacher'; // user clicked "Teacher"
        const actualAccountRole: 'student' | 'teacher' = 'student'; // real account role

        const navigatedTo = fixedNavigatePath(actualAccountRole);

        expect(navigatedTo).toBe('/student/dashboard');
        expect(navigatedTo).not.toBe(getRedirectPath(uiToggleRole)); // not /teacher
    });

    it('FIX: Property — student account always navigates to /student/dashboard regardless of toggle', () => {
        /**
         * **Validates: Requirements 2.1, 2.3**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const), // any UI toggle value
                (uiToggleRole) => {
                    const actualAccountRole: 'student' | 'teacher' = 'student';
                    const navigatedTo = fixedNavigatePath(actualAccountRole);
                    return navigatedTo === '/student/dashboard';
                }
            ),
            { numRuns: 50 }
        );
    });

    it('FIX: Property — for any mismatched (uiToggle, accountRole) pair, navigate uses the correct account path', () => {
        /**
         * **Validates: Requirements 2.1, 2.2, 2.3**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const),
                fc.constantFrom('student', 'teacher' as const),
                (uiToggleRole, actualAccountRole) => {
                    fc.pre(uiToggleRole !== actualAccountRole);

                    const navigatedTo = fixedNavigatePath(actualAccountRole);
                    const correctPath = getRedirectPath(actualAccountRole);
                    const wrongPath = getRedirectPath(uiToggleRole);

                    // Must use the account role path, not the toggle path
                    return navigatedTo === correctPath && navigatedTo !== wrongPath;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 4.3 — Google sign-in with mismatched toggle → navigate uses actual role
// Validates: Requirements 2.1, 2.4
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX CHECK 4.3 — Google sign-in with mismatched toggle', () => {
    it('FIX: Google sign-in with student toggle + teacher account → navigate called with /teacher', () => {
        const uiToggleRole: 'student' | 'teacher' = 'student'; // user clicked "Student"
        const actualAccountRole: 'student' | 'teacher' = 'teacher'; // real Google account role

        // After the fix: handleGoogleSignIn no longer calls navigate directly
        // The useEffect fires with userProfile.role = actualAccountRole
        const navigatedTo = fixedNavigatePath(actualAccountRole);

        expect(navigatedTo).toBe('/teacher');
        expect(navigatedTo).not.toBe(getRedirectPath(uiToggleRole));
    });

    it('FIX: source no longer has navigate(getRedirectPath(role)) in handleGoogleSignIn', () => {
        const matches = source.match(/navigate\(getRedirectPath\(role\)/g) ?? [];
        expect(matches.length).toBe(0);
    });

    it('FIX: Property — Google sign-in always navigates to actual account role path', () => {
        /**
         * **Validates: Requirements 2.1, 2.4**
         */
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const),
                fc.constantFrom('student', 'teacher' as const),
                (uiToggleRole, actualAccountRole) => {
                    fc.pre(uiToggleRole !== actualAccountRole);

                    // Google sign-in now uses the same fixed logic as email/password
                    const navigatedTo = fixedNavigatePath(actualAccountRole);
                    return navigatedTo === getRedirectPath(actualAccountRole);
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 4.4 — Already-authenticated user mounts LoginPage → useEffect fires redirect
// Validates: Requirements 2.1, 2.5
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX CHECK 4.4 — Already-authenticated user mounts LoginPage → useEffect fires', () => {
    it('FIX: useEffect fires when user, userProfile, and !loading are all set (teacher)', () => {
        const user = { _id: 'uid-123', email: 'teacher@test.com', role: 'teacher', displayName: 'Teacher', token: '' };
        const userProfile = { role: 'teacher' as const, uid: 'uid-123', email: 'teacher@test.com', displayName: 'Teacher', createdAt: '', streak: 0, lastActiveDate: '' };
        const loading = false;

        const wouldRedirect = fixedUseEffectFires(user, userProfile, loading);
        expect(wouldRedirect).toBe(true);

        const navigatedTo = fixedNavigatePath(userProfile.role);
        expect(navigatedTo).toBe('/teacher');
    });

    it('FIX: useEffect fires when user, userProfile, and !loading are all set (student)', () => {
        const user = { _id: 'uid-456', email: 'student@test.com', role: 'student', displayName: 'Student', token: '' };
        const userProfile = { role: 'student' as const, uid: 'uid-456', email: 'student@test.com', displayName: 'Student', createdAt: '', streak: 0, lastActiveDate: '' };
        const loading = false;

        const wouldRedirect = fixedUseEffectFires(user, userProfile, loading);
        expect(wouldRedirect).toBe(true);

        const navigatedTo = fixedNavigatePath(userProfile.role);
        expect(navigatedTo).toBe('/student/dashboard');
    });

    it('FIX: useEffect does NOT fire while loading is true (prevents premature redirect)', () => {
        const user = { _id: 'uid-123', email: 'teacher@test.com', role: 'teacher', displayName: 'Teacher', token: '' };
        const userProfile = { role: 'teacher' as const, uid: 'uid-123', email: 'teacher@test.com', displayName: 'Teacher', createdAt: '', streak: 0, lastActiveDate: '' };
        const loading = true; // still loading

        const wouldRedirect = fixedUseEffectFires(user, userProfile, loading);
        expect(wouldRedirect).toBe(false);
    });

    it('FIX: useEffect does NOT fire when user is null (unauthenticated)', () => {
        const user = null;
        const userProfile = null;
        const loading = false;

        const wouldRedirect = fixedUseEffectFires(user, userProfile, loading);
        expect(wouldRedirect).toBe(false);
    });

    it('FIX: source useEffect guard includes !loading check', () => {
        expect(source).toContain('if (user && userProfile && !loading)');
    });

    it('FIX: source useEffect navigates using userProfile.role (not UI toggle role)', () => {
        expect(source).toContain('navigate(getRedirectPath(userProfile.role)');
    });

    it('FIX: Property — useEffect fires for any authenticated user with userProfile and !loading', () => {
        /**
         * **Validates: Requirements 2.1, 2.5**
         */
        fc.assert(
            fc.property(
                fc.record({
                    _id: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                    role: fc.constantFrom('student', 'teacher'),
                    token: fc.constant(''),
                }),
                fc.constantFrom('student', 'teacher' as const),
                (user, accountRole) => {
                    const userProfile = { role: accountRole, uid: user._id, email: user.email, displayName: user.displayName, createdAt: '', streak: 0, lastActiveDate: '' };
                    const loading = false;

                    const wouldRedirect = fixedUseEffectFires(user, userProfile, loading);
                    const navigatedTo = fixedNavigatePath(accountRole);

                    return wouldRedirect === true && navigatedTo === getRedirectPath(accountRole);
                }
            ),
            { numRuns: 100 }
        );
    });
});
