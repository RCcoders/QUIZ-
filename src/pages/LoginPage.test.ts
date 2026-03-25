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

    it('reads role from userProfile with nullish fallback', () => {
        expect(source).toContain("userProfile?.role ?? ''");
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
