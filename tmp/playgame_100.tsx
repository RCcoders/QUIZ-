import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, Home, HelpCircle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAntiCheat, type ViolationType } from '../hooks/useAntiCheat';
import { calculateScore } from '../utils/scoring';
import { ANTI_CHEAT_CONFIG, SCORING_CONFIG } from '../config/performance';

// Local type definitions (previously from database.ts)
interface GameSession {
    id: string;
    quizId: string;
    quizTitle?: string;
    status: 'waiting' | 'playing' | 'question' | 'results' | 'ended';
    currentQuestionIndex: number;
    questionStartedAt: string | null;
}

interface Question {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
}

interface GameParticipant {
    id: string;
    name: string;
    score: number;
    answersCount: number;
    status: 'active' | 'left' | 'kicked';
    violationCount?: number;
}

export function PlayGame() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const participantId = (location.state as { participantId?: string })?.participantId;
    const playerName = (location.state as { name?: string })?.name || 'Player';

    const [session, setSession] = useState<GameSession | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [participant, setParticipant] = useState<GameParticipant | null>(null);
    const [allParticipants, setAllParticipants] = useState<GameParticipant[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [myAnswers, setMyAnswers] = useState<Array<{
        questionIndex: number;
        answer: string;
        isCorrect: boolean;
    }>>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentStreak, setCurrentStreak] = useState(0);
    const [violationCount, setViolationCount] = useState(0);
    const [isKicked, setIsKicked] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(30);

    const [loading, setLoading] = useState(true);
    const [previousQuestionIndex, setPreviousQuestionIndex] = useState(-1);

    // Anti-Cheat Hook
    const antiCheat = useAntiCheat({
        enableFullscreen: ANTI_CHEAT_CONFIG.AUTO_FULLSCREEN,
        enableCopyProtection: ANTI_CHEAT_CONFIG.ENABLE_COPY_PROTECTION,
        enableTabSwitchDetection: false, // Using custom logic below
        maxViolations: ANTI_CHEAT_CONFIG.MAX_VIOLATIONS,
        onViolation: (type, count) => {
            const remaining = ANTI_CHEAT_CONFIG.MAX_VIOLATIONS - count;
            if (remaining > 0) {
                alert(`⚠️ Warning ${count}/${ANTI_CHEAT_CONFIG.MAX_VIOLATIONS}: ${getViolationMessage(type)}\n\n${remaining} warnings remaining before you are removed from the quiz.`);
            }
        },
        onMaxViolationsReached: () => {
            alert('You have been removed from the quiz due to multiple violations.');
            if (session?.id && participantId) {
                localStorage.setItem(`banned_session_${session.id}`, 'true');
            }
            navigate('/join');
        },
    });

    // Helper function for violation messages
    const getViolationMessage = (type: ViolationType): string => {
        switch (type) {
            case 'tab_switch':
                return 'Tab switching is not allowed during the quiz';
