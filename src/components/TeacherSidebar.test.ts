import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { navItems } from '../config/navigation';

const EXPECTED_ITEMS = [
  { label: 'Dashboard', path: '/teacher' },
  { label: 'My Quizzes', path: '/teacher/my-quizzes' },
  { label: 'Reports', path: '/teacher/reports' },
  { label: 'Library', path: '/teacher/library' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature: teacher-layout-alignment
// Property 1: TeacherSidebar renders exactly four nav items with correct labels
// Validates: Requirements 1.1, 1.5
// ─────────────────────────────────────────────────────────────────────────────
describe('TeacherSidebar navItems – count and labels', () => {
  it('has exactly four nav items', () => {
    expect(navItems).toHaveLength(4);
  });

  it('contains the correct labels in order', () => {
    const labels = navItems.map(item => item.label);
    expect(labels).toEqual(['Dashboard', 'My Quizzes', 'Reports', 'Library']);
  });

  it('does not contain a "Students" item', () => {
    const hasStudents = navItems.some(item => item.label === 'Students');
    expect(hasStudents).toBe(false);
  });

  it('Property 1 – every label is one of the four expected labels', () => {
    const expectedLabels = new Set(EXPECTED_ITEMS.map(e => e.label));
    fc.assert(
      fc.property(fc.constantFrom(...navItems), (item) => {
        return expectedLabels.has(item.label);
      }),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: teacher-layout-alignment
// Property 2: TeacherSidebar nav items link to correct paths
// Validates: Requirements 1.4
// ─────────────────────────────────────────────────────────────────────────────
describe('TeacherSidebar navItems – paths', () => {
  it('each item links to the correct path', () => {
    EXPECTED_ITEMS.forEach(({ label, path }) => {
      const item = navItems.find(n => n.label === label);
      expect(item, `nav item "${label}" should exist`).toBeDefined();
      expect(item!.path).toBe(path);
    });
  });

  it('Property 2 – every item path matches its expected path', () => {
    const pathMap = new Map(EXPECTED_ITEMS.map(e => [e.label, e.path]));
    fc.assert(
      fc.property(fc.constantFrom(...navItems), (item) => {
        return item.path === pathMap.get(item.label);
      }),
      { numRuns: 100 }
    );
  });
});

import { readFileSync } from 'fs';
import { resolve } from 'path';

const sidebarSource = readFileSync(resolve(__dirname, 'TeacherSidebar.tsx'), 'utf-8');
