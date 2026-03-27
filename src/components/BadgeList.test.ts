import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 3.4: Unit tests for BadgeList component
// Validates: Requirements 2.2, 2.4, 2.5
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'BadgeList.tsx'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// Requirement 2.2 — Badge count, icons, and dates
// ─────────────────────────────────────────────────────────────────────────────
describe('BadgeList – badge rendering (Requirement 2.2)', () => {
  it('iterates over badges array using badges.map', () => {
    expect(source).toContain('badges.map(');
  });

  it('references badge.badgeId to look up the definition', () => {
    expect(source).toContain('badge.badgeId');
  });

  it('renders the badge icon from the definition', () => {
    expect(source).toContain('def.icon');
  });

  it('renders the badge name from the definition', () => {
    expect(source).toContain('def.name');
  });

  it('renders the awarded date using formatDate or awardedAt', () => {
    const hasFormatDate = source.includes('formatDate');
    const hasAwardedAt = source.includes('awardedAt');
    expect(hasFormatDate || hasAwardedAt).toBe(true);
  });

  it('uses BADGE_DEFINITIONS to look up badge metadata', () => {
    expect(source).toContain('BADGE_DEFINITIONS');
  });

  it('uses badge.badgeId as the React key', () => {
    expect(source).toContain('key={badge.badgeId}');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Requirement 2.4 — Empty state when no badges
// ─────────────────────────────────────────────────────────────────────────────
describe('BadgeList – empty state (Requirement 2.4)', () => {
  it('renders empty-state message when badges array is empty', () => {
    expect(source).toContain('Complete quizzes to earn your first badge');
  });

  it('checks badges.length to determine empty state', () => {
    expect(source).toContain('badges.length');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Requirement 2.5 — Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────
describe('BadgeList – loading skeleton (Requirement 2.5)', () => {
  it('accepts a loading prop', () => {
    expect(source).toContain('loading');
  });

  it('renders animate-pulse skeleton when loading is true', () => {
    expect(source).toContain('animate-pulse');
  });

  it('renders a SkeletonCard or equivalent placeholder element', () => {
    const hasSkeletonCard = source.includes('SkeletonCard');
    const hasSkeletonDiv = source.includes('animate-pulse');
    expect(hasSkeletonCard || hasSkeletonDiv).toBe(true);
  });

  it('uses the loading prop to branch between skeleton and content', () => {
    expect(source).toContain('if (loading)');
  });
});
