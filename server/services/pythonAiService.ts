/**
 * pythonAiService.ts
 *
 * Proxy layer between the Node.js server and the Python FastAPI (api.py).
 * Handles all three modes from question_generator.py:
 *   - QUIZ_GENERATOR  → used by teachers in QuizEditor
 *   - NOTES_GENERATOR → used by students in NoteDetail
 *   - ADAPTIVE_QUIZ   → used by students in AdaptiveQuiz
 */

import dotenv from 'dotenv';
dotenv.config();

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

async function callPython<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${PYTHON_API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Python AI service error (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
}

// ── Teacher: role-specific quiz generator ────────────────────────────────────

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateQuizFromTopic(
    topic: string,
    numQuestions: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<QuizQuestion[]> {
    return callPython<QuizQuestion[]>('/api/quiz', {
        topic,
        num_questions: numQuestions,
        difficulty,
    });
}

// ── Student: notes generator ─────────────────────────────────────────────────

export async function generateNotesForTopic(topic: string): Promise<string> {
    const data = await callPython<{ notes: string }>('/api/notes', { topic });
    return data.notes;
}

// ── Student: adaptive quiz ────────────────────────────────────────────────────

export interface AdaptiveQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateAdaptiveQuizFromWeakTopics(
    weakTopics: string[],
    numQuestions: number = 5
): Promise<AdaptiveQuestion[]> {
    return callPython<AdaptiveQuestion[]>('/api/adaptive', {
        weak_topics: weakTopics,
        num_questions: numQuestions,
    });
}
