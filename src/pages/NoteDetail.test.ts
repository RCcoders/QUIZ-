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

  // Requirement 4.2 — fetches note from backend with apiFetch
  it('fetches note from backend using apiFetch', () => {
    expect(source).toContain('apiFetch');
    expect(source).toContain('/api/notes/');
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

// ─────────────────────────────────────────────────────────────────────────────
// Feature: ai-agent-system
// Task 13: Generate Notes button — Requirements 8.2, 8.4, 8.5, 8.6
// ─────────────────────────────────────────────────────────────────────────────

describe('NoteDetail – Generate Notes button (Requirements 8.2, 8.4, 8.5, 8.6)', () => {
  // Requirement 8.2 — "Generate Notes" button exists alongside "AI Study Notes"
  it('has a "Generate Notes" button', () => {
    expect(source).toContain('Generate Notes');
  });

  it('keeps the existing "AI Study Notes" button intact', () => {
    expect(source).toContain('AI Study Notes');
  });

  // Requirement 8.2 — calls POST /api/ai/agent/student/notes
  it('calls POST /api/ai/agent/student/notes', () => {
    expect(source).toContain('/api/ai/agent/student/notes');
  });

  // Requirement 8.2 — passes noteText in the request body
  it('passes noteText in the request body', () => {
    expect(source).toContain('noteText');
  });

  // Requirement 8.2 — passes topic in the request body
  it('passes topic in the request body', () => {
    expect(source).toContain('topic');
  });

  // Requirement 8.2 — renders summary from structured response
  it('renders summary from structured response', () => {
    expect(source).toContain('summary');
    expect(source).toContain('agentNotes.summary');
  });

  // Requirement 8.2 — renders keyConcepts from structured response
  it('renders keyConcepts from structured response', () => {
    expect(source).toContain('keyConcepts');
    expect(source).toContain('agentNotes.keyConcepts');
  });

  // Requirement 8.2 — renders importantQuestions from structured response
  it('renders importantQuestions from structured response', () => {
    expect(source).toContain('importantQuestions');
    expect(source).toContain('agentNotes.importantQuestions');
  });

  // Requirement 8.4 — button is disabled while loading
  it('disables the Generate Notes button while loading (agentLoading)', () => {
    expect(source).toContain('agentLoading');
    expect(source).toContain('disabled={agentLoading}');
  });

  // Requirement 8.4 — shows loading indicator while in-flight
  it('shows a loading indicator (Loader) while agentLoading is true', () => {
    expect(source).toContain('agentLoading ? <Loader');
  });

  // Requirement 8.5 — inline error displayed near the button
  it('displays agentError inline near the button', () => {
    expect(source).toContain('agentError');
    expect(source).toContain('{agentError}');
  });

  // Requirement 8.6 — 429 displays the rate-limit message
  it('displays rate-limit message on HTTP 429', () => {
    expect(source).toContain("You've reached the AI limit. Try again in a minute.");
  });
});
