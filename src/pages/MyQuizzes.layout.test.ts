import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: teacher-layout-alignment
// Task 3.1: Unit tests for MyQuizzes layout
// Property 4: All teacher pages use TeacherSidebar with correct main content offset
// Property 5: All teacher pages share consistent background and padding
// Validates: Requirements 2.1, 4.1, 4.4
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'MyQuizzes.tsx'), 'utf-8');

describe('MyQuizzes layout – uses TeacherSidebar (Requirement 2.1)', () => {
  it('imports TeacherSidebar', () => {
    expect(source).toContain('TeacherSidebar');
  });

  it('renders <TeacherSidebar />', () => {
    expect(source).toContain('<TeacherSidebar');
  });

  it('does not contain old inline sidebar branding "The Curated Classroom"', () => {
    expect(source).not.toContain('The Curated Classroom');
  });

  it('does not contain an inline <aside> sidebar block', () => {
    // The old sidebar used a NAV_ITEMS constant — confirm it is gone
    expect(source).not.toContain('NAV_ITEMS');
  });
});

describe('MyQuizzes layout – main content offset (Property 4, Requirement 2.1)', () => {
  it('main content area has marginLeft of 240px', () => {
    expect(source).toContain("marginLeft: '240px'");
  });
});

describe('MyQuizzes layout – background and padding (Property 5, Requirements 4.1, 4.4)', () => {
  it('outer wrapper has background #F5F5F5', () => {
    expect(source).toContain("background: '#F5F5F5'");
  });

  it('main content area has padding 0 2rem 2rem', () => {
    expect(source).toContain("padding: '0 2rem 2rem'");
  });
});
