import { useEffect, useState } from 'react';
import { getScoreRecords, computeStreak, computeAverageScore } from '../utils/scoring';
import type { ScoreRecord } from '../types/student';

interface StudentStats {
    records: ScoreRecord[];
    streak: number;
    averageScore: number;
    totalCompleted: number;
    loading: boolean;
}

export function useStudentStats(uid: string | undefined): StudentStats {
    const [records, setRecords] = useState<ScoreRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);

        // Timeout fallback — don't hang forever if Firestore is slow/unreachable
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        getScoreRecords(uid)
            .then(setRecords)
            .catch(() => setRecords([]))
            .finally(() => {
                clearTimeout(timeout);
                setLoading(false);
            });

        return () => clearTimeout(timeout);
    }, [uid]);

    return {
        records,
        streak: computeStreak(records),
        averageScore: computeAverageScore(records),
        totalCompleted: records.length,
        loading,
    };
}
