import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, RotateCcw, BookOpen } from 'lucide-react';
import { getPerformanceLabel } from '../utils/scoring';

interface Question {
    id: string;
    quizId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    difficulty: 'easy' | 'medium' | 'hard';
    orderIndex: number;
    createdAt: string;
}

interface QuizAnswer {
    questionId: string;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
}

export interface QuizResultsSummaryProps {
    score: number;
    total: number;
    percentage: number;
    questions: Question[];
    userAnswers: QuizAnswer[];
    isAuthenticated: boolean;
    onRetake: () => void;
}

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
    Excellent: { bg: '#D1FAE5', text: '#065F46' },
    Good: { bg: '#DBEAFE', text: '#1E40AF' },
    'Keep Practicing': { bg: '#FEE2E2', text: '#991B1B' },
};

export function QuizResultsSummary({
    score,
    total,
    percentage,
    questions,
    userAnswers,
    isAuthenticated,
    onRetake,
}: QuizResultsSummaryProps) {
    const label = getPerformanceLabel(percentage);
    const labelStyle = LABEL_COLORS[label];

    return (
        <div
            data-testid="quiz-results-summary"
            style={{
                minHeight: '100vh',
                background: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                padding: '24px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: '36px 32px',
                    width: '100%',
                    maxWidth: 520,
                    textAlign: 'center',
                }}
            >
                {/* Header */}
                <Trophy size={56} style={{ color: '#FF5C1A', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                    Quiz Complete!
                </h2>

                {/* Score: percentage */}
                <div
                    data-testid="score-percentage"
                    style={{ fontSize: 56, fontWeight: 800, color: '#FF5C1A', lineHeight: 1, marginBottom: 4 }}
                >
                    {percentage}%
                </div>

                {/* Score: fraction */}
                <p
                    data-testid="score-fraction"
                    style={{ color: '#6B7280', marginBottom: 16, fontSize: 14 }}
                >
                    {score} / {total}
                </p>

                {/* Performance badge */}
                <span
                    data-testid="performance-badge"
                    style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        background: labelStyle.bg,
                        color: labelStyle.text,
                        marginBottom: 24,
                    }}
                >
                    {label}
                </span>

                {/* Score saved message */}
                {isAuthenticated && (
                    <div
                        data-testid="score-saved-message"
                        style={{
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 8,
                            padding: '10px 16px',
                            marginBottom: 24,
                            fontSize: 13,
                            color: '#166534',
                            fontWeight: 500,
                        }}
                    >
                        ✓ Score saved to your profile
                    </div>
                )}

                {/* Question review */}
                <div style={{ textAlign: 'left', marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, textAlign: 'center' }}>
                        Review Your Answers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {questions.map((q, i) => {
                            const userAnswer = userAnswers.find(a => a.questionId === q.id);
                            const isCorrect = userAnswer?.isCorrect;
                            const userSelectedOption = userAnswer?.answer;

                            return (
                                <div
                                    key={q.id}
                                    data-testid={`question-review-${i}`}
                                    style={{
                                        background: '#FAFAFA',
                                        borderRadius: 10,
                                        padding: '12px 16px',
                                        borderLeft: `4px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                                            {isCorrect
                                                ? <CheckCircle size={18} color="#10B981" />
                                                : <XCircle size={18} color="#EF4444" />
                                            }
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 13, margin: '0 0 6px' }}>
                                                {i + 1}. {q.questionText}
                                            </p>
                                            {/* Student's answer */}
                                            <div
                                                data-testid={`user-answer-${i}`}
                                                style={{ fontSize: 12, color: isCorrect ? '#10B981' : '#EF4444' }}
                                            >
                                                <span style={{ fontWeight: 600 }}>Your Answer: </span>
                                                {userSelectedOption
                                                    ? <>{userSelectedOption}: {q[`option${userSelectedOption}` as keyof typeof q]}</>
                                                    : 'Skipped'
                                                }
                                            </div>
                                            {/* Correct answer — only shown when wrong */}
                                            {!isCorrect && (
                                                <div
                                                    data-testid={`correct-answer-${i}`}
                                                    style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>Correct: </span>
                                                    {q.correctAnswer}: {q[`option${q.correctAnswer}` as keyof typeof q]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        data-testid="retake-quiz-button"
                        onClick={onRetake}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#FF5C1A',
                            color: '#fff',
                            padding: '11px 24px',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 14,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <RotateCcw size={16} />
                        Retake Quiz
                    </button>

                    <Link
                        data-testid="browse-quizzes-link"
                        to="/student"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#F3F4F6',
                            color: '#374151',
                            padding: '11px 24px',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        <BookOpen size={16} />
                        Browse More Quizzes
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
