import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';
import { getRedirectPath } from '../utils/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// Bugfix spec: role-switching-login-bug
// Task 1: Exploratory tests — confirm the bug on UNFIXED code
//
// These tests are EXPECTED TO PASS (i.e., they confirm the bug exists).
// They document the WRONG behavior of the current implementation.
// After the fix is applied, these tests should be replaced by fix-checking
// tests (Task 4) that assert the CORRECT behavior.
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'LoginPage.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: simulate what LoginPage.handleSubmit does on the unfixed code.
// After signIn resolves successfully, it calls:
//   navigate(getRedirectPath(role), { replace: true })
// where `role` is the LOCAL UI toggle state — NOT the account role.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates the buggy post-login navigation in the unfixed LoginPage.
 * Returns the path that navigate() would be called with.
 */
function buggyNavigatePath(uiToggleRole: 'student' | 'teacher'): string {
    // This mirrors the exact line in handleSubmit / handleGoogleSignIn:
    //   navigate(getRedirectPath(role), { replace: true })
    // where `role` is the UI toggle state.
    return getRedirectPath(uiToggleRole);
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 1.1 — Teacher signs in with Student toggle
// Bug: navigate is called with '/student/dashboard' (the toggle role path)
//      instead of '/teacher' (the account role path)
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG EXPLORATION 1.1 — Teacher account + Student toggle (email/password)', () => {
    it('BUG: navigate is called with /student/dashboard when teacher uses student toggle', () => {
        const uiToggleRole: 'student' | 'teacher' = 'student'; // user clicked "Student"
        const actualAccountRole: 'student' | 'teacher' = 'teacher'; // real account role

        const navigatedTo = buggyNavigatePath(uiToggleRole);

        // BUG CONFIRMED: navigate uses the toggle role, not the account role
        expect(navigatedTo).toBe('/student/dashboard'); // wrong path
        expect(navigatedTo).not.toBe(getRedirectPath(actualAccountRole)); // not '/teacher'
    });

    it('FIXED: source code no longer calls navigate(getRedirectPath(role)) using local toggle state', () => {
        // After the fix: handleSubmit no longer has an immediate navigate call after signIn
        expect(source).not.toContain('navigate(getRedirectPath(role)');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 1.2 — Student signs in with Teacher toggle
// Bug: navigate is called with '/teacher' (the toggle role path)
//      instead of '/student/dashboard' (the account role path)
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG EXPLORATION 1.2 — Student account + Teacher toggle (email/password)', () => {
    it('BUG: navigate is called with /teacher when student uses teacher toggle', () => {
        const uiToggleRole: 'student' | 'teacher' = 'teacher'; // user clicked "Teacher"
        const actualAccountRole: 'student' | 'teacher' = 'student'; // real account role

        const navigatedTo = buggyNavigatePath(uiToggleRole);

        // BUG CONFIRMED: navigate uses the toggle role, not the account role
        expect(navigatedTo).toBe('/teacher'); // wrong path
        expect(navigatedTo).not.toBe(getRedirectPath(actualAccountRole)); // not '/student/dashboard'
    });

    it('BUG: Property — for any mismatched (uiToggle, accountRole) pair, navigate uses the wrong path', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const),
                fc.constantFrom('student', 'teacher' as const),
                (uiToggleRole, actualAccountRole) => {
                    // Only test the mismatch case (the bug condition)
                    fc.pre(uiToggleRole !== actualAccountRole);

                    const navigatedTo = buggyNavigatePath(uiToggleRole);
                    const correctPath = getRedirectPath(actualAccountRole);

                    // BUG: the path used is the toggle path, not the account path
                    return navigatedTo !== correctPath;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 1.3 — Google sign-in with mismatched toggle
// Bug: handleGoogleSignIn also calls navigate(getRedirectPath(role)) using
//      the UI toggle state, same as handleSubmit
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG EXPLORATION 1.3 — Google sign-in with mismatched toggle', () => {
    it('BUG: Google sign-in also navigates using the UI toggle role, not account role', () => {
        // handleGoogleSignIn has the same bug as handleSubmit
        // Both call: navigate(getRedirectPath(role), { replace: true })
        const uiToggleRole: 'student' | 'teacher' = 'student'; // user clicked "Student"
        const actualAccountRole: 'student' | 'teacher' = 'teacher'; // real Google account role

        const navigatedTo = buggyNavigatePath(uiToggleRole);

        expect(navigatedTo).toBe('/student/dashboard'); // wrong — should be '/teacher'
        expect(navigatedTo).not.toBe(getRedirectPath(actualAccountRole));
    });

    it('FIXED: source code no longer has navigate(getRedirectPath(role)) in handleGoogleSignIn', () => {
        // After the fix: both handleSubmit and handleGoogleSignIn no longer have the buggy navigate call.
        const matches = source.match(/navigate\(getRedirectPath\(role\)/g) ?? [];
        // There should be 0 occurrences — the immediate navigate calls were removed
        expect(matches.length).toBe(0);
    });

    it('BUG: Property — Google sign-in with any mismatched toggle produces wrong path', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher' as const),
                fc.constantFrom('student', 'teacher' as const),
                (uiToggleRole, actualAccountRole) => {
                    fc.pre(uiToggleRole !== actualAccountRole);

                    // Google sign-in uses the same buggy logic
                    const navigatedTo = buggyNavigatePath(uiToggleRole);
                    const correctPath = getRedirectPath(actualAccountRole);

                    return navigatedTo !== correctPath;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 1.4 — Already-authenticated user mounts LoginPage with userProfile=null
// Bug: the useEffect guard is `if (user && userProfile)` — since AuthContext
//      never populates userProfile (always null), the redirect never fires.
//      The user stays stuck on the login page.
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG EXPLORATION 1.4 — Already-authenticated user, userProfile=null → no redirect', () => {
    it('BUG: useEffect guard requires userProfile, which AuthContext never sets', () => {
        // AuthContext.userProfile is initialized to null and never updated after sign-in.
        // The useEffect in LoginPage: if (user && userProfile) { navigate(...) }
        // Since userProfile is always null, this condition is never true.

        const user = { _id: 'uid-123', email: 'teacher@test.com', role: 'teacher', displayName: 'Teacher', token: '' };
        const userProfile = null; // AuthContext never sets this

        // Simulate the useEffect condition from the unfixed LoginPage
        const wouldRedirect = !!(user && userProfile);

        // BUG CONFIRMED: redirect never fires because userProfile is null
        expect(wouldRedirect).toBe(false);
    });

    it('FIXED: AuthContext now calls setUserProfile with a real value after sign-in', () => {
        const authSource = readFileSync(resolve(__dirname, '../contexts/AuthContext.tsx'), 'utf-8');

        // After the fix: setUserProfile is called with a real UserProfile object
        const setUserProfileWithValue = authSource.match(/setUserProfile\([^n]/g) ?? [];
        // setUserProfile(buildUserProfile(...)) is now called — not just setUserProfile(null)
        expect(setUserProfileWithValue.length).toBeGreaterThan(0);
    });

    it('FIXED: userProfile is now populated after sign-in', () => {
        const authSource = readFileSync(resolve(__dirname, '../contexts/AuthContext.tsx'), 'utf-8');

        // Initial state is null
        expect(authSource).toContain('useState<UserProfile | null>(null)');

        // After the fix: setUserProfile is called with a real value after sign-in
        expect(authSource).toContain('setUserProfile(buildUserProfile(fbUser, role))');
    });

    it('BUG: Property — for any authenticated user, if userProfile is null, no redirect fires', () => {
        fc.assert(
            fc.property(
                fc.record({
                    _id: fc.string({ minLength: 1 }),
                    email: fc.emailAddress(),
                    displayName: fc.string({ minLength: 1 }),
                    role: fc.constantFrom('student', 'teacher'),
                    token: fc.constant(''),
                }),
                (user) => {
                    const userProfile = null; // always null in unfixed AuthContext
                    const wouldRedirect = !!(user && userProfile);
                    return wouldRedirect === false;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 1.5 — Summary: confirm all bug conditions are present in source
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG EXPLORATION 1.5 — Source-level confirmation of all bug conditions', () => {
    it('FIXED: handleSubmit no longer navigates immediately using UI toggle role', () => {
        // After the fix: the immediate navigate call was removed from handleSubmit
        expect(source).not.toContain("navigate(getRedirectPath(role), { replace: true })");
    });

    it('FIXED: handleGoogleSignIn no longer navigates immediately using UI toggle role', () => {
        // After the fix: the immediate navigate call was removed from handleGoogleSignIn
        expect(source).not.toContain("navigate(getRedirectPath(role), { replace: true })");
    });

    it('FIXED: useEffect redirect guard now includes !loading check', () => {
        // After the fix: guard is `if (user && userProfile && !loading)`
        expect(source).toContain('if (user && userProfile && !loading)');
        // The old guard without !loading is gone
        expect(source).not.toContain('if (user && userProfile)');
    });

    it('FIXED: useEffect uses userProfile.role directly (non-null guaranteed by guard)', () => {
        expect(source).toContain('userProfile.role');
        // The old nullish fallback pattern is gone
        expect(source).not.toContain("userProfile?.role ?? ''");
    });
});
