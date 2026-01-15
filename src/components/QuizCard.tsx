import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Play, BarChart2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Quiz } from '../lib/database';

interface QuizWithCount extends Quiz {
    questionCount?: number;
}

interface QuizCardProps {
    quiz: QuizWithCount;
    index: number;
    onToggleActive: (quiz: QuizWithCount) => void;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

export function QuizCard({ quiz, index, onToggleActive, onDelete, deletingId }: QuizCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card card-content-gap"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="mb-sm">{quiz.title}</h3>
                    <div className="flex gap-sm items-center">
                        <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {quiz.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {quiz.questionCount || 0} questions
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onToggleActive(quiz)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: quiz.isActive ? 'var(--accent-success)' : 'var(--text-muted)'
                    }}
                    title={quiz.isActive ? 'Deactivate' : 'Activate'}
                >
                    {quiz.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
            </div>

            {quiz.description && (
                <p className="quiz-description">
                    {quiz.description}
                </p>
            )}

            <div className="card-actions">
                <Link
                    to={`/teacher/quiz/${quiz.id}/host`}
                    className="btn btn-primary btn-sm"
                >
                    <Play size={16} />
                    Host Live
                </Link>
                <Link
                    to={`/teacher/quiz/${quiz.id}/edit`}
                    className="btn btn-secondary btn-sm"
                >
                    <Edit size={16} />
                    Edit
                </Link>
                <Link
                    to={`/teacher/quiz/${quiz.id}/results`}
                    className="btn btn-secondary btn-sm"
                >
                    <BarChart2 size={16} />
                    Results
                </Link>
                <button
                    onClick={() => onDelete(quiz.id)}
                    className="btn btn-danger btn-sm"
                    disabled={deletingId === quiz.id}
                >
                    {deletingId === quiz.id ? (
                        <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    ) : (
                        <Trash2 size={16} />
                    )}
                </button>
            </div>
        </motion.div>
    );
}
