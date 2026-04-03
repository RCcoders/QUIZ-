import { QuizSession } from '../types/teacher';

export type DateRange = '7d' | '30d' | 'all';

export function filterSessionsByDate(sessions: QuizSession[], range: DateRange): QuizSession[] {
    if (range === 'all') return sessions;
    const now = Date.now();
    const ms = range === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return sessions.filter(s => now - new Date(s.date).getTime() <= ms);
}
