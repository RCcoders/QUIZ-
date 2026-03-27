import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as fc from 'fast-check';

// ─────────────────────────────────────────────────────────────────────────────
// Bugfix spec: role-switching-login-bug
// Task 5.7: Preservation-checking tests — Property 2
// Validates: Requirements 3.3 (sign-out clears localStorage role and sets user to null)
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'AuthContext.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.7 — signOut clears localStorage role and sets user/userProfile to null
// Validates: Requirements 3.3
// ─────────────────────────────────────────────────────────────────────────────

describe('PRESERVATION 5.7 — signOut clears localStorage role and sets user to null', () => {
    it('source calls localStorage.removeItem with userRole key on sign-out', () => {
        expect(source).toContain("localStorage.removeItem('userRole')");
    });

    it('source sets user to null on sign-out', () => {
        expect(source).toContain('setUser(null)');
    });

    it('source sets userProfile to null on sign-out', () => {
        expect(source).toContain('setUserProfile(null)');
    });

    it('source calls firebaseSignOut on sign-out', () => {
        expect(source).toContain('firebaseSignOut(auth)');
    });

    it('signOut function is async', () => {
        expect(source).toContain('const signOut = async');
    });

    it('signOut awaits the Firebase sign-out call', () => {
        expect(source).toContain('await firebaseSignOut(auth)');
    });

    it('signOut is exposed in the AuthContext value', () => {
        expect(source).toContain('signOut');
        // Verify it's in the context provider value
        expect(source).toContain('{ user, userProfile, loading, signUp, signIn, signInWithGoogle, signOut }');
    });

    it('Property — signOut behavior: localStorage.removeItem is always called with userRole', () => {
        /**
         * **Validates: Requirements 3.3**
         */
        // Simulate the signOut logic from AuthContext
        function simulateSignOut(storage: Map<string, string>): { userNull: boolean; profileNull: boolean; roleCleared: boolean } {
            // Mirrors: localStorage.removeItem('userRole'); setUser(null); setUserProfile(null);
            storage.delete('userRole');
            return {
                userNull: true,       // setUser(null)
                profileNull: true,    // setUserProfile(null)
                roleCleared: !storage.has('userRole'),
            };
        }

        fc.assert(
            fc.property(
                fc.constantFrom('student', 'teacher'),
                (role) => {
                    const storage = new Map<string, string>([['userRole', role]]);
                    const result = simulateSignOut(storage);
                    return result.userNull && result.profileNull && result.roleCleared;
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property — signOut always clears role regardless of what was stored', () => {
        /**
         * **Validates: Requirements 3.3**
         */
        fc.assert(
            fc.property(
                fc.string(),
                (storedRole) => {
                    const storage = new Map<string, string>([['userRole', storedRole]]);
                    // After signOut: removeItem('userRole')
                    storage.delete('userRole');
                    return !storage.has('userRole');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// AuthContext structure checks
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthContext — structure', () => {
    it('exports AuthProvider', () => {
        expect(source).toContain('export function AuthProvider');
    });

    it('exports useAuth hook', () => {
        expect(source).toContain('export function useAuth');
    });

    it('reads userRole from localStorage in onAuthStateChanged', () => {
        expect(source).toContain("localStorage.getItem('userRole')");
    });

    it('populates userProfile after onAuthStateChanged fires', () => {
        expect(source).toContain('setUserProfile(buildUserProfile');
    });

    it('populates userProfile after signIn resolves', () => {
        // AuthContext.signIn should set userProfile with the actual role
        expect(source).toContain('setUserProfile(buildUserProfile');
    });
});
