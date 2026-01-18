import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, Loader } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StreakCounter } from '../components/StreakCounter';
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
import { supabase } from '../lib/supabase';

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
    const [myAnswers, setMyAnswers] = useState<Array<{
        questionIndex: number;
        answer: string;
        isCorrect: boolean;
    }>>([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    const [timeLeft, setTimeLeft] = useState(0);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(30);

    const [loading, setLoading] = useState(true);
    const [previousQuestionIndex, setPreviousQuestionIndex] = useState(-1);

    // Anti-Cheat State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
    const [showCheatWarning, setShowCheatWarning] = useState(false);

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
        initializeGame();
    }, [sessionId, participantId]);

    // Anti-Cheat: Fullscreen & Visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 2) {
                        alert('Violation: You have switched tabs too many times. You will be removed from the game.');
                        if (session?.id && participantId) {
                            localStorage.setItem(`banned_session_${session.id}`, 'true');
                            updateParticipant(session.id, participantId, { status: 'kicked' });
                        }
                        navigate('/join');
                    } else {
                        alert(`Warning: Tab switching is not allowed! (${newCount}/2)`);
                        setShowCheatWarning(true);
                    }
                    return newCount;
                });
            }
        };

        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);

            // Track fullscreen exits during active game
            if (!isNowFullscreen && session?.status === 'question') {
                setFullscreenExitCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 2) {
                        alert('You have exited fullscreen mode more than 2 times. You will be removed from the game.');
                        // Set ban flag
                        if (session?.id && participantId) {
                            localStorage.setItem(`banned_session_${session.id}`, 'true');
                            updateParticipant(session.id, participantId, { status: 'kicked' });
                        }
                        // Navigate back to join page
                        navigate('/join');
                    } else {
                        alert(`Warning: Exiting fullscreen mode! (${newCount}/2) - One more exit will remove you from the game.`);
                    }
                    return newCount;
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [session?.status, navigate, session?.id, participantId]);

    // Handle leaving the game (unmount)
    useEffect(() => {
        return () => {
            // If we are unmounting and the game is not ended, and we weren't kicked (checked via localStorage or state), set status to left
            // Note: This runs on navigation.
            if (session?.id && participantId && session.status !== 'ended') {
                const isBanned = localStorage.getItem(`banned_session_${session.id}`) === 'true';
                if (!isBanned) {
                    updateParticipant(session.id, participantId, { status: 'left' });
                }
            }
        };
    }, [session?.id, participantId, session?.status]);

    const enterFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error('Error entering fullscreen:', err);
        }
    };



    // Cleanup media stream on unmount


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
            // Only set previous index if game is active, otherwise keep at -1 so transition to Q0 triggers start time
            if (sessionData.status !== 'waiting') {
                setPreviousQuestionIndex(sessionData.currentQuestionIndex);
            }

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
                const startTime = getOrSetLocalStartTime(sessionId, sessionData.currentQuestionIndex);
                setQuestionStartTime(startTime);
            }
        } catch (error) {
            console.error('Error initializing game:', error);
        } finally {
            setLoading(false);
        }
    };

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

                    const startTime = getOrSetLocalStartTime(sessionId, newSession.currentQuestionIndex);
                    setQuestionStartTime(startTime);

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

        // Use local start time for smoother countdown and to match scoring logic
        if (questionStartTime > 0) {
            const now = Date.now();
            const elapsed = Math.floor((now - questionStartTime) / 1000);
            const remaining = Math.max(0, timerSeconds - elapsed);
            setTimeLeft(remaining);
        } else {
            setTimeLeft(timerSeconds);
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timerEnabled, session?.status, hasAnswered, session?.currentQuestionIndex, session?.questionStartedAt, timerSeconds]);

    const submitAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
        if (!session || !questions.length || hasAnswered || !sessionId || !participantId) return;

        const currentQuestion = questions[session.currentQuestionIndex];

        let timeTaken = 0;
        // Use local time to prevent clock skew issues and ensure fairness relative to when user saw the question
        const startTime = questionStartTime || Date.now();
        timeTaken = Math.max(0, Date.now() - startTime);

        // Safety clamp: If timeTaken is huge (e.g. timestamp instead of duration), reset it
        if (timeTaken > 3600000) { // 1 hour
            console.warn('Time taken seems invalid (too large), resetting to 0:', timeTaken);
            timeTaken = 0;
        }

        const correct = answer === currentQuestion.correctAnswer;

        // Calculate points with speed bonus
        // Calculate points with granular speed bonus to prevent ties
        let points = 0;
        if (correct) {
            const BASE_POINTS = 10;
            const MAX_BONUS = 2;

            points = BASE_POINTS;

            if (timerEnabled && timerSeconds > 0) {
                // Linear decay: Full bonus at 0s, 0 bonus at timerSeconds
                // Formula: Bonus * (1 - (timeTaken / totalTime))
                const totalTimeMs = timerSeconds * 1000;
                // Clamp timeTaken to not exceed totalTimeMs (though it shouldn't)
                const effectiveTimeTaken = Math.min(timeTaken, totalTimeMs);

                const bonusRatio = 1 - (effectiveTimeTaken / totalTimeMs);
                // Calculate bonus with 1 decimal place precision (e.g. 0.1, 1.5, 2.0)
                const speedBonus = Math.round((MAX_BONUS * Math.max(0, bonusRatio)) * 10) / 10;

                points += speedBonus;
            }
        }

        setSelectedAnswer(answer);
        setHasAnswered(true);
        setIsCorrect(correct);
        setIsCorrect(correct);
        setPointsEarned(points);

        if (correct) {
            setCurrentStreak(prev => prev + 1);
        } else {
            setCurrentStreak(0);
        }

        // Record answer locally for review
        setMyAnswers(prev => [...prev, {
            questionIndex: session.currentQuestionIndex,
            answer: answer,
            isCorrect: correct
        }]);

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

            // Fetch latest participant data to ensure score is accurate
            // We can't rely on local state due to potential subscription delays
            const { data: latestParticipant } = await supabase
                .from('game_participants')
                .select('score, answers_count')
                .eq('id', participantId)
                .single();

            const currentScore = latestParticipant?.score || 0;
            const currentAnswersCount = latestParticipant?.answers_count || 0;

            // Update participant score
            await updateParticipant(sessionId, participantId, {
                score: currentScore + points,
                answersCount: currentAnswersCount + 1,
            });

        } catch (error: any) {
            console.error('Error submitting answer:', error);
            alert(`Failed to submit answer: ${error.message || 'Check console for details'}`);
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


                {/* Game Content */}
                {(true) && (
                    <AnimatePresence mode="wait">
                        {/* Waiting for game to start */}
                        {session.status === 'waiting' && (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="min-h-screen flex flex-col items-center justify-center text-center p-md"
                                style={{ marginTop: '-4rem' }} // Offset for navbar if needed, or just center
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="card"
                                    style={{
                                        maxWidth: '450px',
                                        width: '100%',
                                        padding: '3rem 2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '1.5rem',
                                        background: 'rgba(255, 255, 255, 0.05)', // Glass effect enhancement
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Loader size={48} className="text-primary" />
                                        </motion.div>
                                    </div>

                                    <div>
                                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Welcome, {playerName}!</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                            You're all set.
                                        </p>
                                    </div>

                                    <div style={{
                                        background: 'var(--bg-elevated)',
                                        padding: '1rem 1.5rem',
                                        borderRadius: 'var(--radius-lg)',
                                        width: '100%'
                                    }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Waiting for Host</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            The quiz will start soon...
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-sm text-muted text-sm">
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                        <span>{allParticipants.length} players in lobby</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Question active */}
                        {session.status === 'question' && (
                            !currentQuestion ? (
                                <div className="text-center" style={{ paddingTop: '4rem' }}>
                                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                                    <p>Loading question...</p>
                                </div>
                            ) : (
                                <motion.div
                                    key={`question-${session.currentQuestionIndex}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-lg">
                                        <div className="flex items-center gap-md">
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                Question {session.currentQuestionIndex + 1} of {questions.length}
                                            </span>
                                            <StreakCounter streak={currentStreak} />
                                        </div>
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
                                                background: isCorrect ? 'rgba(0, 223, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
                            )
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
                                                    background: p.id === participantId ? 'var(--accent-primary-glow)' : undefined
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

                                {/* Review Section */}
                                <div className="text-left mb-xl mt-xl">
                                    <h3 className="text-center mb-lg">Review Your Answers</h3>
                                    <div className="flex flex-col gap-md">
                                        {questions.map((q, i) => {
                                            const myAnswer = myAnswers.find(a => a.questionIndex === i);
                                            const isCorrect = myAnswer?.isCorrect;
                                            const userSelectedOption = myAnswer?.answer;

                                            return (
                                                <div
                                                    key={q.id}
                                                    className="card p-md"
                                                    style={{
                                                        borderLeft: `4px solid ${isCorrect ? 'var(--accent-success)' : userSelectedOption ? 'var(--accent-error)' : 'var(--text-muted)'}`,
                                                        background: 'var(--bg-elevated)'
                                                    }}
                                                >
                                                    <div className="flex items-start gap-md">
                                                        <div className="mt-1">
                                                            {isCorrect ? (
                                                                <CheckCircle size={20} className="text-success" />
                                                            ) : userSelectedOption ? (
                                                                <XCircle size={20} className="text-error" />
                                                            ) : (
                                                                <Clock size={20} className="text-muted" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold mb-sm">
                                                                {i + 1}. {q.questionText}
                                                            </p>

                                                            <div className="text-sm space-y-xs">
                                                                <div className={`flex items-center gap-xs ${isCorrect ? 'text-success' : userSelectedOption ? 'text-error' : 'text-muted'}`}>
                                                                    <span className="font-medium">Your Answer:</span>
                                                                    <span>
                                                                        {userSelectedOption ? (
                                                                            <>
                                                                                <span className="font-bold">{userSelectedOption}</span>: {q[`option${userSelectedOption}` as keyof typeof q]}
                                                                            </>
                                                                        ) : 'Did not answer'}
                                                                    </span>
                                                                </div>

                                                                {!isCorrect && (
                                                                    <div className="flex items-center gap-xs text-success">
                                                                        <span className="font-medium">Correct Answer:</span>
                                                                        <span>
                                                                            <span className="font-bold">{q.correctAnswer}</span>: {q[`option${q.correctAnswer}` as keyof typeof q]}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                )}
            </div>
        </div>
    );
}
