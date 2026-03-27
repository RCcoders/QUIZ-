import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BadgeRecord } from '../types/student';

interface UseBadgesResult {
  badges: BadgeRecord[];
  loading: boolean;
  error: Error | null;
}

export function useBadges(uid: string | undefined | null): UseBadgesResult {
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setBadges([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const badgesRef = collection(db, 'users', uid, 'badges');
    const unsubscribe = onSnapshot(
      badgesRef,
      (snapshot) => {
        const records: BadgeRecord[] = snapshot.docs.map((doc) => doc.data() as BadgeRecord);
        setBadges(records);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { badges, loading, error };
}
