import { describe, it, expect } from 'vitest';
import { filterNotes } from './noteFilter';
import type { Note } from '../types/student';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────
const makeNote = (overrides: Partial<Note> & Pick<Note, 'id' | 'title' | 'subject'>): Note => ({
  content: '',
  authorUid: 'user1',
  linkedQuizId: null,
  published: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const notes: Note[] = [
  makeNote({ id: '1', title: 'Introduction to Algebra', subject: 'Math' }),
  makeNote({ id: '2', title: 'Photosynthesis Explained', subject: 'Biology' }),
  makeNote({ id: '3', title: 'World War II Overview', subject: 'History' }),
  makeNote({ id: '4', title: 'Advanced Algebra Techniques', subject: 'Math' }),
  makeNote({ id: '5', title: 'Cell Division', subject: 'Biology' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests – Requirements 3.3, 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('filterNotes – unit tests', () => {
  // Empty query + "all" subject returns all notes
  it('empty query and subject "all" returns all notes', () => {
    const result = filterNotes(notes, '', 'all');
    expect(result).toHaveLength(notes.length);
    expect(result.map((n) => n.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  // Subject filter excludes non-matching notes
  it('subject filter returns only notes matching that subject', () => {
    const result = filterNotes(notes, '', 'Math');
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['1', '4']);
  });

  it('subject filter excludes all notes when no match', () => {
    const result = filterNotes(notes, '', 'Chemistry');
    expect(result).toHaveLength(0);
  });

  // Case-insensitive search on title
  it('query matches title case-insensitively', () => {
    const result = filterNotes(notes, 'ALGEBRA', 'all');
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['1', '4']);
  });

  it('query matches title with mixed case', () => {
    const result = filterNotes(notes, 'aLgEbRa', 'all');
    expect(result).toHaveLength(2);
  });

  // Case-insensitive search on subject
  it('query matches subject case-insensitively', () => {
    const result = filterNotes(notes, 'biology', 'all');
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['2', '5']);
  });

  // Combined filter + search
  it('subject filter and query combined narrow results', () => {
    const result = filterNotes(notes, 'advanced', 'Math');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('combined filter returns empty when query matches but subject does not', () => {
    const result = filterNotes(notes, 'algebra', 'Biology');
    expect(result).toHaveLength(0);
  });

  it('combined filter returns empty when subject matches but query does not', () => {
    const result = filterNotes(notes, 'photon', 'Math');
    expect(result).toHaveLength(0);
  });

  // Query with whitespace is trimmed
  it('query with surrounding whitespace is trimmed before matching', () => {
    const result = filterNotes(notes, '  algebra  ', 'all');
    expect(result).toHaveLength(2);
  });
});
