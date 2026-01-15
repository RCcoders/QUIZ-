import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    getQuizzesByTeacher,
    updateQuiz,
    deleteQuiz as deleteQuizFromDb,
    getQuestions,
    type Quiz
} from '../lib/database';
import { QuizCard } from '../components/QuizCard';

interface QuizWithCount extends Quiz {
    questionCount?: number;
}

export function TeacherDashboard() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchQuizzes();
    }, [user]);

    const fetchQuizzes = async () => {
        if (!user) return;

        try {
            const data = await getQuizzesByTeacher(user.uid);

            // Fetch question counts for each quiz
            const quizzesWithCounts = await Promise.all(
                data.map(async (quiz) => {
                    const questions = await getQuestions(quiz.id);
                    return { ...quiz, questionCount: questions.length };
                })
            );

            setQuizzes(quizzesWithCounts);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (quiz: QuizWithCount) => {
        try {
            await updateQuiz(quiz.id, { isActive: !quiz.isActive });
            setQuizzes(quizzes.map(q =>
                q.id === quiz.id ? { ...q, isActive: !q.isActive } : q
            ));
        } catch (error) {
            console.error('Error toggling quiz:', error);
        }
    };

    const handleDeleteQuiz = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;

        setDeletingId(id);
        try {
            await deleteQuizFromDb(id);
            setQuizzes(quizzes.filter(q => q.id !== id));
        } catch (error) {
            console.error('Error deleting quiz:', error);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex justify-between items-center">
                    <div>
                        <h1 className="page-title">My Quizzes</h1>
                        <p className="page-subtitle">Create and manage your classroom quizzes</p>
                    </div>
                    <Link to="/teacher/quiz/new" className="btn btn-primary">
                        <Plus size={20} />
                        Create Quiz
                    </Link>
                </div>

                {quizzes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card text-center section-padding"
                    >
                        <HelpCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <h3 className="mb-sm">No quizzes yet</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Create your first quiz to get started!
                        </p>
                        <Link to="/teacher/quiz/new" className="btn btn-primary">
                            <Plus size={18} />
                            Create Your First Quiz
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-2">
                        {quizzes.map((quiz, index) => (
                            <QuizCard
                                key={quiz.id}
                                quiz={quiz}
                                index={index}
                                onToggleActive={toggleActive}
                                onDelete={handleDeleteQuiz}
                                deletingId={deletingId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

