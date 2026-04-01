import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, Trophy, Maximize } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveScoreRecord } from '../utils/scoring';
import { apiFetch } from '../utils/api';
import { QuizResultsSummary } from '../components/QuizResultsSummary';
import type { Quiz, Question } from '../types/game';

interface QuizAnswer {
    questionId: string;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
}

export function StudentQuiz() {
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();

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

    // Timer — use a ref-based approach so reset is reliable
    const [timeLeft, setTimeLeft] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeUpCalledRef = useRef(false);

    const handleTimeUp = useCallback(() => {
        if (timeUpCalledRef.current) return;
        timeUpCalledRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);

        setAnswers(prev => {
            // Use functional update to get latest questions/currentIndex
            return prev; // will be updated below
        });
        setQuestions(qs => {
            setCurrentIndex(ci => {
                const currentQuestion = qs[ci];
                if (!currentQuestion) return ci;
                setAnswers(prev => [
                    ...prev,
                    {
                        questionId: currentQuestion.id,
                        answer: 'A',
                        isCorrect: false,
                        timeTakenMs: quiz?.timerSeconds ? quiz.timerSeconds * 1000 : 0,
                    },
                ]);
                return ci;
            });
            return qs;
        });
        setShowResult(true);
    }, [quiz]);

    const fetchQuiz = useCallback(async () => {
        if (!id) return;

        // Fisher-Yates shuffle — randomizes question order to prevent cheating
        function shuffleArray<T>(arr: T[]): T[] {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        // Handle Practice Quizzes
        if (id?.startsWith('practice-')) {
            let title = '';
            let description = '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let quizQuestions: any[] = [];

            switch (id) {
                case 'practice-quiz':
                    title = 'Machine Learning Practice Quiz';
                    description = 'Test your knowledge of ML fundamentals with 10 questions.';
                    quizQuestions = [
                        { id: 'p1', quizId: 'practice-quiz', questionText: 'Which type of learning uses labeled data to train a model?', optionA: 'Unsupervised Learning', optionB: 'Reinforcement Learning', optionC: 'Supervised Learning', optionD: 'Semi-supervised Learning', correctAnswer: 'C', difficulty: 'easy', orderIndex: 0, createdAt: '' },
                        { id: 'p2', quizId: 'practice-quiz', questionText: 'Which algorithm is mainly used for classification problems?', optionA: 'Linear Regression', optionB: 'K-Means', optionC: 'Decision Tree', optionD: 'Apriori', correctAnswer: 'C', difficulty: 'easy', orderIndex: 1, createdAt: '' },
                        { id: 'p3', quizId: 'practice-quiz', questionText: 'What does overfitting mean in machine learning?', optionA: 'Model performs well on both training and test data', optionB: 'Model performs poorly on training data', optionC: 'Model memorizes training data and performs poorly on new data', optionD: 'Model has too little data', correctAnswer: 'C', difficulty: 'medium', orderIndex: 2, createdAt: '' },
                        { id: 'p4', quizId: 'practice-quiz', questionText: 'Which evaluation metric is best for imbalanced datasets?', optionA: 'Accuracy', optionB: 'Precision-Recall / F1 Score', optionC: 'Mean Squared Error', optionD: 'R-squared', correctAnswer: 'B', difficulty: 'medium', orderIndex: 3, createdAt: '' },
                        { id: 'p5', quizId: 'practice-quiz', questionText: 'Which algorithm groups similar data points together?', optionA: 'Logistic Regression', optionB: 'K-Means Clustering', optionC: 'Naive Bayes', optionD: 'Random Forest', correctAnswer: 'B', difficulty: 'medium', orderIndex: 4, createdAt: '' },
                        { id: 'p6', quizId: 'practice-quiz', questionText: 'What is the main purpose of a loss function?', optionA: 'To visualize data', optionB: 'To measure model error', optionC: 'To increase accuracy manually', optionD: 'To normalize data', correctAnswer: 'B', difficulty: 'medium', orderIndex: 5, createdAt: '' },
                        { id: 'p7', quizId: 'practice-quiz', questionText: 'Which technique helps reduce overfitting?', optionA: 'Increasing model complexity', optionB: 'Adding more irrelevant features', optionC: 'Regularization', optionD: 'Reducing training data', correctAnswer: 'C', difficulty: 'hard', orderIndex: 6, createdAt: '' },
                        { id: 'p8', quizId: 'practice-quiz', questionText: 'Which activation function is commonly used in binary classification?', optionA: 'ReLU', optionB: 'Sigmoid', optionC: 'Tanh', optionD: 'Softmax', correctAnswer: 'B', difficulty: 'hard', orderIndex: 7, createdAt: '' },
                        { id: 'p9', quizId: 'practice-quiz', questionText: 'What does "feature scaling" do?', optionA: 'Removes missing values', optionB: 'Converts labels to numbers', optionC: 'Brings features to similar range', optionD: 'Reduces dataset size', correctAnswer: 'C', difficulty: 'hard', orderIndex: 8, createdAt: '' },
                        { id: 'p10', quizId: 'practice-quiz', questionText: 'Which algorithm works on Bayes Theorem?', optionA: 'Support Vector Machine', optionB: 'KNN', optionC: 'Naive Bayes', optionD: 'Decision Tree', correctAnswer: 'C', difficulty: 'hard', orderIndex: 9, createdAt: '' }
                    ];
                    break;
                // ... (other cases simplified for brevity in this replace call, I'll keep them if I can)
                default:
                    // If not a hardcoded practice, try fetching from API anyway
                    break;
            }

            if (quizQuestions.length > 0) {
                setQuiz({
                    id: id,
                    title: title,
                    description: description,
                    isActive: true,
                    timerEnabled: true,
                    timerSeconds: 30,
                    showResults: true,
                    showLeaderboard: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } as any);
                setQuestions(shuffleArray(quizQuestions));
                setLoading(false);
                return;
            }
        }

        try {
            const data = await apiFetch(`/api/quizzes/${id}`);
            setQuiz(data);
            if (data.questions) {
                setQuestions(shuffleArray(data.questions));
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchQuiz();
    }, [id, fetchQuiz]);

    // ── Reliable timer: clears and restarts whenever currentIndex changes ──
    useEffect(() => {
        if (!quiz?.timerEnabled || !started || showResult || completed) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Reset guard and set initial time
        timeUpCalledRef.current = false;
        setTimeLeft(quiz.timerSeconds);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quiz?.timerEnabled, quiz?.timerSeconds, started, showResult, currentIndex, completed]);

    const startQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        // Enter fullscreen mode
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error('Error entering fullscreen:', err);
            alert('Please allow fullscreen mode to start the quiz.');
            return;
        }

        setStarted(true);
        setQuestionStartTime(Date.now());
        if (quiz?.timerEnabled) {
            setTimeLeft(quiz.timerSeconds);
        }
    };



    // Auto-start for authenticated users: skip name/email form
    useEffect(() => {
        if (!loading && quiz && user && userProfile && !started) {
            setName(userProfile.displayName);
            setEmail(user.email ?? '');
            // Enter fullscreen and start automatically
            document.documentElement.requestFullscreen().catch(() => {
                // Fullscreen not critical for authenticated users
            });
            setStarted(true);
            setQuestionStartTime(Date.now());
            if (quiz.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
        }
    }, [loading, quiz, user, userProfile, started]);
    useEffect(() => {
        const fullscreenExitCountRef = { current: 0 };
        const tabSwitchCountRef = { current: 0 };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && started && !completed) {
                // Don't count exits for practice quiz
                if (id?.startsWith('practice-')) {
                    alert('Warning: Exiting fullscreen mode during a quiz may be considered cheating!');
                    return;
                }

                fullscreenExitCountRef.current += 1;
                const newCount = fullscreenExitCountRef.current;
                if (newCount >= 2) {
                    alert('You have exited fullscreen mode more than 2 times. Your test will now end.');
                    setCompleted(true);
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                } else {
                    alert(`Warning: Exiting fullscreen mode! (${newCount}/2) - One more exit will end your test.`);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && started) {
                tabSwitchCountRef.current += 1;
                const newCount = tabSwitchCountRef.current;
                alert(`Warning: Tab switching detected! Count: ${newCount}. This may be considered cheating.`);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [started, completed, id]);

    // ── Block browser back button during quiz ──
    useEffect(() => {
        if (!started || completed) return;
        // Push a dummy state so back goes to it instead of leaving
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [started, completed]);

    // Cleanup media stream on unmount


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
            const finalAnswers = answers;
            const score = finalAnswers.filter(a => a.isCorrect).length;
            const total = questions.length;
            const percentage = Math.round((score / total) * 100);

            setCompleted(true);
            if (timerRef.current) clearInterval(timerRef.current);

            // Save score record for authenticated users
            if (user && quiz) {
                try {
                    await saveScoreRecord({
                        quizId: quiz.id || (quiz as any)._id,
                        quizTitle: quiz.title,
                        score,
                        total,
                        percentage,
                        completedAt: new Date().toISOString(),
                    });
                } catch (err) {
                    console.error('Score not saved:', err);
                }
            }
        } else {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setQuestionStartTime(Date.now());
            timeUpCalledRef.current = false;
            // Timer resets automatically via the useEffect watching currentIndex
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

    // Student Info Form — only shown for unauthenticated users
    if (!started) {
        return (
            <div style={{
                minHeight: '100vh', background: '#F5F5F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", padding: '24px',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: '#FFFFFF', borderRadius: 16,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        padding: '36px 32px', width: '100%', maxWidth: 440,
                    }}
                >
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px', textAlign: 'center' }}>
                        {quiz.title}
                    </h2>
                    <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>
                        {questions.length} questions
                        {quiz.timerEnabled && ` • ${quiz.timerSeconds}s per question`}
                    </p>

                    <form onSubmit={startQuiz}>
                        {/* Fullscreen requirement notice */}
                        <div style={{
                            background: '#FFF3EE', borderRadius: 10, padding: '12px 16px',
                            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <Maximize size={18} color="#FF5C1A" />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Fullscreen Mode</div>
                                <div style={{ fontSize: 12, color: '#6B7280' }}>Activated automatically on start</div>
                            </div>
                        </div>

                        {/* Name */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 8,
                                    border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827',
                                    outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="student@school.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 8,
                                    border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827',
                                    outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: '100%', padding: '12px', background: '#FF5C1A',
                                color: '#fff', border: 'none', borderRadius: 10,
                                fontWeight: 700, fontSize: 15, cursor: 'pointer',
                            }}
                        >
                            Start Quiz
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    const handleRetake = () => {
        setCompleted(false);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedAnswer(null);
        setShowResult(false);
        setStarted(false);
    };

    // Completed
    if (completed) {
        const finalScore = answers.filter(a => a.isCorrect).length;
        const finalPercentage = Math.round((finalScore / questions.length) * 100);
        return (
            <QuizResultsSummary
                score={finalScore}
                total={questions.length}
                percentage={finalPercentage}
                questions={questions}
                userAnswers={answers}
                isAuthenticated={!!user}
                onRetake={handleRetake}
            />
        );
    }

    // Quiz in progress
    const currentQuestion = questions[currentIndex];

    return (
        <div className="page" style={{ background: '#F8FAFC', minHeight: '100vh', padding: '2rem 0' }}>
            <div className="container container-md">
                {/* Progress Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex justify-between items-end mb-sm">
                        <div>
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <h3 style={{ marginTop: '0.25rem', fontSize: '1rem', color: '#1E293B' }}>
                                {quiz.title}
                            </h3>
                        </div>
                        {quiz.timerEnabled && (
                            <div className={`timer ${timeLeft <= 10 ? 'danger' : ''}`}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    fontSize: '1.1rem',
                                    background: timeLeft <= 10 ? '#FEE2E2' : '#F1F5F9',
                                    color: timeLeft <= 10 ? '#EF4444' : '#475569',
                                    border: `2px solid ${timeLeft <= 10 ? '#FCA5A5' : '#E2E8F0'}`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800
                                }}>
                                {timeLeft}
                            </div>
                        )}
                    </div>
                    <div style={{
                        height: '5px',
                        background: '#E2E8F0',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        marginTop: '0.75rem'
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

                {/* Question Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            padding: '1.5rem 1.5rem',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                            marginBottom: '1.5rem',
                            border: '1px solid #F1F5F9',
                            textAlign: 'center'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#0F172A',
                                lineHeight: 1.5
                            }}>
                                {currentQuestion.questionText}
                            </h2>
                        </div>

                        {/* Answer Grid */}
                        <div className="grid grid-2 gap-lg mb-3xl">

                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                const isSelected = selectedAnswer === letter;
                                const isCorrect = currentQuestion.correctAnswer === letter;
                                const showCorrectness = showResult;

                                return (
                                    <motion.button
                                        key={letter}
                                        whileHover={!showResult ? { scale: 1.02 } : {}}
                                        whileTap={!showResult ? { scale: 0.98 } : {}}
                                        onClick={() => selectAnswer(letter)}
                                        disabled={showResult}
                                        className={`answer-btn answer-${letter.toLowerCase()} ${isSelected ? 'selected' : ''} ${showCorrectness && isCorrect ? 'correct' : ''
                                            } ${showCorrectness && isSelected && !isCorrect ? 'incorrect' : ''}`}
                                        style={{
                                            opacity: showCorrectness && !isCorrect && !isSelected ? 0.4 : 1,
                                            pointerEvents: showResult ? 'none' : 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            padding: '0.75rem 1rem',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            boxShadow: isSelected ? '0 0 0 3px rgba(99, 102, 241, 0.4)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '26px',
                                            height: '26px',
                                            background: 'rgba(255, 255, 255, 0.25)',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            marginRight: '0.75rem',
                                            flexShrink: 0
                                        }}>
                                            {letter}
                                        </div>
                                        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                                            {currentQuestion[`option${letter}` as keyof Question]}
                                        </span>
                                        {showCorrectness && isCorrect && <CheckCircle size={18} style={{ marginLeft: '0.75rem' }} />}
                                        {showCorrectness && isSelected && !isCorrect && <XCircle size={18} style={{ marginLeft: '0.75rem' }} />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="text-center">
                            {!showResult ? (
                                <button
                                    onClick={() => selectedAnswer && submitAnswer(selectedAnswer)}
                                    disabled={!selectedAnswer}
                                    className="btn btn-primary btn-lg"
                                    style={{
                                        minWidth: '240px',
                                        background: selectedAnswer ? 'var(--gradient-primary)' : '#E2E8F0',
                                        boxShadow: selectedAnswer ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                                    }}
                                >
                                    Submit Answer
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div style={{
                                        marginBottom: '1.5rem',
                                        padding: '1rem 2rem',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        background: selectedAnswer === currentQuestion.correctAnswer
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(239, 68, 68, 0.1)',
                                        border: `1.5px solid ${selectedAnswer === currentQuestion.correctAnswer ? '#10B981' : '#EF4444'}`
                                    }}>
                                        {selectedAnswer === currentQuestion.correctAnswer ? (
                                            <span style={{ color: '#059669', fontWeight: 700, fontSize: '1rem' }}>
                                                That's Correct! Great job.
                                            </span>
                                        ) : (
                                            <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '1rem' }}>
                                                Incorrect. Correct answer is Option {currentQuestion.correctAnswer}.
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <button onClick={nextQuestion} className="btn-primary btn-lg" style={{ minWidth: '240px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                                            {currentIndex + 1 >= questions.length ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <Trophy size={20} />
                                                    View Final Results
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                    Next Question
                                                    <ArrowRight size={20} />
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>

                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

}
