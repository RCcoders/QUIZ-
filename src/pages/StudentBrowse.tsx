import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BookOpen, Clock, HelpCircle, Search } from 'lucide-react';
import { StudentNavbar } from '../components/StudentNavbar';
import { filterQuizzes } from '../utils/quizFilter';

const practiceQuizzes = [
    {
        id: 'practice-quiz',
        title: 'Machine Learning Practice',
        description: 'Test your ML fundamentals with 10 questions.',
        color: '#3B82F6',
        bg: '#EFF6FF',
    },
    {
        id: 'practice-sql',
        title: 'SQL Fundamentals',
        description: 'Master database queries with 10 SQL questions.',
        color: '#10B981',
        bg: '#ECFDF5',
    },
    {
        id: 'practice-nn',
        title: 'Neural Networks',
        description: 'Deep dive into neurons, layers, and training.',
        color: '#8B5CF6',
        bg: '#F5F3FF',
    },
    {
        id: 'practice-vcs',
        title: 'Version Control (Git)',
        description: 'Check your Git command knowledge.',
        color: '#FF5C1A',
        bg: '#FFF3EE',
    },
];

export function StudentBrowse() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredQuizzes = filterQuizzes(practiceQuizzes, searchQuery);

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
            <Helmet>
                <title>Student Dashboard — QuizMaster</title>
                <meta name="description" content="View your quiz history, scores, and streaks on your QuizMaster student dashboard." />
            </Helmet>
            <StudentNavbar />

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 40, textAlign: 'center' }}
                >
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
                        Student Dashboard
                    </h1>
                    <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                        Ready to challenge yourself? Pick a quiz below or join a live session.
                    </p>
                </motion.div>

                {/* Search input */}
                <div style={{ marginBottom: 28, position: 'relative', maxWidth: 420 }}>
                    <Search
                        size={16}
                        color="#9CA3AF"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                        type="text"
                        placeholder="Search quizzes…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search quizzes"
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 36px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 10,
                            fontSize: 14,
                            color: '#111827',
                            background: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <BookOpen size={20} color="#FF5C1A" />
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Practice Quizzes</h2>
                    <span style={{
                        background: '#FFF3EE', color: '#FF5C1A', borderRadius: 20,
                        padding: '2px 10px', fontSize: 12, fontWeight: 700,
                    }}>
                        Practice Mode
                    </span>
                </div>

                {/* Quiz grid */}
                {filteredQuizzes.length === 0 ? (
                    <p style={{ color: '#6B7280', fontSize: 15 }}>No quizzes match your search.</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 20,
                    }}>
                        {filteredQuizzes.map((quiz, index) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.08 }}
                            >
                                <Link
                                    to={`/student/quiz/${quiz.id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 14,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                        padding: 24,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.15s, transform 0.15s',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: quiz.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: 16,
                                        }}>
                                            <HelpCircle size={24} color={quiz.color} />
                                        </div>

                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                                            {quiz.title}
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
                                            {quiz.description}
                                        </p>

                                        {/* Meta */}
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <HelpCircle size={13} /> 10 Qs
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={13} /> 30s
                                            </span>
                                        </div>

                                        {/* CTA */}
                                        <div style={{
                                            width: '100%',
                                            background: '#FF5C1A',
                                            color: '#fff',
                                            borderRadius: 8,
                                            padding: '9px 0',
                                            fontWeight: 600,
                                            fontSize: 13,
                                            marginTop: 'auto',
                                        }}>
                                            Start Quiz
                                        </div>
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
