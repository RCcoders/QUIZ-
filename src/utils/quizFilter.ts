export interface QuizItem {
    id: string;
    title: string;
    description: string;
    [key: string]: unknown;
}

/**
 * Filters a list of quizzes by title or description (case-insensitive).
 * An empty query returns the full list unchanged.
 */
export function filterQuizzes<T extends QuizItem>(quizzes: T[], query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(
        (quiz) =>
            quiz.title.toLowerCase().includes(q) ||
            quiz.description.toLowerCase().includes(q)
    );
}
