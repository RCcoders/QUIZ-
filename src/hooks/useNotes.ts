import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Note } from '../types/student';

interface UseNotesOptions {
  authorUid?: string;
}

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: Error | null;
}

export function useNotes(options?: UseNotesOptions): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const notesRef = collection(db, 'notes');
    const q = options?.authorUid
      ? query(notesRef, where('authorUid', '==', options.authorUid))
      : query(notesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records: Note[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(records);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options?.authorUid]);

  return { notes, loading, error };
}
