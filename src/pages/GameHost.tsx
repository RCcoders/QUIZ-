import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
// @ts-ignore - canvas-confetti module resolution
import confetti from 'canvas-confetti';
import {
    Play, Users, CheckCircle, Clock, ArrowRight, Trophy,
    Eye, Copy, Check
} from 'lucide-react';
import {
    getQuiz,
    getQuestions,
    createGameSession,
    updateGameSession,
    getParticipants,
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
            // Sort by score descending
            data.sort((a, b) => b.score - a.score);
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

    const getAnswerDistribution = () => {
        const distribution = { A: 0, B: 0, C: 0, D: 0 };
        currentQuestionAnswers.forEach(a => {
            distribution[a.answer as keyof typeof distribution]++;
        });
        return distribution;
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
                                            <span
                                                key={p.id}
                                                style={{
                                                    background: 'var(--bg-elevated)',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {p.name}
                                            </span>
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
                            {/* Progress */}
                            <div className="flex justify-between items-center mb-lg">
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Question {session.currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <div className="flex items-center gap-md">
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
                                <div className="grid grid-2 gap-xl mb-xl">
                                    <div className="card">
                                        <h4 style={{ color: 'var(--accent-success)', marginBottom: '1rem' }}>
                                            <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                            Answered ({currentQuestionAnswers.length})
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflow: 'auto' }}>
                                            {participants
                                                .filter(p => currentQuestionAnswers.some(a => a.participantId === p.id))
                                                .map(p => (
                                                    <span key={p.id} style={{
                                                        background: 'rgba(0, 255, 136, 0.1)',
                                                        color: 'var(--accent-success)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {p.name}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <h4 style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }}>
                                            <Clock size={18} style={{ display: 'inline', marginRight: '8px' }} />
                                            Waiting ({participants.length - currentQuestionAnswers.length})
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflow: 'auto' }}>
                                            {participants
                                                .filter(p => !currentQuestionAnswers.some(a => a.participantId === p.id))
                                                .map(p => (
                                                    <span key={p.id} style={{
                                                        background: 'rgba(255, 170, 0, 0.1)',
                                                        color: 'var(--accent-warning)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {p.name}
                                                    </span>
                                                ))}
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
                                                <span className="leaderboard-score">{p.score.toLocaleString()}</span>
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

                            {/* Full Leaderboard */}
                            <div className="card" style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Final Leaderboard</h3>
                                <div className="leaderboard">
                                    {participants.map((p, i) => (
                                        <div key={p.id} className={`leaderboard-item ${i < 3 ? `top-${i + 1}` : ''}`}>
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

                            <button onClick={() => navigate('/teacher')} className="btn btn-primary btn-lg">
                                Back to Dashboard
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
