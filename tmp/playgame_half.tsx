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
            case 'fullscreen_exit':
                return 'Exiting fullscreen mode is not allowed';
            case 'copy_attempt':
                return 'Copying quiz content is not allowed';
            case 'devtools_open':
                return 'Opening developer tools is not allowed';
            default:
                return 'Violation detected';
        }
    };

    // Helper to manage local question start time
    const getOrSetLocalStartTime = (sId: string, qIndex: number) => {
        const key = `q_start_${sId}_${qIndex}`;
        const stored = localStorage.getItem(key);
        if (stored) return parseInt(stored);

        const now = Date.now();
        localStorage.setItem(key, now.toString());
        return now;
    };

    useEffect(() => {
        if (!participantId) {
            navigate('/join');
            return;
        }
        // Initialize with a mock waiting session
        setSession({
            id: sessionId || 'local',
            quizId: 'local',
            status: 'waiting',
            currentQuestionIndex: 0,
            questionStartedAt: null,
        });
        setAllParticipants([{ id: participantId, name: playerName, score: 0, answersCount: 0, status: 'active' }]);
        setParticipant({ id: participantId, name: playerName, score: 0, answersCount: 0, status: 'active' });
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, participantId]);

    // Custom Anti-Cheat Logic (Tab Switching)
    // Custom Anti-Cheat Logic (Tab Switching)
    const tabSwitchesRef = React.useRef(0);
    const hasInitializedRef = React.useRef(false);

    useEffect(() => {
        // Initialize from DB if available
        if (participant?.violationCount && !hasInitializedRef.current) {
            tabSwitchesRef.current = participant.violationCount;
            setViolationCount(participant.violationCount);
            hasInitializedRef.current = true;
        }

        // Check if kicked by teacher
        if (participant?.status === 'kicked') {
            setIsKicked(true);
            // If we haven't set the violation count yet (e.g. manual kick), ensure we don't overwrite it with 0
            if (participant.violationCount) {
                setViolationCount(participant.violationCount);
            }
        }
    }, [participant]);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                tabSwitchesRef.current += 1;
                const currentViolations = tabSwitchesRef.current;
                setViolationCount(currentViolations);

                if (currentViolations >= 3) {
                    setIsKicked(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [session?.id, participantId, isKicked]);

    // Handle leaving the game (unmount)
    // DISABLED: Keep participants as "active" even if they refresh or navigate away
    // This prevents false positives where students are marked as "left" during connection issues






    const submitAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
        if (!session || !questions.length || hasAnswered || !participantId) return;
        if (isKicked || participant?.status === 'kicked') {
            alert('You have been kicked from the game and cannot answer.');
            return;
        }

        const currentQuestion = questions[session.currentQuestionIndex];
        const timeTaken = Math.max(0, Date.now() - questionStartTime);

        const correct = answer === currentQuestion.correctAnswer;
        const scoreResult = calculateScore(correct, timeTaken, {
            basePoints: SCORING_CONFIG.BASE_POINTS,
            maxBonus: SCORING_CONFIG.MAX_SPEED_BONUS,
            timerEnabled,
            timerSeconds,
        });

        setSelectedAnswer(answer);
        setHasAnswered(true);
        setIsCorrect(correct);
        setPointsEarned(scoreResult.points);

        if (correct) {
            setCurrentStreak(prev => prev + 1);
        } else {
            setCurrentStreak(0);
        }

        setMyAnswers(prev => [...prev, { questionIndex: session.currentQuestionIndex, answer, isCorrect: correct }]);

        // Update local participant score
        setParticipant(prev => prev ? { ...prev, score: prev.score + scoreResult.points, answersCount: prev.answersCount + 1 } : prev);
        setAllParticipants(prev => prev.map(p =>
            p.id === participantId ? { ...p, score: p.score + scoreResult.points, answersCount: p.answersCount + 1 } : p
        ));
    };

    const currentPosition = allParticipants.findIndex(p => p.id === participantId) + 1;
    const currentQuestion = session ? questions[session.currentQuestionIndex] : null;

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="card text-center">
                    <h2>Game not found</h2>
                    <button onClick={() => navigate('/join')} className="btn btn-primary mt-lg">
                        Join Another Game
                    </button>
                </div>
            </div>
        );
    }

    if (isKicked) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="card text-center" style={{ maxWidth: '500px' }}>
                    <XCircle size={64} style={{ color: 'var(--accent-error)', margin: '0 auto 1rem' }} />
                    <h2>You've Been Kicked</h2>
                    <p>You were removed from the game for switching tabs/windows multiple times.</p>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                        Total Violations: {violationCount}
                    </p>
                    <button onClick={() => navigate('/join')} className="btn btn-primary mt-lg">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            {/* Violation Warning */}
            {violationCount > 0 && violationCount < 3 && (
                <div className="fixed top-6 right-6 z-[1000] bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 animate-bounce">
                    <XCircle size={20} />
                    <span>Warning: {violationCount}/3 violations. Don't switch tabs!</span>
                </div>
            )}

            <AnimatePresence mode="wait">
                    {/* Waiting for game to start — redesigned lobby */}
                    {session.status === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', minHeight: '100vh' }}
                        >
                            {/* 9.1 Left Sidebar */}
                            <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
                                {/* Logo */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 24px' }}>
                                    <div style={{ width: 32, height: 32, background: '#FF5C1A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Play size={16} color="#fff" fill="#fff" />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>QuizMaster</span>
                                </div>

                                {/* Nav items */}
                                <nav style={{ flex: 1, padding: '0 12px' }}>
                                    {[
                                        { icon: <Home size={18} />, label: 'Lobby', active: true },
                                        { icon: <Trophy size={18} />, label: 'Leaderboard', active: false },
                                        { icon: <HelpCircle size={18} />, label: 'Support', active: false },
                                    ].map(({ icon, label, active }) => (
                                        <div
                                            key={label}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
