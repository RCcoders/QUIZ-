import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Bell, HelpCircle, Play, Edit2, Copy, BarChart2,
    BookOpen, AlertTriangle, X, ChevronDown, CheckCircle, Save, Clock,
    SlidersHorizontal, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSidebar } from '../components/TeacherSidebar';



export interface QuizWithCount {
    _id: string;
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
    Geography: { bg: '#E0F2FE', text: '#0369A1' },
    Mathematics: { bg: '#FEF3C7', text: '#B45309' },
    Science: { bg: '#EDE9FE', text: '#6D28D9' },
    History: { bg: '#FCE7F3', text: '#9D174D' },
    English: { bg: '#DCFCE7', text: '#166534' },
    Default: { bg: '#F3F4F6', text: '#374151' },
};

const SCORE_COLORS = ['#10B981', '#FF5C1A', '#6366F1', '#F59E0B', '#3B82F6'];

const MOCK_TEMPLATES = [
    { _id: 't1', title: 'Math 101 Midterm', subject: 'Mathematics', questionCount: 20, desc: 'A comprehensive midterm covering algebra and geometry.' },
    { _id: 't2', title: 'Biology Cell Structure', subject: 'Science', questionCount: 15, desc: 'Standardized assessment on plant and animal cells.' },
    { _id: 't3', title: 'US History: Civil War', subject: 'History', questionCount: 10, desc: 'Quick formative assessment template for the Civil War unit.' },
];



export async function fetchMyQuizzes(): Promise<QuizWithCount[]> {
    return apiFetch('/api/quizzes/teacher/my-quizzes');
}


export function MyQuizzes() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: quizzes = [], isLoading, isError, error } = useQuery({
        queryKey: ['quizzes', 'my', user?._id],
        queryFn: fetchMyQuizzes,
        enabled: !!user,
        retry: 1, // Don't retry indefinitely on 403
    });


    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<'quizzes' | 'drafts' | 'templates' | 'settings'>('quizzes');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title' | 'score'>('recent');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const subjects = ['All', ...Array.from(new Set(quizzes.map(q => q.subject || 'Other')))];


    let processedQuizzes = filterQuizzesBySearch(quizzes, searchQuery)
        .filter(q => subjectFilter === 'All' || q.subject === subjectFilter);

    if (activeTab === 'quizzes') {
        processedQuizzes = processedQuizzes.filter(q => q.isActive);
    } else if (activeTab === 'drafts') {
        processedQuizzes = processedQuizzes.filter(q => !q.isActive);
    }

    processedQuizzes.sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'score') return (b.avgScore || 0) - (a.avgScore || 0);

        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (sortBy === 'oldest') return (dateA || 1) - (dateB || 0);
        return (dateB || 1) - (dateA || 0);
    });

    const filtered = processedQuizzes;

    const { mutate: deleteQuiz } = useMutation({
        mutationFn: (id: string) => apiFetch(`/api/quizzes/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes', 'my'] });
        }
    });

    const handleDelete = (id: string) => {
        deleteQuiz(id);
        setShowDeleteConfirm(null);
    };


    const handleSaveSettings = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
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
                    {(['quizzes', 'drafts', 'templates', 'settings'] as const).map(tab => (
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

                    {/* Content Router */}
                    {(activeTab === 'quizzes' || activeTab === 'drafts') && (
                        <>
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
                                    <div
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
                                            fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', cursor: 'pointer',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <SlidersHorizontal size={13} color="#6B7280" />
                                        Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                                    </div>
                                    {isSortOpen && (
                                        <div style={{
                                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                                            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, width: 140, overflow: 'hidden'
                                        }}>
                                            {(['recent', 'oldest', 'title', 'score'] as const).map(option => (
                                                <div
                                                    key={option}
                                                    onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                                                    style={{
                                                        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                                                        background: sortBy === option ? '#F9FAFB' : '#fff',
                                                        color: sortBy === option ? '#111827' : '#374151',
                                                        borderBottom: option !== 'score' ? '1px solid #F3F4F6' : 'none'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                                    onMouseLeave={e => e.currentTarget.style.background = sortBy === option ? '#F9FAFB' : '#fff'}
                                                >
                                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                                    Showing {filtered.length} {filtered.length === 1 ? 'Quiz' : 'Quizzes'}
                                </div>
                            </div>

                            {/* Quiz grid */}
                            {isError ? (
                                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                                    <div style={{ width: 56, height: 56, background: '#FEF2F2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <AlertTriangle size={26} color="#EF4444" />
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#EF4444', margin: '0 0 8px' }}>
                                        Failed to load quizzes
                                    </h3>
                                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
                                        {(error as any)?.message || 'There was an error loading your quizzes. Please try again.'}
                                    </p>
                                    {(error as any)?.message?.toLowerCase().includes('authorized') && (
                                        <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 400, margin: '0 auto' }}>
                                            Tip: If you are testing as a student in the same browser, your session may have been overwritten.
                                            Please log out and log back in as a teacher, or use Incognito mode for students.
                                        </p>
                                    )}
                                </div>
                            ) : filtered.length === 0 ? (
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
                                                key={quiz._id}
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
                                                        { label: 'Attempts', value: quiz.attempts ?? 0 },
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
                                                    <Link
                                                        to={`/teacher/quiz/${quiz._id}/edit`}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center' }}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(quiz._id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Duplicate">
                                                        <Copy size={16} />
                                                    </button>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }} title="Analytics">
                                                        <BarChart2 size={16} />
                                                    </button>
                                                    <Link
                                                        to={`/teacher/quiz/${quiz._id}/host`}
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
                        </>
                    )}

                    {activeTab === 'templates' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                                {MOCK_TEMPLATES.map(t => (
                                    <div key={t._id} style={{

                                        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
                                        padding: 24, display: 'flex', flexDirection: 'column', gap: 16
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                                textTransform: 'uppercase', padding: '3px 8px',
                                                borderRadius: 4, background: SUBJECT_COLORS[t.subject]?.bg || SUBJECT_COLORS.Default.bg, color: SUBJECT_COLORS[t.subject]?.text || SUBJECT_COLORS.Default.text,
                                            }}>
                                                {t.subject}
                                            </span>
                                            <BookOpen size={16} color="#9CA3AF" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{t.title}</h3>
                                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
                                            <HelpCircle size={14} /> {t.questionCount} Questions
                                        </div>
                                        <button style={{
                                            marginTop: 'auto', width: '100%', padding: '10px 0',
                                            background: '#F3F4F6', color: '#374151', borderRadius: 8,
                                            border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                        }}>
                                            <Copy size={16} /> Use Template
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ maxWidth: 600, background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '32px 40px' }}>
                            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: '#111827' }}>Quiz Defaults & Preferences</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Default Time Limit (Minutes)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 16px', width: 200 }}>
                                        <Clock size={16} color="#9CA3AF" />
                                        <input type="number" defaultValue={30} style={{ border: 'none', outline: 'none', width: '100%', fontSize: 14, color: '#111827', fontWeight: 500 }} />
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: 0 }} />

                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Grading Scale</label>
                                    <select style={{ width: 200, padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, color: '#111827', outline: 'none', background: '#fff' }}>
                                        <option>Percentage (%)</option>
                                        <option>Points (10, 20, etc)</option>
                                        <option>Letter Grade (A, B, C)</option>
                                    </select>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: 0 }} />

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: '#FF5C1A' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Email Notifications</span>
                                            <span style={{ fontSize: 13, color: '#6B7280' }}>Notify me when a student completes a quiz</span>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: '#FF5C1A' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Student Reports</span>
                                            <span style={{ fontSize: 13, color: '#6B7280' }}>Automatically email students their score report</span>
                                        </div>
                                    </label>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <button onClick={handleSaveSettings} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FF5C1A', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                        <Save size={16} /> Save Preferences
                                    </button>
                                </div>
                            </div>
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
            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        style={{ position: 'fixed', bottom: 32, right: 32, background: '#10B981', color: '#fff', padding: '12px 24px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', zIndex: 100 }}
                    >
                        <CheckCircle size={18} /> Settings saved successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
