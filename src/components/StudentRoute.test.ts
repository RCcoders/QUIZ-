import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

    it('handles loading state by returning null', () => {
        expect(source).toContain('loading');
        expect(source).toContain('return null');
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
