import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
// @ts-ignore - canvas-confetti module resolution
import confetti from 'canvas-confetti';
import {
    Play, Users, CheckCircle, Clock, ArrowRight, Trophy,
    Eye, Copy, Check, Download, RefreshCw, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    getQuiz,
    getQuestions,
    createGameSession,
    updateGameSession,
    deleteGameSession,
    getParticipants,
    updateParticipant,
    getGameAnswers,
    subscribeToParticipants,
    subscribeToGameAnswers,
    type Quiz,
    type Question,
    type GameSession,
    type GameParticipant,
    type GameAnswer
} from '../lib/database';
import { useAuth } from '../contexts/AuthContext';

type GameStatus = 'waiting' | 'playing' | 'question' | 'results' | 'ended';

export function GameHost() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [participants, setParticipants] = useState<GameParticipant[]>([]);
    const [answers, setAnswers] = useState<GameAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    const currentQuestion = session ? questions[session.currentQuestionIndex] : null;
    const currentQuestionAnswers = answers.filter(
        a => a.questionIndex === session?.currentQuestionIndex
    );

    useEffect(() => {
        initializeGame();
        return () => {
            // Cleanup subscriptions
        };
    }, [id]);

    useEffect(() => {
        if (!session?.id) return;

        // Subscribe to participants
        const unsubscribeParticipants = subscribeToParticipants(session.id, (data) => {
            // Sort by score descending, then by joinedAt ascending (for ties)
            data.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                // Earlier join time wins for ties
                return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
            });
            setParticipants(data);
        });

        // Subscribe to answers
        const unsubscribeAnswers = subscribeToGameAnswers(session.id, (data) => {
            setAnswers(data);
        });

        return () => {
            unsubscribeParticipants();
            unsubscribeAnswers();
        };
    }, [session?.id]);

    // Timer Logic
    useEffect(() => {
        if (!session || session.status !== 'question' || !quiz?.timerEnabled) return;

        // Calculate initial time left based on start time
        if (session.questionStartedAt) {
            const startTime = new Date(session.questionStartedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(0, quiz.timerSeconds - elapsed);
            setTimeLeft(remaining);
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [session?.status, session?.questionStartedAt, quiz?.timerEnabled, quiz?.timerSeconds]);

    // Auto-Reveal Logic
    useEffect(() => {
        if (!session || session.status !== 'question') return;

        const allAnswered = participants.length > 0 && currentQuestionAnswers.length === participants.length;

        // Verify time up explicitly to avoid initial state issues
        let isTimeUp = false;
        if (quiz?.timerEnabled && session.questionStartedAt) {
            const startTime = new Date(session.questionStartedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            if (elapsed >= quiz.timerSeconds) {
                isTimeUp = true;
            }
        }

        // Only use timeLeft === 0 as a trigger if we confirmed time is actually up
        // or if we trust the timer effect has run (but explicit check is safer)
        const timeTrigger = quiz?.timerEnabled && timeLeft === 0 && isTimeUp;

        if (allAnswered || timeTrigger) {
            revealAnswer();
        }
    }, [session?.status, currentQuestionAnswers.length, participants.length, timeLeft, quiz?.timerEnabled, session?.questionStartedAt, quiz?.timerSeconds]);

    const initializeGame = async () => {
        if (!id || !user) return;

        try {
            // Fetch quiz and questions
            const quizData = await getQuiz(id);
            if (!quizData) {
                console.error('Quiz not found');
                setLoading(false);
                return;
            }
            setQuiz(quizData);

            const questionsData = await getQuestions(id);
            setQuestions(questionsData);

            // Create new game session
            const gameCode = generateGameCode();
            const sessionId = await createGameSession({
                quizId: id,
                teacherId: user.uid,
                gameCode,
                status: 'waiting',
                currentQuestionIndex: 0,
                questionStartedAt: null,
            });

            setSession({
                id: sessionId,
                quizId: id,
                teacherId: user.uid,
                gameCode,
                status: 'waiting',
                currentQuestionIndex: 0,
                questionStartedAt: null,
                endedAt: null,
                createdAt: null as any,
            });
        } catch (error) {
            console.error('Error initializing game:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateGameCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const copyGameCode = () => {
        if (session) {
            navigator.clipboard.writeText(session.gameCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const startGame = async () => {
        if (!session) return;

        const now = new Date().toISOString();
        await updateGameSession(session.id, {
            status: 'question',
            currentQuestionIndex: 0,
            questionStartedAt: now,
        });

        setSession({
            ...session,
            status: 'question',
            currentQuestionIndex: 0,
            questionStartedAt: now,
        });
    };

    const revealAnswer = async () => {
        if (!session) return;
        await updateGameSession(session.id, { status: 'results' });
        setSession({ ...session, status: 'results' });
    };

    const nextQuestion = async () => {
        if (!session) return;

        const nextIndex = session.currentQuestionIndex + 1;

        if (nextIndex >= questions.length) {
            // End game
            await updateGameSession(session.id, {
                status: 'ended',
                endedAt: new Date().toISOString(),
            });

            setSession({ ...session, status: 'ended' });

            // Celebrate!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        } else {
            const now = new Date().toISOString();
            await updateGameSession(session.id, {
                status: 'question',
                currentQuestionIndex: nextIndex,
                questionStartedAt: now,
            });

            setSession({
                ...session,
                status: 'question',
                currentQuestionIndex: nextIndex,
                questionStartedAt: now,
            });
        }
    };

    const endGame = async () => {
        if (!session || !confirm('Are you sure you want to end this game?')) return;

        await updateGameSession(session.id, {
            status: 'ended',
            endedAt: new Date().toISOString(),
        });

        navigate('/teacher');
    };

    const handleKickParticipant = async (participantId: string, participantName: string) => {
        if (!session || !confirm(`Are you sure you want to kick ${participantName}?`)) return;

        try {
            await updateParticipant(session.id, participantId, { status: 'kicked' });
        } catch (error) {
            console.error('Error kicking participant:', error);
            alert('Failed to kick participant');
        }
    };

    const getAnswerDistribution = () => {
        const distribution = { A: 0, B: 0, C: 0, D: 0 };
        currentQuestionAnswers.forEach(a => {
            distribution[a.answer as keyof typeof distribution]++;
        });
        return distribution;
    };

    const handleDownloadResults = async () => {
        if (!quiz || !session) return;

        // 1. Calculate total time and prepare data for each participant
        const participantData = participants.map(p => {
            const pAnswers = answers.filter(a => a.participantId === p.id);
            const totalTimeMs = pAnswers.reduce((sum, a) => sum + a.timeTakenMs, 0);

            return {
                ...p,
                totalTimeMs,
                answers: pAnswers
            };
        });

        // 2. Sort by Score (Desc) then Time (Asc)
        participantData.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.totalTimeMs - b.totalTimeMs;
        });

        // 3. Generate Excel Data
        const excelData = participantData.map((p, index) => {
            const row: any = {
                'Rank': index + 1,
                'Student Name': p.name,
                'Email': p.email,
                'Joined At': new Date(p.joinedAt).toLocaleString(),
                'Total Score': p.score,
                'Total Time (s)': (p.totalTimeMs / 1000).toFixed(2)
            };

            // Add details for each question
            questions.forEach((q, qIndex) => {
                const answer = p.answers.find(a => a.questionIndex === qIndex);
                row[`Q${qIndex + 1} Time (s)`] = answer ? (answer.timeTakenMs / 1000).toFixed(2) : '-';
                row[`Q${qIndex + 1} Score`] = answer ? answer.pointsEarned : 0;
            });

            return row;
        });

        // 4. Create Workbook and Sheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");

        // 5. Download File
        XLSX.writeFile(wb, `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`);

        // 6. Auto-delete data and navigate away
        if (confirm('Results downloaded. The game data will now be cleared from the database to prevent overload. Continue?')) {
            try {
                await deleteGameSession(session.id);
                navigate('/teacher');
            } catch (error) {
                console.error('Error deleting session:', error);
                alert('Failed to clear game data. Please try again.');
            }
        }
    };

    const joinUrl = session ? `${window.location.origin}/join/${session.gameCode}` : '';

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!quiz || !session) {
        return (
            <div className="page">
                <div className="container text-center">
                    <h2>Failed to initialize game</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container container-lg">
                {/* Waiting Room */}
                <AnimatePresence mode="wait">
                    {session.status === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <h2 style={{ marginBottom: '0.5rem' }}>{quiz.title}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                Share the code or QR with your students to join
                            </p>

                            <div className="grid grid-2 gap-xl mb-xl">
                                {/* Game Code */}
                                <div className="card">
                                    <h3 style={{ marginBottom: '1rem' }}>Game Code</h3>
                                    <div className="game-code" onClick={copyGameCode} style={{ cursor: 'pointer' }}>
                                        {session.gameCode}
                                    </div>
                                    <button onClick={copyGameCode} className="btn btn-secondary btn-sm">
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>

                                {/* QR Code */}
                                <div className="card">
                                    <h3 style={{ marginBottom: '1rem' }}>Scan to Join</h3>
                                    <div className="qr-container" style={{ margin: '0 auto' }}>
                                        <QRCodeSVG value={joinUrl} size={180} />
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="card mb-xl">
                                <div className="flex justify-between items-center mb-lg">
                                    <h3>
                                        <Users size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                        Students Joined
                                    </h3>
                                    <span className="badge badge-live">{participants.length} joined</span>
                                </div>

                                {participants.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
                                        <div className="waiting-dots" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                                            <span></span><span></span><span></span>
                                        </div>
                                        Waiting for students to join...
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {participants.map((p) => (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    background: p.status === 'kicked' ? 'rgba(239, 68, 68, 0.2)' : p.status === 'left' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-elevated)',
                                                    color: p.status === 'kicked' ? 'var(--accent-error)' : p.status === 'left' ? 'var(--accent-warning)' : 'inherit',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.9rem',
                                                    border: p.status === 'kicked' ? '1px solid var(--accent-error)' : p.status === 'left' ? '1px solid var(--accent-warning)' : 'none'
                                                }}
                                            >
                                                <span>
                                                    {p.name}
                                                    {p.status === 'kicked' && ' (Kicked)'}
                                                    {p.status === 'left' && ' (Left)'}
                                                </span>
                                                {p.status !== 'kicked' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleKickParticipant(p.id, p.name);
                                                        }}
                                                        className="btn-icon-sm"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title="Kick Student"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={startGame}
                                disabled={participants.length === 0}
                                className="btn btn-primary btn-lg"
                            >
                                <Play size={20} />
                                Start Game ({questions.length} questions)
                            </button>
                        </motion.div>
                    )}

                    {/* Question/Results View */}
                    {(session.status === 'question' || session.status === 'results') && currentQuestion && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-lg">
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Question {session.currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <div className="flex items-center gap-md">
                                    {quiz?.timerEnabled && (
                                        <div className={`timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}
                                            style={{ width: '50px', height: '50px', fontSize: '1.2rem', marginRight: '1rem' }}>
                                            {timeLeft}
                                        </div>
                                    )}
                                    <button
                                        onClick={async () => {
                                            const p = await getParticipants(session.id);
                                            p.sort((a, b) => b.score - a.score);
                                            setParticipants(p);
                                            const a = await getGameAnswers(session.id);
                                            setAnswers(a);
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        title="Refresh Data"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <span className="badge badge-live">
                                        {currentQuestionAnswers.length}/{participants.length} answered
                                    </span>
                                    <button onClick={endGame} className="btn btn-danger btn-sm">
                                        End Game
                                    </button>
                                </div>
                            </div>

                            {/* Question */}
                            <div className="card mb-xl">
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                    {currentQuestion.questionText}
                                </h2>

                                <div className="grid grid-2 gap-md">
                                    {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                        const isCorrect = currentQuestion.correctAnswer === letter;
                                        const showCorrect = session.status === 'results' && isCorrect;
                                        const answerCount = getAnswerDistribution()[letter];

                                        return (
                                            <div
                                                key={letter}
                                                className={`answer-btn answer-${letter.toLowerCase()}`}
                                                style={{
                                                    opacity: session.status === 'results' && !isCorrect ? 0.5 : 1,
                                                    border: showCorrect ? '3px solid var(--accent-success)' : 'none',
                                                }}
                                            >
                                                <span style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    borderRadius: 'var(--radius-md)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700'
                                                }}>
                                                    {letter}
                                                </span>
                                                <span style={{ flex: 1 }}>
                                                    {currentQuestion[`option${letter}` as keyof Question]}
                                                </span>
                                                {session.status === 'results' && (
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.2)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontWeight: '600'
                                                    }}>
                                                        {answerCount}
                                                    </span>
                                                )}
                                                {showCorrect && <CheckCircle size={24} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Answer Tracking */}
                            {session.status === 'question' && (
                                <div className="grid grid-3 gap-xl mb-xl">
                                    <div className="card">
                                        <h4 style={{ color: 'var(--accent-success)', marginBottom: '1rem' }}>
                                            <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                            Answered ({participants.filter(p => currentQuestionAnswers.some(a => a.participantId === p.id) && p.status !== 'kicked' && p.status !== 'left').length})
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflow: 'auto' }}>
                                            {participants
                                                .filter(p => currentQuestionAnswers.some(a => a.participantId === p.id) && p.status !== 'kicked' && p.status !== 'left')
                                                .slice(0, 50)
                                                .map(p => (
                                                    <span key={p.id} style={{
                                                        background: 'rgba(0, 223, 129, 0.1)',
                                                        color: 'var(--accent-success)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {p.name}
                                                    </span>
                                                ))}
                                            {currentQuestionAnswers.length > 50 && (
                                                <span style={{
                                                    background: 'var(--bg-elevated)',
                                                    color: 'var(--text-muted)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    +{currentQuestionAnswers.length - 50} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <h4 style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }}>
                                            <Clock size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                            Waiting ({participants.filter(p => !currentQuestionAnswers.some(a => a.participantId === p.id) && p.status !== 'kicked' && p.status !== 'left').length})
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflow: 'auto' }}>
                                            {participants
                                                .filter(p => !currentQuestionAnswers.some(a => a.participantId === p.id) && p.status !== 'kicked' && p.status !== 'left')
                                                .slice(0, 50)
                                                .map(p => (
                                                    <div key={p.id} style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        background: 'rgba(245, 158, 11, 0.1)',
                                                        color: 'var(--accent-warning)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <span>{p.name}</span>
                                                        <button
                                                            onClick={() => handleKickParticipant(p.id, p.name)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--accent-warning)',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Kick Student"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <h4 style={{ color: 'var(--accent-error)', marginBottom: '1rem' }}>
                                            <XCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                            Left/Kicked ({participants.filter(p => p.status === 'kicked' || p.status === 'left').length})
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflow: 'auto' }}>
                                            {participants
                                                .filter(p => p.status === 'kicked' || p.status === 'left')
                                                .map(p => {
                                                    const isCheatKick = p.kickReason === 'Anti-cheat violations';
                                                    return (
                                                        <div key={p.id} style={{
                                                            display: 'inline-flex',
                                                            flexDirection: 'column',
                                                            gap: '0.25rem',
                                                            background: isCheatKick ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: 'var(--accent-error)',
                                                            padding: '0.5rem 0.75rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '0.85rem',
                                                            border: isCheatKick ? '2px solid var(--accent-error)' : '1px solid var(--accent-error)',
                                                            minWidth: '150px'
                                                        }}>
                                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                                                {p.kickReason || p.status}
                                                                {p.violationCount && ` (${p.violationCount} violations)`}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mini Leaderboard */}
                            {session.status === 'results' && (
                                <div className="card mb-xl">
                                    <h4 style={{ marginBottom: '1rem' }}>
                                        <Trophy size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                        Top 5
                                    </h4>
                                    <div className="leaderboard">
                                        {participants.slice(0, 5).map((p, i) => (
                                            <div key={p.id} className={`leaderboard-item ${i < 3 ? `top-${i + 1}` : ''}`}>
                                                <span className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                                <span className="leaderboard-name">{p.name}</span>
                                                <span className="leaderboard-score">{p.score.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex justify-center gap-md">
                                {session.status === 'question' ? (
                                    <button onClick={revealAnswer} className="btn btn-primary btn-lg">
                                        <Eye size={20} />
                                        Reveal Answer
                                    </button>
                                ) : (
                                    <button onClick={nextQuestion} className="btn btn-primary btn-lg">
                                        {session.currentQuestionIndex + 1 >= questions.length ? (
                                            <>
                                                <Trophy size={20} />
                                                Show Final Results
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight size={20} />
                                                Next Question
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Game Ended - Final Results */}
                    {session.status === 'ended' && (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <h1 style={{ marginBottom: '2rem' }}>🎉 Game Complete!</h1>

                            {/* Podium */}
                            {participants.length >= 3 && (
                                <div className="podium" style={{ marginBottom: '2rem' }}>
                                    <div className="podium-place second">
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🥈</div>
                                        <div className="podium-name">{participants[1]?.name}</div>
                                        <div className="podium-score">{participants[1]?.score.toLocaleString()}</div>
                                    </div>
                                    <div className="podium-place first">
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🥇</div>
                                        <div className="podium-name">{participants[0]?.name}</div>
                                        <div className="podium-score">{participants[0]?.score.toLocaleString()}</div>
                                    </div>
                                    <div className="podium-place third">
                                        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🥉</div>
                                        <div className="podium-name">{participants[2]?.name}</div>
                                        <div className="podium-score">{participants[2]?.score.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            {/* Top 5 */}
                            <div className="card mb-xl">
                                <h4 style={{ marginBottom: '1rem' }}>Top 5</h4>
                                <div className="leaderboard">
                                    {participants.slice(0, 5).map((p, i) => (
                                        <div
                                            key={p.id}
                                            className={`leaderboard-item ${i < 3 ? `top-${i + 1}` : ''}`}
                                        >
                                            <span className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
                                                }`}>
                                                {i + 1}
                                            </span>
                                            <span className="leaderboard-name">{p.name}</span>
                                            <span className="leaderboard-score">{p.score.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Results Table */}
                            <div className="card mb-xl text-left" style={{ overflowX: 'auto' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Detailed Results</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rank</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Student</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Score</th>
                                            {questions.map((q, i) => (
                                                <th key={q.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    Q{i + 1}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.map((p, i) => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.5rem' }}>{i + 1}</td>
                                                <td style={{ padding: '0.5rem', fontWeight: '500' }}>{p.name}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.score.toLocaleString()}</td>
                                                {questions.map((q, qIndex) => {
                                                    const answer = answers.find(a => a.participantId === p.id && a.questionIndex === qIndex);
                                                    const isCorrect = answer?.isCorrect;
                                                    const time = answer ? (answer.timeTakenMs / 1000).toFixed(1) + 's' : '-';

                                                    return (
                                                        <td key={q.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {answer ? (
                                                                    <span style={{
                                                                        color: isCorrect ? 'var(--accent-success)' : 'var(--accent-error)',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        {answer.answer}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                                )}
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{time}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-md justify-center">
                                <button onClick={handleDownloadResults} className="btn btn-secondary btn-lg">
                                    <Download size={20} style={{ marginRight: '0.5rem' }} />
                                    Download Excel
                                </button>
                                <button onClick={() => navigate('/teacher')} className="btn btn-primary btn-lg">
                                    Back to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
