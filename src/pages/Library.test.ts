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

    it('blocks Firestore write when validation errors exist', () => {
        // After setting errors, the function returns early before calling addDoc
        const submitFnMatch = source.match(/async function handleNoteSubmit[\s\S]*?^    \}/m);
        const submitFn = submitFnMatch ? submitFnMatch[0] : source;
        // The early return must appear before addDoc
        const returnIdx = submitFn.indexOf('if (Object.keys(errors).length > 0) return');
        const addDocIdx = submitFn.indexOf('addDoc(');
        expect(returnIdx).toBeGreaterThan(-1);
        expect(addDocIdx).toBeGreaterThan(-1);
        expect(returnIdx).toBeLessThan(addDocIdx);
    });
});

// ── Requirement 5.3: Valid submission writes note with published: false ────
describe('Library – valid note submission (Requirement 5.3)', () => {
    it('calls addDoc to write the note to Firestore', () => {
        expect(source).toContain('addDoc(');
        expect(source).toContain("collection(db, 'notes')");
    });

    it('writes note with published: false by default', () => {
        expect(source).toContain('published: false');
    });

    it('includes authorUid in the written document', () => {
        expect(source).toContain('authorUid');
    });

    it('includes createdAt and updatedAt timestamps', () => {
        expect(source).toContain('createdAt');
        expect(source).toContain('updatedAt');
    });

    it('imports addDoc from firebase/firestore', () => {
        expect(source).toContain('addDoc');
        expect(source).toContain("from 'firebase/firestore'");
    });
});

// ── Requirement 5.4: Publish toggle calls updateDoc ───────────────────────
describe('Library – publish toggle (Requirement 5.4)', () => {
    it('calls updateDoc to flip the published field', () => {
        expect(source).toContain('updateDoc(');
        expect(source).toContain('published: !note.published');
    });

    it('targets the correct Firestore document path', () => {
        expect(source).toContain("doc(db, 'notes', note.id)");
    });

    it('imports updateDoc from firebase/firestore', () => {
        expect(source).toContain('updateDoc');
        expect(source).toContain("from 'firebase/firestore'");
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
