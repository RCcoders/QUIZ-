import type { Note } from '../types/student';

/**
 * Filters a list of notes by subject and/or query string.
 * - subject: exact match filter; skipped when 'all'
 * - query: case-insensitive substring match on title and subject; skipped when empty
 * Both filters are applied with AND logic.
 */
export function filterNotes(notes: Note[], query: string, subject: string): Note[] {
  const q = query.trim().toLowerCase();

  return notes.filter((note) => {
    if (subject !== 'all' && note.subject !== subject) return false;
    if (q && !note.title.toLowerCase().includes(q) && !note.subject.toLowerCase().includes(q)) return false;
    return true;
  });
}
