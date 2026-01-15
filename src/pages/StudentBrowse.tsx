import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, HelpCircle, Users } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { getActiveQuizzes, getQuestions, type Quiz } from '../lib/database';

interface QuizWithCount extends Quiz {
    questionCount: number;
}

export function StudentBrowse() {
    const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 2;

    useEffect(() => {
        fetchActiveQuizzes();
    }, []);

    const fetchActiveQuizzes = async (isRetry = false) => {
        try {
            setError(null);
            if (!isRetry) {
                setRetryCount(0);
            }

            // Check if Supabase is properly configured
            if (!isSupabaseConfigured) {
                setError('Database not configured. Please check your Supabase credentials in the .env file.');
                setLoading(false);
                return;
            }

            // Increased timeout to 15 seconds for cold starts
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out')), 15000)
            );

            const queryPromise = getActiveQuizzes();

            const data = await Promise.race([queryPromise, timeoutPromise]);

            // Fetch question counts for each quiz
            const quizzesWithCount = await Promise.all(
                data.map(async (quiz) => {
                    const questions = await getQuestions(quiz.id);
                    return { ...quiz, questionCount: questions.length };
                })
            );

            setQuizzes(quizzesWithCount);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching quizzes:', err);

            // Auto-retry on timeout
            if (err instanceof Error && err.message === 'Connection timed out' && retryCount < MAX_RETRIES) {
                console.log(`Connection timeout, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                setRetryCount(prev => prev + 1);
                setTimeout(() => fetchActiveQuizzes(true), 1000);
                return;
            }

            if (err instanceof Error && err.message === 'Connection timed out') {
                setError('Connection timed out. Please check your internet connection and try again.');
            } else {
                setError('Failed to load quizzes. Please try again later.');
            }
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                    {retryCount > 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Connecting to database... (attempt {retryCount + 1}/{MAX_RETRIES + 1})
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="card text-center" style={{ padding: '2rem', maxWidth: '400px' }}>
                    <h3 style={{ color: 'var(--accent-error)', marginBottom: '1rem' }}>Connection Error</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
                    <button onClick={() => { setLoading(true); fetchActiveQuizzes(); }} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header text-center">
                    <h1 className="page-title">Available Quizzes</h1>
                    <p className="page-subtitle">Choose a quiz to test your knowledge</p>
                    <Link to="/join" className="btn btn-secondary mt-lg">
                        <Users size={18} />
                        Join Live Game Instead
                    </Link>
                </div>

                {quizzes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card text-center section-padding"
                    >
                        <HelpCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <h3 className="mb-sm">No quizzes available</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Check back later or ask your teacher to activate a quiz
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-2">
                        {quizzes.map((quiz, index) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/student/quiz/${quiz.id}`}
                                    className="card h-full block hover:translate-y-[-4px] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-md">
                                        <div>
                                            <h3 className="mb-xs text-primary">
                                                {quiz.title}
                                            </h3>
                                            <span className="badge badge-active">Active</span>
                                        </div>
                                        <BookOpen size={24} className="text-primary-accent" />
                                    </div>

                                    {quiz.description && (
                                        <p className="quiz-description mb-md">
                                            {quiz.description}
                                        </p>
                                    )}

                                    <div className="flex gap-lg text-muted text-sm">
                                        <span className="flex items-center gap-sm">
                                            <HelpCircle size={16} />
                                            {quiz.questionCount} questions
                                        </span>
                                        {quiz.timerEnabled && (
                                            <span className="flex items-center gap-sm">
                                                <Clock size={16} />
                                                {quiz.timerSeconds}s per question
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

