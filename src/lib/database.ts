import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==================== Type Definitions (camelCase for app compatibility) ====================

export interface Profile {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

export interface Quiz {
    id: string;
    teacherId: string;
    title: string;
    description: string | null;
    isActive: boolean;
    timerEnabled: boolean;
    timerSeconds: number;
    showResults: boolean;
    showLeaderboard: boolean;
    createdAt: string;
    updatedAt: string;
    questions?: Question[];
}

export interface Question {
    id: string;
    quizId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    difficulty: 'easy' | 'medium' | 'hard';
    orderIndex: number;
    createdAt: string;
}

export interface Response {
    id: string;
    quizId: string;
    studentName: string;
    studentEmail: string;
    score: number;
    totalQuestions: number;
    answers: Array<{
        questionId: string;
        answer: string;
        isCorrect: boolean;
        timeTakenMs: number;
    }>;
    startedAt: string;
    completedAt: string | null;
}

export interface GameSession {
    id: string;
    quizId: string;
    teacherId: string;
    gameCode: string;
    status: 'waiting' | 'playing' | 'question' | 'results' | 'ended';
    currentQuestionIndex: number;
    questionStartedAt: string | null;
    createdAt: string;
    endedAt: string | null;
}


export interface GameParticipant {
    id: string;
    sessionId: string;
    name: string;
    email: string;
    score: number;
    answersCount: number;
    joinedAt: string;
    status: 'active' | 'left' | 'kicked';
    violationCount?: number; // Track number of anti-cheat violations
    kickReason?: string | null; // Reason for kick (e.g., "Anti-cheat violations")
}


export interface GameAnswer {
    id: string;
    sessionId: string;
    participantId: string;
    questionIndex: number;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
    pointsEarned: number;
    answeredAt: string;
}

// ==================== Conversion Helpers ====================

// Convert snake_case DB row to camelCase Quiz
function toQuiz(row: Record<string, unknown>): Quiz {
    return {
        id: row.id as string,
        teacherId: row.teacher_id as string,
        title: row.title as string,
        description: row.description as string | null,
        isActive: row.is_active as boolean,
        timerEnabled: row.timer_enabled as boolean,
        timerSeconds: row.timer_seconds as number,
        showResults: row.show_results as boolean,
        showLeaderboard: row.show_leaderboard as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

// Convert camelCase Quiz to snake_case for DB
function fromQuiz(quiz: Partial<Omit<Quiz, 'id' | 'createdAt'>>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (quiz.teacherId !== undefined) result.teacher_id = quiz.teacherId;
    if (quiz.title !== undefined) result.title = quiz.title;
    if (quiz.description !== undefined) result.description = quiz.description;
    if (quiz.isActive !== undefined) result.is_active = quiz.isActive;
    if (quiz.timerEnabled !== undefined) result.timer_enabled = quiz.timerEnabled;
    if (quiz.timerSeconds !== undefined) result.timer_seconds = quiz.timerSeconds;
    if (quiz.showResults !== undefined) result.show_results = quiz.showResults;
    if (quiz.showLeaderboard !== undefined) result.show_leaderboard = quiz.showLeaderboard;
    return result;
}

function toQuestion(row: Record<string, unknown>): Question {
    return {
        id: row.id as string,
        quizId: row.quiz_id as string,
        questionText: row.question_text as string,
        optionA: row.option_a as string,
        optionB: row.option_b as string,
        optionC: row.option_c as string,
        optionD: row.option_d as string,
        correctAnswer: row.correct_answer as 'A' | 'B' | 'C' | 'D',
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
        orderIndex: row.order_index as number,
        createdAt: row.created_at as string,
    };
}

function toResponse(row: Record<string, unknown>): Response {
    return {
        id: row.id as string,
        quizId: row.quiz_id as string,
        studentName: row.student_name as string,
        studentEmail: row.student_email as string,
        score: row.score as number,
        totalQuestions: row.total_questions as number,
        answers: row.answers as Response['answers'],
        startedAt: row.started_at as string,
        completedAt: row.completed_at as string | null,
    };
}

function toGameSession(row: Record<string, unknown>): GameSession {
    return {
        id: row.id as string,
        quizId: row.quiz_id as string,
        teacherId: row.teacher_id as string,
        gameCode: row.game_code as string,
        status: row.status as GameSession['status'],
        currentQuestionIndex: row.current_question_index as number,
        questionStartedAt: row.question_started_at as string | null,
        createdAt: row.created_at as string,
        endedAt: row.ended_at as string | null,
    };
}

function toGameParticipant(row: Record<string, unknown>): GameParticipant {
    return {
        id: row.id as string,
        sessionId: row.session_id as string,
        name: row.name as string,
        email: row.email as string,
        score: row.score as number,
        answersCount: row.answers_count as number,
        joinedAt: row.joined_at as string,
        status: (row.status as 'active' | 'left' | 'kicked') || 'active',
        violationCount: row.violation_count as number | undefined,
        kickReason: row.kick_reason as string | null | undefined,
    };
}

function toGameAnswer(row: Record<string, unknown>): GameAnswer {
    return {
        id: row.id as string,
        sessionId: row.session_id as string,
        participantId: row.participant_id as string,
        questionIndex: row.question_index as number,
        answer: row.answer as 'A' | 'B' | 'C' | 'D',
        isCorrect: row.is_correct as boolean,
        timeTakenMs: row.time_taken_ms as number,
        pointsEarned: row.points_earned as number,
        answeredAt: row.answered_at as string,
    };
}

// ==================== Profile Operations ====================

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching profile:', error);
        return null;
    }
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        createdAt: data.created_at,
    };
}

export async function createProfile(userId: string, email: string, name: string | null = null): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email,
            name,
            created_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
}

// ==================== Quiz Operations ====================

export async function getQuizzesByTeacher(teacherId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching quizzes:', error);
        return [];
    }
    return (data || []).map(toQuiz);
}

export async function getActiveQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching active quizzes:', error);
        return [];
    }
    return (data || []).map(toQuiz);
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error) {
        console.error('Error fetching quiz:', error);
        return null;
    }
    return toQuiz(data);
}

export async function createQuiz(data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const dbData = {
        ...fromQuiz(data),
        created_at: now,
        updated_at: now,
    };

    const { data: result, error } = await supabase
        .from('quizzes')
        .insert(dbData)
        .select('id')
        .single();

    if (error) {
        console.error('Error creating quiz:', error);
        throw error;
    }
    return result.id;
}

export async function updateQuiz(quizId: string, data: Partial<Omit<Quiz, 'id' | 'createdAt'>>): Promise<void> {
    const dbData = {
        ...fromQuiz(data),
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('quizzes')
        .update(dbData)
        .eq('id', quizId);

    if (error) {
        console.error('Error updating quiz:', error);
        throw error;
    }
}

export async function deleteQuiz(quizId: string): Promise<void> {
    // Delete questions first
    const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

    if (questionsError) {
        console.error('Error deleting questions:', questionsError);
    }

    // Delete quiz
    const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

    if (error) {
        console.error('Error deleting quiz:', error);
        throw error;
    }
}

// ==================== Question Operations ====================

export async function getQuestions(quizId: string): Promise<Question[]> {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
    return (data || []).map(toQuestion);
}

export async function saveQuestions(quizId: string, questions: Omit<Question, 'id' | 'quizId' | 'createdAt'>[]): Promise<void> {
    // Delete existing questions
    const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

    if (deleteError) {
        console.error('Error deleting existing questions:', deleteError);
    }

    // Add new questions
    if (questions.length > 0) {
        const now = new Date().toISOString();
        const questionsToInsert = questions.map((q, index) => ({
            quiz_id: quizId,
            question_text: q.questionText,
            option_a: q.optionA,
            option_b: q.optionB,
            option_c: q.optionC,
            option_d: q.optionD,
            correct_answer: q.correctAnswer,
            difficulty: q.difficulty,
            order_index: index,
            created_at: now,
        }));

        const { error: insertError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

        if (insertError) {
            console.error('Error inserting questions:', insertError);
            throw insertError;
        }
    }
}

// ==================== Response Operations ====================

export async function getResponsesByQuiz(quizId: string): Promise<Response[]> {
    const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Error fetching responses:', error);
        return [];
    }
    return (data || []).map(toResponse);
}

export async function checkExistingResponse(quizId: string, email: string): Promise<Response | null> {
    const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('student_email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error checking existing response:', error);
        return null;
    }
    return toResponse(data);
}

export async function createResponse(data: Omit<Response, 'id'>): Promise<string> {
    const dbData = {
        quiz_id: data.quizId,
        student_name: data.studentName,
        student_email: data.studentEmail,
        score: data.score,
        total_questions: data.totalQuestions,
        answers: data.answers,
        started_at: data.startedAt,
        completed_at: data.completedAt,
    };

    const { data: result, error } = await supabase
        .from('responses')
        .insert(dbData)
        .select('id')
        .single();

    if (error) {
        console.error('Error creating response:', error);
        throw error;
    }
    return result.id;
}

export async function updateResponse(responseId: string, data: Partial<Response>): Promise<void> {
    const dbData: Record<string, unknown> = {};
    if (data.score !== undefined) dbData.score = data.score;
    if (data.answers !== undefined) dbData.answers = data.answers;
    if (data.completedAt !== undefined) dbData.completed_at = data.completedAt;

    const { error } = await supabase
        .from('responses')
        .update(dbData)
        .eq('id', responseId);

    if (error) {
        console.error('Error updating response:', error);
        throw error;
    }
}

// ==================== Game Session Operations ====================

export async function getGameSessionByCode(gameCode: string): Promise<GameSession | null> {
    const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching game session:', error);
        return null;
    }
    return toGameSession(data);
}

export async function getGameSession(sessionId: string): Promise<GameSession | null> {
    const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error) {
        console.error('Error fetching game session:', error);
        return null;
    }
    return toGameSession(data);
}

export async function getGameSessionsByQuiz(quizId: string): Promise<GameSession[]> {
    const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching game sessions:', error);
        return [];
    }
    return (data || []).map(toGameSession);
}

export async function createGameSession(data: Omit<GameSession, 'id' | 'createdAt' | 'endedAt'>): Promise<string> {
    const dbData = {
        quiz_id: data.quizId,
        teacher_id: data.teacherId,
        game_code: data.gameCode,
        status: data.status,
        current_question_index: data.currentQuestionIndex,
        question_started_at: data.questionStartedAt,
        created_at: new Date().toISOString(),
        ended_at: null,
    };

    const { data: result, error } = await supabase
        .from('game_sessions')
        .insert(dbData)
        .select('id')
        .single();

    if (error) {
        console.error('Error creating game session:', error);
        throw error;
    }
    return result.id;
}

export async function updateGameSession(sessionId: string, data: Partial<GameSession>): Promise<void> {
    const dbData: Record<string, unknown> = {};
    if (data.status !== undefined) dbData.status = data.status;
    if (data.currentQuestionIndex !== undefined) dbData.current_question_index = data.currentQuestionIndex;
    if (data.questionStartedAt !== undefined) dbData.question_started_at = data.questionStartedAt;
    if (data.endedAt !== undefined) dbData.ended_at = data.endedAt;

    const { error } = await supabase
        .from('game_sessions')
        .update(dbData)
        .eq('id', sessionId);

    if (error) {
        console.error('Error updating game session:', error);
        throw error;
    }
}

export async function deleteGameSession(sessionId: string): Promise<void> {
    const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('Error deleting game session:', error);
        throw error;
    }
}

// ==================== Game Participant Operations ====================

export async function getParticipants(sessionId: string): Promise<GameParticipant[]> {
    const { data, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error fetching participants:', error);
        return [];
    }
    return (data || []).map(toGameParticipant);
}

export async function getParticipantByEmail(sessionId: string, email: string): Promise<GameParticipant | null> {
    const { data, error } = await supabase
        .from('game_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching participant:', error);
        return null;
    }
    return toGameParticipant(data);
}

export async function addParticipant(sessionId: string, data: Omit<GameParticipant, 'id' | 'sessionId' | 'joinedAt' | 'status'>): Promise<string> {
    const dbData = {
        session_id: sessionId,
        name: data.name,
        email: data.email,
        score: data.score,
        answers_count: data.answersCount,
        joined_at: new Date().toISOString(),
        status: 'active', // Ensure participants start as active
    };

    const { data: result, error } = await supabase
        .from('game_participants')
        .insert(dbData)
        .select('id')
        .single();

    if (error) {
        console.error('Error adding participant:', error);
        throw error;
    }
    return result.id;
}

export async function updateParticipant(sessionId: string, participantId: string, data: Partial<GameParticipant>): Promise<void> {
    const dbData: Record<string, unknown> = {};
    if (data.score !== undefined) dbData.score = data.score;
    if (data.answersCount !== undefined) dbData.answers_count = data.answersCount;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.violationCount !== undefined) dbData.violation_count = data.violationCount;
    if (data.kickReason !== undefined) dbData.kick_reason = data.kickReason;

    const { error } = await supabase
        .from('game_participants')
        .update(dbData)
        .eq('id', participantId)
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error updating participant:', error);
        throw error;
    }
}

/**
 * Atomically increment participant score to prevent race conditions.
 * Uses database-level increment to ensure consistency.
 * @param sessionId - Game session ID
 * @param participantId - Participant ID
 * @param pointsDelta - Points to add (can be decimal)
 * @param incrementAnswerCount - Whether to also increment answers_count
 */
export async function incrementParticipantScore(
    sessionId: string,
    participantId: string,
    pointsDelta: number,
    incrementAnswerCount: boolean = true
): Promise<void> {
    // First, get current values
    const { data: current, error: fetchError } = await supabase
        .from('game_participants')
        .select('score, answers_count')
        .eq('id', participantId)
        .eq('session_id', sessionId)
        .single();

    if (fetchError) {
        console.error('Error fetching participant for increment:', fetchError);
        throw fetchError;
    }

    // Calculate new values with proper decimal handling
    const newScore = parseFloat((current.score + pointsDelta).toFixed(1));
    const newAnswerCount = incrementAnswerCount ? current.answers_count + 1 : current.answers_count;

    // Update with new calculated values
    const { error: updateError } = await supabase
        .from('game_participants')
        .update({
            score: newScore,
            answers_count: newAnswerCount,
        })
        .eq('id', participantId)
        .eq('session_id', sessionId);

    if (updateError) {
        console.error('Error incrementing participant score:', updateError);
        throw updateError;
    }
}


// ==================== Game Answer Operations ====================

export async function getGameAnswers(sessionId: string): Promise<GameAnswer[]> {
    const { data, error } = await supabase
        .from('game_answers')
        .select('*')
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error fetching game answers:', error);
        return [];
    }
    return (data || []).map(toGameAnswer);
}

export async function getParticipantAnswer(sessionId: string, participantId: string, questionIndex: number): Promise<GameAnswer | null> {
    const { data, error } = await supabase
        .from('game_answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId)
        .eq('question_index', questionIndex)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching participant answer:', error);
        return null;
    }
    return toGameAnswer(data);
}

export async function addGameAnswer(sessionId: string, data: Omit<GameAnswer, 'id' | 'sessionId' | 'answeredAt'>): Promise<string> {
    const dbData = {
        session_id: sessionId,
        participant_id: data.participantId,
        question_index: data.questionIndex,
        answer: data.answer,
        is_correct: data.isCorrect,
        time_taken_ms: data.timeTakenMs,
        points_earned: data.pointsEarned,
        answered_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
        .from('game_answers')
        .insert(dbData)
        .select('id')
        .single();

    if (error) {
        console.error('Error adding game answer:', error);
        throw error;
    }
    return result.id;
}

// ==================== Realtime Subscriptions ====================

export function subscribeToGameSession(sessionId: string, callback: (session: GameSession | null) => void): () => void {
    const channel = supabase
        .channel(`game_session_${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_sessions',
                filter: `id=eq.${sessionId}`,
            },
            async (payload) => {
                if (payload.eventType === 'DELETE') {
                    callback(null);
                } else {
                    callback(toGameSession(payload.new as Record<string, unknown>));
                }
            }
        )
        .subscribe();

    // Fetch initial data
    getGameSession(sessionId).then(callback);

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

export function subscribeToParticipants(sessionId: string, callback: (participants: GameParticipant[]) => void): () => void {
    let currentParticipants: GameParticipant[] = [];
    let updateTimeout: ReturnType<typeof setTimeout> | null = null;
    let isInitialFetchDone = false;

    // Throttled notification to prevent UI thrashing
    const notify = () => {
        if (updateTimeout) return;
        updateTimeout = setTimeout(() => {
            callback([...currentParticipants]);
            updateTimeout = null;
        }, 500); // Update UI at most every 500ms
    };

    const channel = supabase
        .channel(`participants_${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_participants',
                filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
                if (!isInitialFetchDone) return; // Ignore events until initial fetch is ready

                if (payload.eventType === 'INSERT') {
                    const newParticipant = toGameParticipant(payload.new as Record<string, unknown>);
                    // Avoid duplicates
                    if (!currentParticipants.some(p => p.id === newParticipant.id)) {
                        currentParticipants.push(newParticipant);
                        notify();
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedParticipant = toGameParticipant(payload.new as Record<string, unknown>);
                    const index = currentParticipants.findIndex(p => p.id === updatedParticipant.id);
                    if (index !== -1) {
                        currentParticipants[index] = updatedParticipant;
                        notify();
                    }
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    currentParticipants = currentParticipants.filter(p => p.id !== deletedId);
                    notify();
                }
            }
        )
        .subscribe();

    // Fetch initial data
    getParticipants(sessionId).then(participants => {
        currentParticipants = participants;
        isInitialFetchDone = true;
        callback(currentParticipants);
    });

    // Return unsubscribe function
    return () => {
        if (updateTimeout) clearTimeout(updateTimeout);
        supabase.removeChannel(channel);
    };
}

export function subscribeToGameAnswers(sessionId: string, callback: (answers: GameAnswer[]) => void): () => void {
    let currentAnswers: GameAnswer[] = [];
    let updateTimeout: ReturnType<typeof setTimeout> | null = null;
    let isInitialFetchDone = false;

    const notify = () => {
        if (updateTimeout) return;
        updateTimeout = setTimeout(() => {
            callback([...currentAnswers]);
            updateTimeout = null;
        }, 500);
    };

    const channel = supabase
        .channel(`game_answers_${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_answers',
                filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
                if (!isInitialFetchDone) return;

                if (payload.eventType === 'INSERT') {
                    const newAnswer = toGameAnswer(payload.new as Record<string, unknown>);
                    if (!currentAnswers.some(a => a.id === newAnswer.id)) {
                        currentAnswers.push(newAnswer);
                        notify();
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedAnswer = toGameAnswer(payload.new as Record<string, unknown>);
                    const index = currentAnswers.findIndex(a => a.id === updatedAnswer.id);
                    if (index !== -1) {
                        currentAnswers[index] = updatedAnswer;
                        notify();
                    }
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    currentAnswers = currentAnswers.filter(a => a.id !== deletedId);
                    notify();
                }
            }
        )
        .subscribe();

    // Fetch initial data
    getGameAnswers(sessionId).then(answers => {
        currentAnswers = answers;
        isInitialFetchDone = true;
        callback(currentAnswers);
    });

    // Return unsubscribe function
    return () => {
        if (updateTimeout) clearTimeout(updateTimeout);
        supabase.removeChannel(channel);
    };
}
