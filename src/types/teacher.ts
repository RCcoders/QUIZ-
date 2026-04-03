export interface QuizWithCount {
    _id: string;
    title: string;
    isActive: boolean;
    questionCount?: number;
    subject?: string;
    attempts?: number;
    avgScore?: number;
    date?: string;
}

export interface DashboardStats {
    totalQuizzes: number;
    activeSessions: number;
    totalStudents: number;
    averageScore: number;
    averageTimeTakenMs: number;
    weeklyData: { day: string; pct: number }[];
}

export type DateRange = '7d' | '30d' | 'all';

export interface QuizSession {
    id: string;
    quizTitle: string;
    date: string; // ISO date string
    participantCount: number;
    averageScore: number; // 0–100
    completed: boolean;
}
