/**
 * Unit tests for PrivacyPage and TermsPage components.
 *
 * Validates: Requirements 6.3, 6.4, 6.5
 *
 * Since these pages have no auth dependencies, we verify their structure
 * by inspecting the source to confirm:
 * - No auth context import (renders without authentication)
 * - Contains expected heading text
 * - Contains correct Helmet title
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const privacySource = readFileSync(resolve(__dirname, 'PrivacyPage.tsx'), 'utf-8');
const termsSource = readFileSync(resolve(__dirname, 'TermsPage.tsx'), 'utf-8');

describe('PrivacyPage', () => {
    it('does not import AuthContext (renders without authentication)', () => {
        expect(privacySource).not.toContain('AuthContext');
        expect(privacySource).not.toContain('useAuth');
        expect(privacySource).not.toContain('ProtectedRoute');
    });

    it('contains "Privacy Policy" heading text', () => {
        expect(privacySource).toContain('Privacy Policy');
    });

    it('has a Helmet title of "Privacy Policy — Quizly"', () => {
        expect(privacySource).toContain('Privacy Policy — Quizly');
    });

    it('explains data usage', () => {
        expect(privacySource).toMatch(/We use your information/i);
    });
});

describe('TermsPage', () => {
    it('does not import AuthContext (renders without authentication)', () => {
        expect(termsSource).not.toContain('AuthContext');
        expect(termsSource).not.toContain('useAuth');
        expect(termsSource).not.toContain('ProtectedRoute');
    });

    it('contains "Terms of Service" heading text', () => {
        expect(termsSource).toContain('Terms of Service');
    });

    it('has a Helmet title of "Terms of Service — Quizly"', () => {
        expect(termsSource).toContain('Terms of Service — Quizly');
    });

    it('explains acceptable use', () => {
        expect(termsSource).toMatch(/lawful/i);
        expect(termsSource).toMatch(/educational purposes/i);
    });
});
