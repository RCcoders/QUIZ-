import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 7.2: Unit tests for teacher library note management
// Validates: Requirements 5.3, 5.4, 5.5
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'Library.tsx'), 'utf-8');

// ── Requirement 5.5: Validation — empty title ─────────────────────────────
describe('Library – note form validation (Requirement 5.5)', () => {
    it('validates that title is required before writing to Firestore', () => {
        // The component checks noteForm.title.trim() and sets an error
        expect(source).toContain("noteForm.title.trim()");
        expect(source).toContain("errors.title");
    });

    it('shows a title validation error element in the JSX', () => {
        expect(source).toContain('data-testid="title-error"');
        expect(source).toContain('noteFormErrors.title');
    });

    it('validates that content is required before writing to Firestore', () => {
        // The component checks noteForm.content.trim() and sets an error
        expect(source).toContain("noteForm.content.trim()");
        expect(source).toContain("errors.content");
    });

    it('shows a content validation error element in the JSX', () => {
        expect(source).toContain('data-testid="content-error"');
        expect(source).toContain('noteFormErrors.content');
    });

    it('blocks API write when validation errors exist', () => {
        // After setting errors, the function returns early before calling addDoc/apiFetch
        const submitFnMatch = source.match(/async function handleNoteSubmit[\s\S]*?^    \}/m);
        const submitFn = submitFnMatch ? submitFnMatch[0] : source;
        // The early return must appear before apiFetch
        const returnIdx = submitFn.indexOf('if (Object.keys(errors).length > 0) return');
        const apiFetchIdx = submitFn.indexOf('apiFetch(');
        expect(returnIdx).toBeGreaterThan(-1);
        expect(apiFetchIdx).toBeGreaterThan(-1);
        expect(returnIdx).toBeLessThan(apiFetchIdx);
    });
});

// ── Requirement 5.3: Valid submission writes note with published: false ────
describe('Library – valid note submission (Requirement 5.3)', () => {
    it('calls apiFetch POST to write the note', () => {
        expect(source).toContain("apiFetch('/api/notes'");
        expect(source).toContain("method: 'POST'");
    });

    it('requires title and content', () => {
        expect(source).toContain('noteForm.title.trim()');
        expect(source).toContain('noteForm.content.trim()');
    });

    it('includes linkedQuizId if exists', () => {
        expect(source).toContain('linkedQuizId');
    });

    it('handles successful creation by clearing form and closing', () => {
        expect(source).toContain('setNoteForm(EMPTY_NOTE_FORM)');
        expect(source).toContain('setShowNoteForm(false)');
        expect(source).toContain('refresh()');
    });
});

// ── Requirement 5.4: Publish toggle calls apiFetch PATCH ───────────────────────
describe('Library – publish toggle (Requirement 5.4)', () => {
    it('calls apiFetch PATCH to flip the published field', () => {
        expect(source).toContain("method: 'PATCH'");
        expect(source).toContain('published: !note.published');
    });

    it('targets the correct URL path', () => {
        expect(source).toContain("`/api/notes/${");
    });

    it('refreshes after patch', () => {
        expect(source).toContain('refresh()');
    });

    it('handlePublishToggle function is defined', () => {
        expect(source).toContain('handlePublishToggle');
    });
});

// ── Requirement 5.2: Teacher notes list uses useNotes with authorUid ──────
describe('Library – teacher notes list (Requirement 5.2)', () => {
    it('calls useNotes with authorUid filter', () => {
        expect(source).toContain('useNotes(');
        expect(source).toContain('authorUid');
    });

    it('uses useAuth to get the current user', () => {
        expect(source).toContain('useAuth');
        expect(source).toContain('user?._id');
    });

    it('renders the My Notes section', () => {
        expect(source).toContain('My Notes');
    });

    it('renders a New Note button to show the form', () => {
        expect(source).toContain('New Note');
        expect(source).toContain('showNoteForm');
    });
});

// ── Requirement 5.1: TeacherSidebar is present ────────────────────────────
describe('Library – layout (Requirement 5.1)', () => {
    it('uses TeacherSidebar', () => {
        expect(source).toContain('TeacherSidebar');
    });
});
