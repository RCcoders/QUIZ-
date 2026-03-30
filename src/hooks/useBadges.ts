import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
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

    const fetchBadges = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/badges');
        setBadges(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [uid]);

  return { badges, loading, error };
}
