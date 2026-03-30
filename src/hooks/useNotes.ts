import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { Note } from '../types/student';

interface UseNotesOptions {
  authorUid?: string;
}

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useNotes(options?: UseNotesOptions): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = options?.authorUid
        ? `/api/notes?authorUid=${options.authorUid}`
        : '/api/notes';
      const data = await apiFetch(url);
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [options?.authorUid]);

  return { notes, loading, error, refresh: fetchNotes };
}
