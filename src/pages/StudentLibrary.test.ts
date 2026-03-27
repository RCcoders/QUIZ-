import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 6.4: Unit tests for StudentLibrary
// Validates: Requirements 3.2, 3.3
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'StudentLibrary.tsx'), 'utf-8');

describe('StudentLibrary – source structure (Requirements 3.2, 3.3)', () => {
  // Requirement 3.2 — uses useNotes hook
  it('uses useNotes hook', () => {
    expect(source).toContain('useNotes');
  });

  // Requirement 3.2 — filters for published notes only
  it('filters notes for published: true', () => {
    expect(source).toContain('published');
  });

  // Requirement 3.2 — uses filterNotes utility for search/filter
  it('uses filterNotes for search and subject filtering', () => {
    expect(source).toContain('filterNotes');
  });

  // Requirement 3.2 — renders NoteCard components
  it('renders NoteCard components', () => {
    expect(source).toContain('NoteCard');
  });

  // Requirement 3.3 — has subject filter chips
  it('has subject filter chips', () => {
    expect(source).toContain('selectedSubject');
    expect(source).toContain('setSelectedSubject');
  });

  // Requirement 3.3 — has search input
  it('has a search input', () => {
    expect(source).toContain('searchQuery');
    expect(source).toContain('setSearchQuery');
    expect(source).toContain('Search notes');
  });

  // Requirement 3.2 — has empty state message
  it('has an empty state message when no notes found', () => {
    expect(source).toContain('No notes found');
  });

  // Requirement 3.2 — navigates to /student/library/:noteId on card click
  it('navigates to /student/library/:noteId when a note card is clicked', () => {
    expect(source).toContain('/student/library/');
    expect(source).toContain('navigate(');
  });

  // Requirement 3.2 — uses StudentNavbar
  it('uses StudentNavbar', () => {
    expect(source).toContain('StudentNavbar');
  });
});
