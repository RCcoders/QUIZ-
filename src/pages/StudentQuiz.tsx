import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
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

            if (responseId) {
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

                        <button type="submit" className="btn btn-primary btn-lg w-full">
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
