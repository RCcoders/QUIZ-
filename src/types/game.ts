// src/types/game.ts
// Shared game type definitions used across GameHost, PlayGame, and StudentQuiz.
// Previously these were copy-pasted in each file — now centralised here.

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    isActive?: boolean;
    timerEnabled: boolean;
    timerSeconds: number;
    showResults?: boolean;
    showLeaderboard?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Question {
    id: string;
    quizId?: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    difficulty?: 'easy' | 'medium' | 'hard';
    orderIndex?: number;
    createdAt?: string;
}

export interface GameSession {
    id: string;
    quizId: string;
    quizTitle?: string;
    teacherId?: string;
    gameCode?: string;
    status: 'waiting' | 'playing' | 'question' | 'results' | 'ended';
    currentQuestionIndex: number;
    questionStartedAt: string | null;
    createdAt?: string;
    endedAt?: string | null;
}

export interface GameParticipant {
    id: string;
    socketId?: string;
    sessionId?: string;
    name: string;
    email?: string;
    score: number;
    answersCount: number;
    joinedAt?: string;
    status: 'active' | 'left' | 'kicked';
    violationCount?: number;
    kickReason?: string | null;
}

export interface GameAnswer {
    id?: string;
    sessionId?: string;
    participantId: string;
    questionIndex: number;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
    pointsEarned: number;
    answeredAt?: string;
}
