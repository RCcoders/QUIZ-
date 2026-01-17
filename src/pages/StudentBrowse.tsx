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
            {/* Hero Section */}
            <section className="relative mb-2xl">
                <div className="container text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl font-bold mb-md bg-gradient-to-r from-sky-400 to-emerald-500 bg-clip-text text-transparent"
                            style={{
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '3.5rem',
                                marginBottom: '1rem'
                            }}>
                            Student Dashboard
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-xl" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                            Ready to challenge yourself? Pick a quiz below or join a live session with your class.
                        </p>

                        <Link to="/join" className="btn btn-primary btn-lg group">
                            <Users size={20} className="mr-2" />
                            Join Live Game
                        </Link>
                    </motion.div>
                </div>
            </section>

            <div className="container">
                <div className="flex items-center justify-between mb-lg">
                    <h2 className="text-2xl font-bold flex items-center gap-sm">
                        <BookOpen className="text-primary" />
                        Available Quizzes
                    </h2>
                    <span className="badge badge-active">
                        {quizzes.length > 0 ? `${quizzes.length} Active` : 'Practice Mode'}
                    </span>
                </div>

                {quizzes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-1 max-w-2xl mx-auto"
                    >
                        <Link
                            to="/student/quiz/practice-quiz"
                            className="card group hover:border-primary transition-all duration-300"
                            style={{
                                border: '2px dashed var(--text-muted)',
                                background: 'var(--gradient-card)'
                            }}
                        >
                            <div className="flex flex-col items-center text-center p-lg">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-md"
                                    style={{ background: 'var(--accent-primary-glow)', borderRadius: '50%', width: '64px', height: '64px', marginBottom: '1.5rem' }}>
                                    <HelpCircle size={32} className="text-blue-400" style={{ color: 'var(--accent-primary)' }} />
                                </div>

                                <h3 className="text-2xl font-bold mb-sm">General Knowledge Practice</h3>
                                <p className="text-gray-400 mb-lg max-w-md">
                                    No active quizzes from your teacher right now? Keep your mind sharp with our 10-question general knowledge challenge!
                                </p>

                                <div className="flex gap-xl text-sm font-medium text-gray-300">
                                    <span className="flex items-center gap-xs">
                                        <HelpCircle size={16} className="mr-1" /> 10 Questions
                                    </span>
                                    <span className="flex items-center gap-xs">
                                        <Clock size={16} className="mr-1" /> 30s / question
                                    </span>
                                </div>

                                <div className="mt-lg btn btn-secondary w-full max-w-xs">
                                    Start Practice Quiz
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-2 gap-lg">
                        {quizzes.map((quiz, index) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/student/quiz/${quiz.id}`}
                                    className="card h-full flex flex-col hover:transform hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="card-header">
                                        <div className="flex-1">
                                            <h3 className="card-title text-xl mb-xs line-clamp-1">{quiz.title}</h3>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full border"
                                                style={{ background: 'rgba(0, 223, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(0, 223, 129, 0.2)', borderRadius: '9999px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                Active Now
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary"
                                            style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', borderRadius: '0.5rem', width: '40px', height: '40px' }}>
                                            <BookOpen size={20} />
                                        </div>
                                    </div>

                                    {quiz.description && (
                                        <p className="text-gray-400 text-sm mb-lg line-clamp-2 flex-1">
                                            {quiz.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-md border-t border-white/5"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <div className="flex gap-md text-sm text-gray-400">
                                            <span className="flex items-center gap-xs">
                                                <HelpCircle size={14} className="mr-1" />
                                                {quiz.questionCount} Qs
                                            </span>
                                            {quiz.timerEnabled && (
                                                <span className="flex items-center gap-xs">
                                                    <Clock size={14} className="mr-1" />
                                                    {quiz.timerSeconds}s
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-primary text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                            Start <span className="ml-1">→</span>
                                        </span>
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
