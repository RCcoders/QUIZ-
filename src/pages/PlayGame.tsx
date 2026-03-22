import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, Home, HelpCircle, Play } from 'lucide-react';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [questions, setQuestions] = useState<Question[]>([]);
    const [participant, setParticipant] = useState<GameParticipant | null>(null);
    const [allParticipants, setAllParticipants] = useState<GameParticipant[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [timeLeft, setTimeLeft] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [timerEnabled, setTimerEnabled] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [timerSeconds, setTimerSeconds] = useState(30);

    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [previousQuestionIndex, setPreviousQuestionIndex] = useState(-1);

    // Anti-Cheat Hook
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const antiCheat = useAntiCheat({
        enableFullscreen: ANTI_CHEAT_CONFIG.AUTO_FULLSCREEN,
        enableCopyProtection: ANTI_CHEAT_CONFIG.ENABLE_COPY_PROTECTION,
        enableTabSwitchDetection: false, // Using custom logic below
        maxViolations: ANTI_CHEAT_CONFIG.MAX_VIOLATIONS,
        onViolation: (type, count) => {
            const remaining = ANTI_CHEAT_CONFIG.MAX_VIOLATIONS - count;
            if (remaining > 0) {
                alert(`WARNING Warning ${count}/${ANTI_CHEAT_CONFIG.MAX_VIOLATIONS}: ${getViolationMessage(type)}\n\n${remaining} warnings remaining before you are removed from the quiz.`);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const tabSwitchesRef = useRef(0);
    const hasInitializedRef = useRef(false);

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
        const handleVisibilityChange = () => {
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
                    {/* Waiting for game to start - redesigned lobby */}
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
                                                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                                                cursor: 'pointer',
                                                background: active ? '#FFF3EE' : 'transparent',
                                                color: active ? '#FF5C1A' : '#6B7280',
                                                borderLeft: active ? '3px solid #FF5C1A' : '3px solid transparent',
                                                fontWeight: 600, fontSize: 14,
                                            }}
                                        >
                                            {icon}
                                            <span>{label}</span>
                                        </div>
                                    ))}
                                </nav>

                                {/* Quiz Tip card */}
                                <div style={{ margin: '0 12px', background: '#FFF3EE', borderRadius: 10, padding: '14px 12px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#FF5C1A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quiz Tip</div>
                                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                                        Read each question carefully before selecting your answer. Speed and accuracy both count!
                                    </p>
                                </div>
                            </aside>

                            {/* Main area */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                                {/* 9.2 Top area */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{playerName}</span>
                                        <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</span>
                                    </div>
                                    <button
                                        onClick={() => navigate('/join')}
                                        style={{ background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}
                                    >
                                        Leave Lobby
                                    </button>
                                </div>

                                {/* 9.2 Orange banner */}
                                <div style={{ background: '#FF5C1A', color: '#fff', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Waiting for Host</div>
                                        <div style={{ fontSize: 22, fontWeight: 800 }}>{session.quizTitle || 'Quiz Session'}</div>
                                        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Hosted by your teacher</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Players Joined</div>
                                        <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{allParticipants.length}</div>
                                    </div>
                                </div>

                                {/* 9.3 Students grid */}
                                <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                                        {allParticipants.map((p) => {
                                            const isMe = p.id === participantId;
                                            return (
                                                <div
                                                    key={p.id}
                                                    style={{
                                                        background: '#fff',
                                                        borderRadius: 12,
                                                        padding: '16px 12px',
                                                        textAlign: 'center',
                                                        border: isMe ? '2px solid #FF5C1A' : '1px solid #E5E7EB',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {isMe && (
                                                        <span style={{ position: 'absolute', top: 8, right: 8, background: '#FF5C1A', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Ready
                                                        </span>
                                                    )}
                                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: isMe ? '#FF5C1A' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 20, fontWeight: 700, color: isMe ? '#fff' : '#6B7280' }}>
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 9.4 Right panel */}
                            <aside style={{ width: 280, minWidth: 280, background: '#fff', borderLeft: '1px solid #E5E7EB', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Rules of Engagement */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Rules of Engagement</div>
                                    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            'Answer correctly to build your score multiplier.',
                                            'Speed matters - faster answers earn more points.',
                                            'Stay in this tab during the entire quiz.',
                                            'No cheating - violations will get you removed.',
                                            'Have fun and do your best!',
                                        ].map((rule, i) => (
                                            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <span style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', background: '#FFF3EE', color: '#FF5C1A', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                                                <span style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{rule}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Ready to Start card */}
                                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '18px 16px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Ready to Start?</div>
                                    <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>Waiting for the host to begin the session...</p>
                                    {/* Animated indeterminate progress bar */}
                                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                                        <motion.div
                                            style={{ height: '100%', background: '#FF5C1A', borderRadius: 99, width: '40%' }}
                                            animate={{ x: ['0%', '150%', '0%'] }}
                                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                        />
                                    </div>
                                </div>
                            </aside>
                        </motion.div>
                    )}

                    {/* Question active */}
                    {session.status === 'question' && (
                        !currentQuestion ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="loading-spinner mb-4" />
                                <p className="text-slate-400 font-bold">Loading question...</p>
                            </div>
                        ) : (
                            <motion.div
                                key={'question-' + session.currentQuestionIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                            >
                                {/* Progress Header */}
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            Question {session.currentQuestionIndex + 1} of {questions.length}
                                        </div>
                                        <div className="text-2xl font-black text-[#0F172A]">Find the answer!</div>
                                    </div>
                                    {timerEnabled && !hasAnswered && (
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white shadow-premium border'}`}>
                                            {timeLeft}
                                        </div>
                                    )}
                                </div>

                                {/* Question Card */}
                                <div className="bg-white rounded-[32px] p-10 shadow-premium border border-[#F1F5F9] mb-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FF5C1A]" />
                                    <h2 className="text-2xl font-black text-[#0F172A] leading-tight">
                                        {currentQuestion.questionText}
                                    </h2>
                                </div>

                                {/* Answer Buttons */}
                                {!hasAnswered ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                            const key = ('option' + letter) as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                                            const optionText = currentQuestion[key];
                                            if (!optionText) return null;
                                            const btnBg = letter === 'A' ? 'bg-orange-50 border-orange-100 hover:border-orange-300' : letter === 'B' ? 'bg-blue-50 border-blue-100 hover:border-blue-300' : letter === 'C' ? 'bg-purple-50 border-purple-100 hover:border-purple-300' : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300';
                                            const iconBg = letter === 'A' ? 'bg-orange-500 text-white' : letter === 'B' ? 'bg-blue-500 text-white' : letter === 'C' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white';
                                            
                                            return (
                                                <button
                                                    key={letter}
                                                    onClick={() => submitAnswer(letter)}
                                                    className={`group relative flex items-center gap-6 p-6 rounded-[24px] text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${btnBg}`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${iconBg}`}>
                                                        {letter}
                                                    </div>
                                                    <div className="flex-1 font-bold text-[#334155] text-lg">
                                                        {optionText}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-[32px] p-10 shadow-premium border border-[#F1F5F9] text-center"
                                    >
                                        <div className="w-20 h-20 bg-orange-50 text-[#FF5C1A] rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <CheckCircle size={40} />
                                            </motion.div>
                                        </div>
                                        <h2 className="text-2xl font-black text-[#0F172A] mb-2">Answer Locked In!</h2>
                                        <p className="text-slate-400 font-bold mb-8">Waiting for the teacher to reveal the truth...</p>
                                        
                                        <div className="flex items-center justify-center gap-2 text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '200ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '400ms' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )
                    )}

                    {/* Results phase */}
                    {session.status === 'results' && currentQuestion && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className={`rounded-[40px] p-12 mb-8 shadow-premium border relative overflow-hidden ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="relative z-10">
                                    <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {isCorrect ? <CheckCircle size={48} /> : <XCircle size={48} />}
                                    </div>
                                    <h2 className={`text-4xl font-black mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                        {isCorrect ? 'Spot On!' : 'So Close!'}
                                    </h2>
                                    <p className={`font-bold text-lg mb-8 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                        {isCorrect ? `You earned +${pointsEarned.toLocaleString()} points` : `The correct answer was ${currentQuestion.correctAnswer}`}
                                    </p>
                                    
                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur rounded-2xl border border-white/50">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Rank</div>
                                        <div className="text-2xl font-black text-[#0F172A]">#{currentPosition}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] p-8 shadow-premium border border-[#F1F5F9] mb-8">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Scoreboard</div>
                                <div className="space-y-4">
                                    {allParticipants.slice(0, 3).map((p, i) => {
                                        const rankClass = i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700';
                                        return (
                                        <div key={p.id} className={`flex items-center gap-4 p-4 rounded-[20px] ${p.id === participantId ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50 border border-slate-50'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${rankClass}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 text-left font-bold text-[#334155]">{p.name}</div>
                                            <div className="font-black text-[#0F172A]">{Math.round(p.score)}</div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3 text-slate-400 font-bold">
                                <Clock size={18} />
                                Next question is coming...
                            </div>
                        </motion.div>
                    )}

                    {/* Game ended */}
                    {session.status === 'ended' && (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="mb-12">
                                <div className="text-6xl mb-6">TROPHY</div>
                                <h1 className="text-4xl font-black text-[#0F172A] mb-2">Great Game, {playerName}!</h1>
                                <p className="text-slate-500 font-bold text-lg">You've finished your performance</p>
                            </div>

                            <div className="bg-white rounded-[40px] p-12 shadow-premium border border-[#F1F5F9] mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-yellow-500" />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Final Standing</div>
                                <div className="text-8xl font-black bg-gradient-to-br from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
                                    #{currentPosition}
                                </div>
                                <div className="text-2xl font-black text-[#0F172A] mb-2">
                                    {Math.round(participant?.score || 0).toLocaleString()} Points
                                </div>
                                <p className="text-slate-400 font-bold">out of {allParticipants.length} players</p>
                            </div>

                            <button 
                                onClick={() => navigate('/join')}
                                className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-10 py-5 rounded-[24px] font-bold text-lg shadow-2xl hover:bg-slate-800 transition-all"
                            >
                                <Trophy size={22} />
                                Back to Home
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
        </div>
    );
}
