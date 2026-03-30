import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { ScoreRecord } from '../types/student';

interface StudentStats {
    records: ScoreRecord[];
    streak: number;
    averageScore: number;
    totalCompleted: number;
    loading: boolean;
}

export function useStudentStats(uid: string | undefined): StudentStats {
    const [stats, setStats] = useState<{
        records: ScoreRecord[];
        streak: number;
        averageScore: number;
        totalCompleted: number;
    }>({
        records: [],
        streak: 0,
        averageScore: 0,
        totalCompleted: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const fetchStats = async () => {
            try {
                const data = await apiFetch(`/api/scores/${uid}/stats`);
                setStats({
                    records: data.records,
                    streak: data.streak,
                    averageScore: data.averageScore,
                    totalCompleted: data.totalCompleted
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [uid]);

    return {
        ...stats,
        loading,
    };
}
