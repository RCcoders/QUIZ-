import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: teacher-layout-alignment
// Task 5.1: Parameterized layout tests for all teacher pages
// Property 4: All teacher pages use TeacherSidebar with correct main content offset
// Property 5: All teacher pages share consistent background and padding
// Validates: Requirements 2.2, 2.3, 2.4, 4.1, 4.4
// ─────────────────────────────────────────────────────────────────────────────

const TEACHER_PAGES = [
  { name: 'TeacherDashboard', file: 'TeacherDashboard.tsx' },
  { name: 'Reports',          file: 'Reports.tsx' },
  { name: 'Library',          file: 'Library.tsx' },
];

for (const page of TEACHER_PAGES) {
  const source = readFileSync(resolve(__dirname, page.file), 'utf-8');

  describe(`${page.name} layout – uses TeacherSidebar (Property 4)`, () => {
    it('imports TeacherSidebar', () => {
      expect(source).toContain('TeacherSidebar');
    });

    it('renders <TeacherSidebar />', () => {
      expect(source).toContain('<TeacherSidebar');
    });
  });

  describe(`${page.name} layout – main content offset (Property 4, Requirements 2.2–2.4)`, () => {
    it('main content area has marginLeft of 240px', () => {
      expect(source).toContain("marginLeft: '240px'");
    });
  });

  describe(`${page.name} layout – background and padding (Property 5, Requirements 4.1, 4.4)`, () => {
    it('outer wrapper has background #F5F5F5', () => {
      expect(source).toContain("background: '#F5F5F5'");
    });

    it('main content area has padding 0 2rem 2rem', () => {
      expect(source).toContain("padding: '0 2rem 2rem'");
    });
  });
}
