import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Bell, HelpCircle, Play, Edit2, Copy, BarChart2,
    BookOpen, AlertTriangle, X, ChevronDown,
    SlidersHorizontal,
} from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';

export interface QuizWithCount {
    id: string;
    title: string;
    isActive: boolean;
    questionCount?: number;
    subject?: string;
    attempts?: number;
    avgScore?: number;
    date?: string;
}

type StatusFilter = 'all' | 'active' | 'draft';

// Pure filter functions (exported for testing)
// eslint-disable-next-line react-refresh/only-export-components
export function filterQuizzesBySearch(quizzes: QuizWithCount[], query: string): QuizWithCount[] {
    if (!query.trim()) return quizzes;
    const lower = query.toLowerCase();
    return quizzes.filter(q => q.title.toLowerCase().includes(lower));
}

// eslint-disable-next-line react-refresh/only-export-components
export function filterQuizzesByStatus(quizzes: QuizWithCount[], status: StatusFilter): QuizWithCount[] {
    if (status === 'all') return quizzes;
    return quizzes.filter(q => (status === 'active' ? q.isActive : !q.isActive));
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
    Geography:   { bg: '#E0F2FE', text: '#0369A1' },
    Mathematics: { bg: '#FEF3C7', text: '#B45309' },
    Science:     { bg: '#EDE9FE', text: '#6D28D9' },
    History:     { bg: '#FCE7F3', text: '#9D174D' },
    English:     { bg: '#DCFCE7', text: '#166534' },
    Default:     { bg: '#F3F4F6', text: '#374151' },
};

const SCORE_COLORS = ['#10B981', '#FF5C1A', '#6366F1', '#F59E0B', '#3B82F6'];

const MOCK_QUIZZES: QuizWithCount[] = [
    { id: '1', title: 'World Geography: Capitals', isActive: true, subject: 'Geography',   questionCount: 25, attempts: 120, avgScore: 78, date: 'Oct 15, 2025' },
    { id: '2', title: 'Introduction to Algebra',  isActive: true, subject: 'Mathematics',  questionCount: 10, attempts: 45,  avgScore: 92, date: '2 days ago' },
    { id: '3', title: 'The Periodic Table',        isActive: true, subject: 'Science',      questionCount: 15, attempts: 88,  avgScore: 82, date: 'Oct 28, 2025' },
    { id: '4', title: 'World War II Overview',     isActive: false, subject: 'History',     questionCount: 20, attempts: 34,  avgScore: 71, date: 'Oct 10, 2025' },
    { id: '5', title: 'Shakespeare Sonnets',       isActive: false, subject: 'English',     questionCount: 12, attempts: 0,   avgScore: 0,  date: 'Oct 5, 2025' },
];

export function MyQuizzes() {
    const [quizzes, setQuizzes] = useState<QuizWithCount[]>(MOCK_QUIZZES);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter] = useState<StatusFilter>('all');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<'drafts' | 'templates' | 'settings'>('drafts');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const subjects = ['All', ...Array.from(new Set(MOCK_QUIZZES.map(q => q.subject || 'Other')))];

    const filtered = filterQuizzesByStatus(
        filterQuizzesBySearch(quizzes, searchQuery),
        statusFilter
    ).filter(q => subjectFilter === 'All' || q.subject === subjectFilter);

    const handleDelete = (id: string) => {
        setQuizzes(prev => prev.filter(q => q.id !== id));
        setShowDeleteConfirm(null);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>

            <TeacherSidebar />

            {/* ── Main ── */}
            <main style={{ flex: 1, marginLeft: '240px', padding: '0 2rem 2rem', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Top navbar */}
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '0 32px', height: 64,
                    background: '#fff', borderBottom: '1px solid #E5E7EB',
                    position: 'sticky', top: 0, zIndex: 50,
                }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FF5C1A', margin: 0, flex: 1 }}>My Quizzes</h1>

                    {/* Search */}
                    <div style={{ position: 'relative', width: 240 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search quizzes..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px 8px 34px',
                                border: '1px solid #E5E7EB', borderRadius: 8,
                                fontSize: 13, color: '#111827', background: '#F9FAFB',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
                        <Bell size={18} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
                        <HelpCircle size={18} />
                    </button>

                    <Link
                        to="/teacher/quiz/new"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            background: '#FF5C1A', color: '#fff',
                            padding: '9px 18px', borderRadius: 8,
                            fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                    >
                        <Plus size={15} />
                        Create New Quiz
                    </Link>
                </header>

                {/* Tab bar */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#EBEBEB', borderRadius: 12,
                    padding: 4, margin: '20px 32px 0', alignSelf: 'flex-start',
                }}>
                    {(['drafts', 'templates', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '7px 20px', borderRadius: 9, border: 'none',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                background: activeTab === tab ? '#FFFFFF' : 'transparent',
                                color: activeTab === tab ? '#111827' : '#6B7280',
                                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '24px 32px', flex: 1 }}>

                    {/* Filter bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        {/* Subject dropdown */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={subjectFilter}
                                onChange={e => setSubjectFilter(e.target.value)}
                                style={{
                                    appearance: 'none', padding: '7px 32px 7px 12px',
                                    border: '1px solid #E5E7EB', borderRadius: 8,
                                    fontSize: 13, fontWeight: 500, color: '#374151',
                                    background: '#fff', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                {subjects.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                        </div>

                        {/* Sort */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
                                fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', cursor: 'pointer',
                            }}>
                                <SlidersHorizontal size={13} color="#6B7280" />
                                Sort: Recent
                            </div>
                        </div>

                        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                            Showing {filtered.length} {filtered.length === 1 ? 'Quiz' : 'Quizzes'}
                        </div>
                    </div>

                    {/* Quiz grid */}
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                            <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <BookOpen size={26} color="#9CA3AF" />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                                {quizzes.length === 0 ? 'No quizzes yet' : 'No quizzes match your filters'}
                            </h3>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
                                {quizzes.length === 0 ? 'Create your first quiz to get started.' : 'Try adjusting your search or filter.'}
                            </p>
                            {quizzes.length === 0 && (
                                <Link to="/teacher/quiz/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FF5C1A', color: '#fff', padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                    <Plus size={15} /> Create Your First Quiz
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                            {filtered.map((quiz, i) => {
                                const subjectStyle = SUBJECT_COLORS[quiz.subject || ''] || SUBJECT_COLORS.Default;
                                const scoreColor = SCORE_COLORS[i % SCORE_COLORS.length];
                                const scoreWidth = quiz.avgScore ? `${quiz.avgScore}%` : '0%';

                                return (
                                    <motion.div
                                        key={quiz.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            background: '#fff',
                                            borderRight: '1px solid #E5E7EB',
                                            borderBottom: '1px solid #E5E7EB',
                                            padding: '24px 24px 20px',
                                            display: 'flex', flexDirection: 'column', gap: 16,
                                        }}
                                    >
                                        {/* Subject + date */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                                textTransform: 'uppercase', padding: '3px 8px',
                                                borderRadius: 4, background: subjectStyle.bg, color: subjectStyle.text,
                                            }}>
                                                {quiz.subject || 'General'}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{quiz.date}</span>
                                        </div>

                                        {/* Title */}
                                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                                            {quiz.title}
                                        </h3>

                                        {/* Stats row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {[
                                                { label: 'Questions', value: quiz.questionCount ?? 0 },
                                                { label: 'Attempts',  value: quiz.attempts ?? 0 },
                                            ].map(stat => (
                                                <div key={stat.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #F3F4F6' }}>
                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{stat.label}</div>
                                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{stat.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Avg score */}
                                        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #F3F4F6' }}>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Avg Score</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor }}>{quiz.avgScore ?? 0}%</span>
                                                <div style={{ width: 80, height: 3, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{ width: scoreWidth, height: '100%', background: scoreColor, borderRadius: 99 }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                                            <button
                                                onClick={() => setShowDeleteConfirm(quiz.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Duplicate">
                                                <Copy size={16} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Analytics">
                                                <BarChart2 size={16} />
                                            </button>
                                            <Link
                                                to={`/teacher/quiz/${quiz.id}/host`}
                                                style={{
                                                    marginLeft: 'auto',
                                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                                    background: '#FF5C1A', color: '#fff',
                                                    padding: '8px 18px', borderRadius: 20,
                                                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                                                }}
                                            >
                                                <Play size={13} fill="currentColor" />
                                                Live Session
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, background: '#FEF2F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={18} color="#EF4444" />
                                    </div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Delete Quiz</span>
                                </div>
                                <button onClick={() => setShowDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
                                Are you sure you want to delete this quiz? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(showDeleteConfirm)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
