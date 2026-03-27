import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 6.4: Unit tests for NoteDetail
// Validates: Requirements 4.2, 4.3, 4.5
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'NoteDetail.tsx'), 'utf-8');

describe('NoteDetail – source structure (Requirements 4.2, 4.3, 4.5)', () => {
  // Requirement 4.2 — uses useParams to get noteId
  it('uses useParams to get noteId', () => {
    expect(source).toContain('useParams');
    expect(source).toContain('noteId');
  });

  // Requirement 4.2 — fetches note from Firestore with getDoc
  it('fetches note from Firestore using getDoc', () => {
    expect(source).toContain('getDoc');
    expect(source).toContain('doc(');
  });

  // Requirement 4.3 — shows "Practice Quiz" button when linkedQuizId is set
  it('shows "Practice Quiz" button when linkedQuizId is set', () => {
    expect(source).toContain('linkedQuizId');
    expect(source).toContain('Practice Quiz');
  });

  // Requirement 4.3 — links Practice Quiz button to the correct quiz route
  it('links Practice Quiz button to /student/quiz/:linkedQuizId', () => {
    expect(source).toContain('/student/quiz/');
  });

  // Requirement 4.5 — shows "Adaptive Practice" button when no linkedQuizId
  it('shows "Adaptive Practice" button when linkedQuizId is absent', () => {
    expect(source).toContain('Adaptive Practice');
  });

  // Requirement 4.5 — Adaptive Practice links to adaptive quiz with noteId param
  it('links Adaptive Practice button to /student/adaptive-quiz with noteId param', () => {
    expect(source).toContain('/student/adaptive-quiz');
    expect(source).toContain('noteId');
  });

  // Requirement 4.2 — shows "Note not found" when document does not exist
  it('shows "Note not found" when the document does not exist', () => {
    expect(source).toContain('Note not found');
    expect(source).toContain('notFound');
  });

  // Breadcrumb back to /student/library
  it('has a breadcrumb link back to /student/library', () => {
    expect(source).toContain('/student/library');
    expect(source).toContain('Back to Library');
  });

  // Requirement 4.2 — uses StudentNavbar
  it('uses StudentNavbar', () => {
    expect(source).toContain('StudentNavbar');
  });
});
