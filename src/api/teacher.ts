import { apiFetch } from '../utils/api';
import { QuizWithCount, DashboardStats, QuizSession } from '../types/teacher';

export async function fetchQuizzesForTeacher(): Promise<QuizWithCount[]> {
    return apiFetch('/api/quizzes/teacher/my-quizzes');
}

export const fetchMyQuizzes = fetchQuizzesForTeacher;

export async function fetchDashboardStats(): Promise<DashboardStats> {
    return apiFetch('/api/teacher/dashboard-stats');
}

export async function fetchReports(): Promise<QuizSession[]> {
    return apiFetch('/api/reports');
}
