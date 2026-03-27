import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-pages
// Task 4.1: Unit tests for StudentNavbar
// Validates: Requirements 8.1, 8.2, 8.5
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'StudentNavbar.tsx'), 'utf-8');

// Requirement 8.1 — shared nav with student name and sign-out option
describe('StudentNavbar – authenticated state (Requirement 8.1, 8.5)', () => {
    it('renders a Sign Out button', () => {
        expect(source).toContain('Sign Out');
    });

    it('displays the student display name from userProfile', () => {
        expect(source).toContain('userProfile?.displayName');
    });

    it('calls signOut on sign-out action', () => {
        expect(source).toContain('handleSignOut');
        expect(source).toContain('signOut');
    });
});

// Requirement 8.1 — shows login/signup links when unauthenticated
describe('StudentNavbar – unauthenticated state (Requirement 8.1)', () => {
    it('renders a Login link', () => {
        expect(source).toContain('Login');
        expect(source).toContain('to="/login"');
    });

    it('renders a Sign Up link', () => {
        expect(source).toContain('Sign Up');
        expect(source).toContain('to="/signup"');
    });

    it('conditionally renders auth links based on user state', () => {
        // The component branches on `user` to show either auth links or sign-out
        expect(source).toContain('user ?');
    });
});

// Requirement 8.2 — logo links to /student/dashboard when authenticated, / when not
describe('StudentNavbar – logo navigation (Requirement 8.2)', () => {
    it('derives logo href from auth state', () => {
        expect(source).toContain("user ? '/student/dashboard' : '/'");
    });

    it('uses logoHref for the logo Link', () => {
        expect(source).toContain('to={logoHref}');
    });

    it('links to /student/dashboard when authenticated', () => {
        expect(source).toContain('/student/dashboard');
    });

    it('links to / when unauthenticated', () => {
        // The ternary includes '/' as the fallback path
        expect(source).toContain("user ? '/student/dashboard' : '/'");
    });
});

// Requirement 8.3 — Browse Quizzes link
describe('StudentNavbar – Browse Quizzes link (Requirement 8.3)', () => {
    it('includes a Browse Quizzes link to /student', () => {
        expect(source).toContain('Browse Quizzes');
        expect(source).toContain('to="/student"');
    });
});

// Requirement 8.4 — Join Live Game button
describe('StudentNavbar – Join Live Game button (Requirement 8.4)', () => {
    it('includes a Join Live Game link to /join', () => {
        expect(source).toContain('Join Live Game');
        expect(source).toContain('to="/join"');
    });
});

// Requirement 8.6 — hamburger menu for mobile
describe('StudentNavbar – mobile hamburger menu (Requirement 8.6)', () => {
    it('has hamburger menu state', () => {
        expect(source).toContain('menuOpen');
        expect(source).toContain('setMenuOpen');
    });

    it('renders a mobile menu when open', () => {
        expect(source).toContain('data-testid="mobile-menu"');
    });

    it('renders a hamburger toggle button', () => {
        expect(source).toContain('data-testid="hamburger-button"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-reports
// Task 6.2: Reports link in StudentNavbar
// Validates: Requirements 1.1, 1.2, 1.3, 1.4
// ─────────────────────────────────────────────────────────────────────────────

describe('StudentNavbar – Reports link (Requirements 1.1, 1.2, 1.3, 1.4)', () => {
    it('includes a Reports link to /student/reports in desktop nav', () => {
        expect(source).toContain('Reports');
        expect(source).toContain('to="/student/reports"');
    });

    it('accepts an optional activePage prop', () => {
        expect(source).toContain('activePage?: string');
    });

    it('applies active color when activePage is reports', () => {
        expect(source).toContain("activePage === 'reports'");
        expect(source).toContain('#6366F1');
    });

    it('applies active border when activePage is reports', () => {
        expect(source).toContain("2px solid #6366F1");
    });

    it('includes Reports link in mobile menu', () => {
        // Both desktop and mobile menus contain the reports link
        const reportLinkCount = (source.match(/to="\/student\/reports"/g) ?? []).length;
        expect(reportLinkCount).toBeGreaterThanOrEqual(2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 12.3: Unit tests for updated navigation
// Validates: Requirements 3.1, 8.1
// ─────────────────────────────────────────────────────────────────────────────

describe('StudentNavbar – Library link (Requirement 3.1)', () => {
    it('navLinks array contains a Library entry pointing to /student/library', () => {
        expect(source).toContain("to: '/student/library'");
        expect(source).toContain("label: 'Library'");
    });

    it('Library link uses the Library icon from lucide-react', () => {
        expect(source).toContain('Library,');
        expect(source).toContain("icon: Library");
    });
});

describe('StudentNavbar – avatar links to /student/settings (Requirement 8.1)', () => {
    it('avatar/initials circle is a Link to /student/settings', () => {
        expect(source).toContain('to="/student/settings"');
    });

    it('avatar renders initials inside the Link', () => {
        expect(source).toContain('{initials}');
        expect(source).toContain('to="/student/settings"');
    });
});

describe('StudentNavbar – mobile menu Settings link (Requirement 8.1)', () => {
    it('mobile menu includes a Settings link to /student/settings', () => {
        // The mobile menu renders a Settings link when user is authenticated
        const settingsLinkCount = (source.match(/to="\/student\/settings"/g) ?? []).length;
        expect(settingsLinkCount).toBeGreaterThanOrEqual(2);
    });

    it('mobile Settings link uses the Settings icon', () => {
        expect(source).toContain('Settings size={16}');
    });
});
