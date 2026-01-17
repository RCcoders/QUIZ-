import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw, Camera, Mic, Maximize } from 'lucide-react';
import {
    getQuiz,
    getQuestions,
    createResponse,
    updateResponse,
    type Quiz,
    type Question
} from '../lib/database';

interface QuizAnswer {
    questionId: string;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
}

export function StudentQuiz() {
    const { id } = useParams();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Student info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [started, setStarted] = useState(false);

    // Quiz progress
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [responseId, setResponseId] = useState<string | null>(null);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);

    // Anti-cheat permissions
    const [cameraGranted, setCameraGranted] = useState(false);
    const [micGranted, setMicGranted] = useState(false);
    const [fullscreenGranted, setFullscreenGranted] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        if (!quiz?.timerEnabled || !started || showResult || completed) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up - auto submit with no answer
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz?.timerEnabled, started, showResult, currentIndex, completed]);

    const handleTimeUp = useCallback(() => {
        if (selectedAnswer) {
            submitAnswer(selectedAnswer);
        } else {
            // Mark as wrong if no answer
            const currentQuestion = questions[currentIndex];
            const newAnswer: QuizAnswer = {
                questionId: currentQuestion.id,
                answer: 'A', // Default
                isCorrect: false,
                timeTakenMs: quiz?.timerSeconds ? quiz.timerSeconds * 1000 : 0,
            };
            setAnswers([...answers, newAnswer]);
            setShowResult(true);
        }
    }, [selectedAnswer, questions, currentIndex, quiz, answers]);

    const fetchQuiz = async () => {
        if (!id) return;

        // Handle Practice Quiz
        if (id === 'practice-quiz') {
            setQuiz({
                id: 'practice-quiz',
                teacherId: 'system',
                title: 'General Knowledge Practice',
                description: 'A quick 10-question quiz to test your knowledge.',
                isActive: true,
                timerEnabled: true,
                timerSeconds: 30,
                showResults: true,
                showLeaderboard: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setQuestions([
                { id: 'p1', quizId: 'practice-quiz', questionText: 'What is the capital of France?', optionA: 'London', optionB: 'Berlin', optionC: 'Paris', optionD: 'Madrid', correctAnswer: 'C', difficulty: 'easy', orderIndex: 0, createdAt: '' },
                { id: 'p2', quizId: 'practice-quiz', questionText: 'Which planet is known as the Red Planet?', optionA: 'Venus', optionB: 'Mars', optionC: 'Jupiter', optionD: 'Saturn', correctAnswer: 'B', difficulty: 'easy', orderIndex: 1, createdAt: '' },
                { id: 'p3', quizId: 'practice-quiz', questionText: 'What is the largest mammal in the world?', optionA: 'African Elephant', optionB: 'Blue Whale', optionC: 'Giraffe', optionD: 'Great White Shark', correctAnswer: 'B', difficulty: 'medium', orderIndex: 2, createdAt: '' },
                { id: 'p4', quizId: 'practice-quiz', questionText: 'Who wrote "Romeo and Juliet"?', optionA: 'Charles Dickens', optionB: 'William Shakespeare', optionC: 'Mark Twain', optionD: 'Jane Austen', correctAnswer: 'B', difficulty: 'medium', orderIndex: 3, createdAt: '' },
                { id: 'p5', quizId: 'practice-quiz', questionText: 'What is the chemical symbol for Gold?', optionA: 'Ag', optionB: 'Fe', optionC: 'Au', optionD: 'Cu', correctAnswer: 'C', difficulty: 'medium', orderIndex: 4, createdAt: '' },
                { id: 'p6', quizId: 'practice-quiz', questionText: 'Which element has the atomic number 1?', optionA: 'Helium', optionB: 'Oxygen', optionC: 'Hydrogen', optionD: 'Carbon', correctAnswer: 'C', difficulty: 'hard', orderIndex: 5, createdAt: '' },
                { id: 'p7', quizId: 'practice-quiz', questionText: 'In which year did World War II end?', optionA: '1943', optionB: '1944', optionC: '1945', optionD: '1946', correctAnswer: 'C', difficulty: 'hard', orderIndex: 6, createdAt: '' },
                { id: 'p8', quizId: 'practice-quiz', questionText: 'What is the hardest natural substance on Earth?', optionA: 'Gold', optionB: 'Iron', optionC: 'Diamond', optionD: 'Platinum', correctAnswer: 'C', difficulty: 'medium', orderIndex: 7, createdAt: '' },
                { id: 'p9', quizId: 'practice-quiz', questionText: 'Which is the longest river in the world?', optionA: 'Amazon', optionB: 'Nile', optionC: 'Yangtze', optionD: 'Mississippi', correctAnswer: 'B', difficulty: 'hard', orderIndex: 8, createdAt: '' },
                { id: 'p10', quizId: 'practice-quiz', questionText: 'How many bones are in the adult human body?', optionA: '206', optionB: '208', optionC: '210', optionD: '212', correctAnswer: 'A', difficulty: 'hard', orderIndex: 9, createdAt: '' }
            ]);
            setLoading(false);
            return;
        }

        try {
            const quizData = await getQuiz(id);
            if (quizData) {
                setQuiz(quizData);
            }

            const questionsData = await getQuestions(id);
            setQuestions(questionsData);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        // Enter fullscreen mode
        try {
            await document.documentElement.requestFullscreen();
            setFullscreenGranted(true);
        } catch (err) {
            console.error('Error entering fullscreen:', err);
            alert('Please allow fullscreen mode to start the quiz.');
            return;
        }

        // Handle Practice Quiz - No DB
        if (id === 'practice-quiz') {
            setStarted(true);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
            return;
        }

        try {
            const newResponseId = await createResponse({
                quizId: id,
                studentName: name,
                studentEmail: email,
                score: 0,
                totalQuestions: questions.length,
                answers: [],
                startedAt: new Date().toISOString(),
                completedAt: null,
            });

            setResponseId(newResponseId);
            setStarted(true);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    };

    const requestPermissions = async () => {
        setPermissionError(null);

        try {
            // Request camera and microphone with specific constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true
            });

            setMediaStream(stream);
            setCameraGranted(true);
            setMicGranted(true);

            console.log('Permissions granted:', {
                video: stream.getVideoTracks().length > 0,
                audio: stream.getAudioTracks().length > 0
            });
        } catch (err: any) {
            console.error('Error requesting media permissions:', err);

            if (err.name === 'NotAllowedError') {
                setPermissionError('You must allow camera and microphone access to take this quiz. Please click "Allow" when prompted.');
            } else if (err.name === 'NotFoundError') {
                setPermissionError('No camera or microphone found. Please connect a device and try again.');
            } else {
                setPermissionError('Camera and microphone access is required. Error: ' + err.message);
            }
        }
    };

    // Monitor fullscreen and tab switching
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && started) {
                alert('Warning: Exiting fullscreen mode during a quiz may be considered cheating!');
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && started) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    alert(`Warning: Tab switching detected! Count: ${newCount}. This may be considered cheating.`);
                    return newCount;
                });
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [started]);

    // Cleanup media stream on unmount
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaStream]);

    const selectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
        if (showResult) return;
        setSelectedAnswer(answer);
    };

    const submitAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
        const currentQuestion = questions[currentIndex];
        const timeTaken = Date.now() - questionStartTime;
        const isCorrect = answer === currentQuestion.correctAnswer;

        const newAnswer: QuizAnswer = {
            questionId: currentQuestion.id,
            answer,
            isCorrect,
            timeTakenMs: timeTaken,
        };

        setAnswers([...answers, newAnswer]);
        setShowResult(true);
    };

    const nextQuestion = async () => {
        if (currentIndex + 1 >= questions.length) {
            // Complete quiz
            const score = answers.filter(a => a.isCorrect).length + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0);

            if (responseId && id !== 'practice-quiz') {
                await updateResponse(responseId, {
                    score,
                    answers: [...answers, {
                        questionId: questions[currentIndex].id,
                        answer: selectedAnswer || 'A',
                        isCorrect: selectedAnswer === questions[currentIndex].correctAnswer,
                        timeTakenMs: Date.now() - questionStartTime,
                    }],
                    completedAt: new Date().toISOString(),
                });
            }

            setCompleted(true);
        } else {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
        }
    };

    const getScore = () => answers.filter(a => a.isCorrect).length;
    const getPercentage = () => Math.round((getScore() / questions.length) * 100);

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="page">
                <div className="container text-center">
                    <h2>Quiz not found or has no questions</h2>
                    <Link to="/student" className="btn btn-primary mt-lg">
                        Browse Quizzes
                    </Link>
                </div>
            </div>
        );
    }

    // Student Info Form
    if (!started) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ width: '100%', maxWidth: '450px' }}
                >
                    <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>{quiz.title}</h2>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                        {questions.length} questions
                        {quiz.timerEnabled && ` • ${quiz.timerSeconds}s per question`}
                    </p>

                    <form onSubmit={startQuiz}>
                        {/* Permission Status */}
                        <div style={{
                            background: 'var(--bg-elevated)',
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Anti-Cheat Requirements</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Camera size={20} color={cameraGranted ? 'var(--accent-success)' : 'var(--text-muted)'} />
                                    <span style={{ flex: 1 }}>Camera Access</span>
                                    {cameraGranted ? (
                                        <CheckCircle size={20} color="var(--accent-success)" />
                                    ) : (
                                        <XCircle size={20} color="var(--text-muted)" />
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Mic size={20} color={micGranted ? 'var(--accent-success)' : 'var(--text-muted)'} />
                                    <span style={{ flex: 1 }}>Microphone Access</span>
                                    {micGranted ? (
                                        <CheckCircle size={20} color="var(--accent-success)" />
                                    ) : (
                                        <XCircle size={20} color="var(--text-muted)" />
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Maximize size={20} color="var(--text-muted)" />
                                    <span style={{ flex: 1 }}>Fullscreen Mode</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        (Activated on start)
                                    </span>
                                </div>
                            </div>

                            {!cameraGranted || !micGranted ? (
                                <button
                                    type="button"
                                    onClick={requestPermissions}
                                    className="btn btn-secondary w-full"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Grant Permissions
                                </button>
                            ) : null}

                            {permissionError && (
                                <p style={{ color: 'var(--accent-error)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                                    {permissionError}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="student@school.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={!cameraGranted || !micGranted}
                        >
                            Start Quiz
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // Completed
    if (completed) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card text-center"
                    style={{ width: '100%', maxWidth: '500px' }}
                >
                    <Trophy size={64} style={{ color: '#ffd700', margin: '0 auto 1rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>Quiz Complete!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Great job, {name}!
                    </p>

                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        {getPercentage()}%
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {getScore()} out of {questions.length} correct
                    </p>

                    {quiz.showResults && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Review</h4>
                            {answers.map((answer, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem',
                                        background: answer.isCorrect ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {answer.isCorrect ? (
                                        <CheckCircle size={18} color="var(--accent-success)" />
                                    ) : (
                                        <XCircle size={18} color="var(--accent-error)" />
                                    )}
                                    <span style={{ flex: 1, textAlign: 'left' }}>
                                        Q{i + 1}: {answer.isCorrect ? 'Correct' : `Wrong (${answer.answer})`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-md justify-center">
                        <Link to="/student" className="btn btn-primary">
                            <RotateCcw size={18} />
                            Take Another Quiz
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Quiz in progress
    const currentQuestion = questions[currentIndex];

    return (
        <div className="page">
            <div className="container container-md">
                {/* Progress Bar */}
                <div style={{ marginBottom: '2rem' }}>
                    <div className="flex justify-between items-center mb-sm">
                        <span style={{ color: 'var(--text-muted)' }}>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        {quiz.timerEnabled && (
                            <div className={`timer ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : ''}`}
                                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                {timeLeft}
                            </div>
                        )}
                    </div>
                    <div style={{
                        height: '8px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            style={{
                                height: '100%',
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-full)'
                            }}
                        />
                    </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="card mb-xl">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                {currentQuestion.questionText}
                            </h2>
                        </div>

                        {/* Answer Buttons */}
                        <div className="grid grid-2 gap-md mb-xl">
                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                const isSelected = selectedAnswer === letter;
                                const isCorrect = currentQuestion.correctAnswer === letter;
                                const showCorrectness = showResult;

                                return (
                                    <button
                                        key={letter}
                                        onClick={() => selectAnswer(letter)}
                                        disabled={showResult}
                                        className={`answer-btn answer-${letter.toLowerCase()} ${isSelected ? 'selected' : ''} ${showCorrectness && isCorrect ? 'correct' : ''
                                            } ${showCorrectness && isSelected && !isCorrect ? 'incorrect' : ''}`}
                                        style={{
                                            opacity: showCorrectness && !isCorrect && !isSelected ? 0.5 : 1,
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
                                        <span style={{ flex: 1, textAlign: 'left' }}>
                                            {currentQuestion[`option${letter}` as keyof Question]}
                                        </span>
                                        {showCorrectness && isCorrect && <CheckCircle size={24} />}
                                        {showCorrectness && isSelected && !isCorrect && <XCircle size={24} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit / Next Button */}
                        <div className="text-center">
                            {!showResult ? (
                                <button
                                    onClick={() => selectedAnswer && submitAnswer(selectedAnswer)}
                                    disabled={!selectedAnswer}
                                    className="btn btn-primary btn-lg"
                                >
                                    Submit Answer
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        background: selectedAnswer === currentQuestion.correctAnswer
                                            ? 'rgba(0, 255, 136, 0.1)'
                                            : 'rgba(255, 68, 68, 0.1)'
                                    }}>
                                        {selectedAnswer === currentQuestion.correctAnswer ? (
                                            <span style={{ color: 'var(--accent-success)', fontWeight: '600' }}>
                                                ✓ Correct!
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--accent-error)', fontWeight: '600' }}>
                                                ✗ Incorrect. The answer was {currentQuestion.correctAnswer}.
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={nextQuestion} className="btn btn-primary btn-lg">
                                        {currentIndex + 1 >= questions.length ? (
                                            <>
                                                <Trophy size={20} />
                                                See Results
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight size={20} />
                                                Next Question
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
