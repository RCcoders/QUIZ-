import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - canvas-confetti module resolution
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
    getGameSession,
    getQuiz,
    getQuestions,
    getParticipants,
    getParticipantAnswer,
    addGameAnswer,
    updateParticipant,
    subscribeToGameSession,
    subscribeToParticipants,
    type GameSession,
    type Question,
    type GameParticipant
} from '../lib/database';

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

    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);

    const [timeLeft, setTimeLeft] = useState(0);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(30);

    const [loading, setLoading] = useState(true);
    const [previousQuestionIndex, setPreviousQuestionIndex] = useState(-1);

    useEffect(() => {
        if (!participantId) {
            navigate('/join');
            return;
        }
        initializeGame();
    }, [sessionId, participantId]);

    useEffect(() => {
        if (!session?.id || !sessionId) return;

        // Subscribe to session changes
        const unsubscribeSession = subscribeToGameSession(sessionId, (newSession) => {
            if (!newSession) return;

            setSession(newSession);

            if (newSession.status === 'question' && newSession.questionStartedAt) {
                // Check if this is a new question
                if (newSession.currentQuestionIndex !== previousQuestionIndex) {
                    setPreviousQuestionIndex(newSession.currentQuestionIndex);
                    setSelectedAnswer(null);
                    setHasAnswered(false);
                    setIsCorrect(null);
                    setPointsEarned(0);
                    setQuestionStartTime(Date.now());
                    if (timerEnabled) {
                        setTimeLeft(timerSeconds);
                    }
                }
            }

            if (newSession.status === 'ended') {
                // Game ended - celebrate!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                });
            }
        });

        // Subscribe to participant updates
        const unsubscribeParticipants = subscribeToParticipants(sessionId, (participants) => {
            // Sort by score descending
            participants.sort((a, b) => b.score - a.score);
            setAllParticipants(participants);

            // Update current participant
            const current = participants.find(p => p.id === participantId);
            if (current) setParticipant(current);
        });

        return () => {
            unsubscribeSession();
            unsubscribeParticipants();
        };
    }, [session?.id, sessionId, participantId, timerEnabled, timerSeconds, previousQuestionIndex]);

    useEffect(() => {
        if (!timerEnabled || !session || session.status !== 'question' || hasAnswered) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timerEnabled, session?.status, hasAnswered, session?.currentQuestionIndex]);

    const initializeGame = async () => {
        if (!sessionId || !participantId) return;

        try {
            // Fetch session
            const sessionData = await getGameSession(sessionId);
            if (!sessionData) {
                console.error('Session not found');
                setLoading(false);
                return;
            }
            setSession(sessionData);
            setPreviousQuestionIndex(sessionData.currentQuestionIndex);

            // Fetch quiz settings
            const quizData = await getQuiz(sessionData.quizId);
            if (quizData) {
                setTimerEnabled(quizData.timerEnabled);
                setTimerSeconds(quizData.timerSeconds);
                if (quizData.timerEnabled && sessionData.status === 'question') {
                    setTimeLeft(quizData.timerSeconds);
                }
            }

            // Fetch questions
            const questionsData = await getQuestions(sessionData.quizId);
            setQuestions(questionsData);

            // Fetch participants and find current
            const participants = await getParticipants(sessionId);
            participants.sort((a, b) => b.score - a.score);
            setAllParticipants(participants);

            const currentParticipant = participants.find(p => p.id === participantId);
            if (currentParticipant) {
                setParticipant(currentParticipant);
            }

            // Check if already answered current question
            const existingAnswer = await getParticipantAnswer(
                sessionId,
                participantId,
                sessionData.currentQuestionIndex
            );

            if (existingAnswer) {
                setHasAnswered(true);
                setSelectedAnswer(existingAnswer.answer);
                setIsCorrect(existingAnswer.isCorrect);
                setPointsEarned(existingAnswer.pointsEarned);
            } else if (sessionData.status === 'question') {
                setQuestionStartTime(Date.now());
            }
        } catch (error) {
            console.error('Error initializing game:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
        if (!session || !questions.length || hasAnswered || !sessionId || !participantId) return;

        const currentQuestion = questions[session.currentQuestionIndex];
        const timeTaken = Date.now() - questionStartTime;
        const correct = answer === currentQuestion.correctAnswer;

        // Calculate points with speed bonus
        let points = 0;
        if (correct) {
            points = 1000; // Base points
            if (timerEnabled && timerSeconds > 0) {
                const timeRatio = timeTaken / (timerSeconds * 1000);
                if (timeRatio <= 0.25) points += 500;
                else if (timeRatio <= 0.5) points += 300;
                else if (timeRatio <= 0.75) points += 100;
            }
        }

        setSelectedAnswer(answer);
        setHasAnswered(true);
        setIsCorrect(correct);
        setPointsEarned(points);

        // Record answer
        try {
            await addGameAnswer(sessionId, {
                participantId,
                questionIndex: session.currentQuestionIndex,
                answer,
                isCorrect: correct,
                timeTakenMs: timeTaken,
                pointsEarned: points,
            });

            // Update participant score
            await updateParticipant(sessionId, participantId, {
                score: (participant?.score || 0) + points,
                answersCount: (participant?.answersCount || 0) + 1,
            });

        } catch (error) {
            console.error('Error submitting answer:', error);
        }
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

    return (
        <div className="page">
            <div className="container container-md">
                <AnimatePresence mode="wait">
                    {/* Waiting for game to start */}
                    {session.status === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                            style={{ paddingTop: '4rem' }}
                        >
                            <h2 style={{ marginBottom: '1rem' }}>Welcome, {playerName}!</h2>
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-xl)',
                                padding: '3rem',
                                marginBottom: '2rem'
                            }}>
                                <div className="waiting-dots" style={{ justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem' }}>
                                    <span></span><span></span><span></span>
                                </div>
                                <h3 style={{ color: 'var(--text-secondary)' }}>Waiting for host to start...</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    {allParticipants.length} players in lobby
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Question active */}
                    {session.status === 'question' && currentQuestion && (
                        <motion.div
                            key={`question-${session.currentQuestionIndex}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-lg">
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Question {session.currentQuestionIndex + 1} of {questions.length}
                                </span>
                                {timerEnabled && !hasAnswered && (
                                    <div className={`timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}
                                        style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                        {timeLeft}
                                    </div>
                                )}
                            </div>

                            {/* Question */}
                            <div className="card mb-xl text-center">
                                <h2 style={{ fontSize: '1.5rem' }}>
                                    {currentQuestion.questionText}
                                </h2>
                            </div>

                            {/* Answer Buttons or Waiting */}
                            {!hasAnswered ? (
                                <div className="grid grid-2 gap-md">
                                    {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                                        <button
                                            key={letter}
                                            onClick={() => submitAnswer(letter)}
                                            className={`answer-btn answer-${letter.toLowerCase()}`}
                                        >
                                            <span style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                fontSize: '1.25rem'
                                            }}>
                                                {letter}
                                            </span>
                                            <span style={{ flex: 1, textAlign: 'left' }}>
                                                {currentQuestion[`option${letter}` as keyof Question]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="card text-center"
                                    style={{
                                        background: isCorrect ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                                        border: `2px solid ${isCorrect ? 'var(--accent-success)' : 'var(--accent-error)'}`
                                    }}
                                >
                                    {isCorrect ? (
                                        <>
                                            <CheckCircle size={64} style={{ color: 'var(--accent-success)', margin: '0 auto 1rem' }} />
                                            <h2 style={{ color: 'var(--accent-success)' }}>Correct!</h2>
                                            <p style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
                                                +{pointsEarned.toLocaleString()} points
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={64} style={{ color: 'var(--accent-error)', margin: '0 auto 1rem' }} />
                                            <h2 style={{ color: 'var(--accent-error)' }}>Not quite!</h2>
                                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                You answered {selectedAnswer}
                                            </p>
                                        </>
                                    )}

                                    <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                                        <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                        Waiting for next question...
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Results phase */}
                    {session.status === 'results' && currentQuestion && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="card mb-xl">
                                <h3 style={{ marginBottom: '1rem' }}>Your Position</h3>
                                <div style={{
                                    fontSize: '4rem',
                                    fontWeight: '800',
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    #{currentPosition}
                                </div>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    {participant?.score.toLocaleString()} points
                                </p>
                            </div>

                            <div style={{ color: 'var(--text-muted)' }}>
                                <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                Waiting for next question...
                            </div>
                        </motion.div>
                    )}

                    {/* Game ended */}
                    {session.status === 'ended' && (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                            style={{ paddingTop: '2rem' }}
                        >
                            <Trophy size={80} style={{ color: '#ffd700', margin: '0 auto 1rem' }} />
                            <h1 style={{ marginBottom: '0.5rem' }}>Game Over!</h1>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                Great job, {playerName}!
                            </p>

                            <div className="card mb-xl text-center">
                                <h3>Your Final Position</h3>
                                <div style={{
                                    fontSize: '5rem',
                                    fontWeight: '800',
                                    background: currentPosition <= 3
                                        ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
                                        : 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '0.5rem'
                                }}>
                                    #{currentPosition}
                                </div>
                                <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                                    {participant?.score.toLocaleString()} points
                                </p>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    out of {allParticipants.length} players
                                </p>
                            </div>

                            {/* Top 5 */}
                            <div className="card">
                                <h4 style={{ marginBottom: '1rem' }}>Top 5</h4>
                                <div className="leaderboard">
                                    {allParticipants.slice(0, 5).map((p, i) => (
                                        <div
                                            key={p.id}
                                            className={`leaderboard-item ${i < 3 ? `top-${i + 1}` : ''} ${p.id === participantId ? 'highlighted' : ''
                                                }`}
                                            style={{
                                                background: p.id === participantId ? 'rgba(108, 99, 255, 0.15)' : undefined
                                            }}
                                        >
                                            <span className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
                                                }`}>
                                                {i + 1}
                                            </span>
                                            <span className="leaderboard-name">
                                                {p.name} {p.id === participantId && '(You)'}
                                            </span>
                                            <span className="leaderboard-score">{p.score.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/join')}
                                className="btn btn-primary btn-lg mt-xl"
                            >
                                Play Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
