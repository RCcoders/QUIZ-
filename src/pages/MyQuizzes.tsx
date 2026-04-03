import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Plus, Bell, HelpCircle, Play, Edit2, Copy, BarChart2,
    BookOpen, AlertTriangle, X, ChevronDown, CheckCircle, Save, Clock,
    SlidersHorizontal, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { TeacherHeader } from '../components/TeacherHeader';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { QuizWithCount } from '../types/teacher';
import { fetchMyQuizzes } from '../api/teacher';

type StatusFilter = 'all' | 'active' | 'draft';

// Pure filter functions (private)
function filterQuizzesBySearch(quizzes: QuizWithCount[], query: string): QuizWithCount[] {
    if (!query.trim()) return quizzes;
    const lower = query.toLowerCase();
    return quizzes.filter(q => q.title.toLowerCase().includes(lower));
}

function filterQuizzesByStatus(quizzes: QuizWithCount[], status: StatusFilter): QuizWithCount[] {
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


export function MyQuizzes() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: quizzes = [], isLoading, isError, error } = useQuery<QuizWithCount[]>({
        queryKey: ['quizzes', 'my', user?._id],
        queryFn: fetchMyQuizzes,
        enabled: !!user,
        retry: 1, // Don't retry indefinitely on 403
    });


    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isMobile } = useBreakpoint();

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
        <div className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-[240px] px-4 sm:px-8 pb-8">
                <TeacherHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Mobile Header Title */}
                {isMobile && (
                    <div className="mt-4 flex justify-between items-center px-2">
                        <h1 className="text-xl font-extrabold text-[#FF5C1A]">My Quizzes</h1>
                        <Link
                            to="/teacher/quiz/new"
                            className="inline-flex items-center gap-1 bg-[#FF5C1A] text-white p-2 rounded-full shadow-lg"
                        >
                            <Plus size={20} />
                        </Link>
                    </div>
                )}

                {/* Tab bar */}
                <div className="inline-flex items-center gap-1 bg-gray-200/50 rounded-xl p-1 mt-5 ml-2 sm:ml-0 self-start max-w-[calc(100%-16px)] overflow-x-auto no-scrollbar">
                    {(['quizzes', 'drafts', 'templates', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-[7px] rounded-[9px] border-none text-[14px] font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={`${isMobile ? 'py-4 px-2' : 'py-6 px-0'} flex-1 min-w-0`}>

                    {/* Content Router */}
                    {(activeTab === 'quizzes' || activeTab === 'drafts') && (
                        <>
                            {/* Filter bar */}
                            <div className="flex items-center gap-[10px] mb-6 flex-wrap">
                                {/* Subject dropdown */}
                                <div className="relative">
                                    <select
                                        value={subjectFilter}
                                        onChange={e => setSubjectFilter(e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-[7px] border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#FF5C1A]"
                                    >
                                        {subjects.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={13} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>

                                {/* Sort */}
                                <div className="relative">
                                    <div
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="flex items-center gap-[6px] px-3 py-[7px] border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white cursor-pointer select-none hover:bg-gray-50 transition-colors"
                                    >
                                        <SlidersHorizontal size={13} className="text-gray-500" />
                                        Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                                    </div>
                                    {isSortOpen && (
                                        <div className="absolute top-[calc(100%+4px)] left-0 sm:right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[140px] overflow-hidden">
                                            {(['recent', 'oldest', 'title', 'score'] as const).map(option => (
                                                <div
                                                    key={option}
                                                    onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                                                    className={`px-3 py-2 text-[13px] cursor-pointer transition-colors ${sortBy === option ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto text-[13px] text-gray-400 font-medium">
                                    Showing {filtered.length} {filtered.length === 1 ? 'Quiz' : 'Quizzes'}
                                </div>
                            </div>

                            {/* Quiz grid */}
                            {isError ? (
                                <div className="text-center py-20 px-6">
                                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle size={26} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-red-500 mb-2">
                                        Failed to load quizzes
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-5">
                                        {(error as any)?.message || 'There was an error loading your quizzes. Please try again.'}
                                    </p>
                                    {(error as any)?.message?.toLowerCase().includes('authorized') && (
                                        <p className="text-[12px] text-gray-400 max-w-[400px] mx-auto">
                                            Tip: If you are testing as a student in the same browser, your session may have been overwritten.
                                            Please log out and log back in as a teacher, or use Incognito mode for students.
                                        </p>
                                    )}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-20 px-6">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <BookOpen size={26} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-gray-900 mb-2">
                                        {quizzes.length === 0 ? 'No quizzes yet' : 'No quizzes match your filters'}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 mb-5">
                                        {quizzes.length === 0 ? 'Create your first quiz to get started.' : 'Try adjusting your search or filter.'}
                                    </p>
                                    {quizzes.length === 0 && (
                                        <Link to="/teacher/quiz/new" className="inline-flex items-center gap-[7px] bg-[#FF5C1A] text-white px-5 py-[9px] rounded-lg font-semibold text-[13px] no-underline hover:bg-[#e65317] transition-colors shadow-sm">
                                            <Plus size={15} /> Create Your First Quiz
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                                className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group"
                                            >

                                                {/* Subject + date */}
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-[4px]"
                                                        style={{ background: subjectStyle.bg, color: subjectStyle.text }}
                                                    >
                                                        {quiz.subject || 'General'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">{quiz.date}</span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-[17px] font-bold text-gray-900 m-0 leading-[1.3] group-hover:text-[#FF5C1A] transition-colors line-clamp-2 min-h-[2.6em]">
                                                    {quiz.title}
                                                </h3>

                                                {/* Stats row */}
                                                <div className="grid grid-cols-2 gap-[10px]">
                                                    {[
                                                        { label: 'Questions', value: quiz.questionCount ?? 0 },
                                                        { label: 'Attempts', value: quiz.attempts ?? 0 },
                                                    ].map(stat => (
                                                        <div key={stat.label} className="bg-gray-50 rounded-lg p-[10px_12px] border border-gray-100 transition-colors group-hover:bg-white group-hover:border-gray-200">
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</div>
                                                            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Avg score */}
                                                <div className="bg-gray-50 rounded-lg p-[10px_12px] border border-gray-100 transition-colors group-hover:bg-white group-hover:border-gray-200">
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-[6px]">Avg Score</div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl font-bold" style={{ color: scoreColor }}>{quiz.avgScore ?? 0}%</span>
                                                        <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: scoreWidth, background: scoreColor }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 pt-1">
                                                    <Link
                                                        to={`/teacher/quiz/${quiz._id}/edit`}
                                                        className="text-gray-400 hover:text-[#6366F1] transition-colors p-1"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(quiz._id)}
                                                        className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-[#FF5C1A] transition-colors p-1" title="Duplicate">
                                                        <Copy size={16} />
                                                    </button>
                                                    <button className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-[#10B981] transition-colors p-1" title="Analytics">
                                                        <BarChart2 size={16} />
                                                    </button>
                                                    <Link
                                                        to={`/teacher/quiz/${quiz._id}/host`}
                                                        className="ml-auto inline-flex items-center gap-[7px] bg-[#FF5C1A] text-white px-[18px] py-2 rounded-full font-bold text-[13px] no-underline hover:bg-[#e65317] transition-colors shadow-sm"
                                                    >
                                                        <Play size={13} fill="currentColor" />
                                                        Host
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {MOCK_TEMPLATES.map(t => (
                                    <div key={t._id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className="text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-[4px]"
                                                style={{ background: SUBJECT_COLORS[t.subject]?.bg || SUBJECT_COLORS.Default.bg, color: SUBJECT_COLORS[t.subject]?.text || SUBJECT_COLORS.Default.text }}
                                            >
                                                {t.subject}
                                            </span>
                                            <BookOpen size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-[17px] font-bold text-gray-900 mb-[6px]">{t.title}</h3>
                                            <p className="text-[13px] text-gray-500 m-0 leading-[1.5] line-clamp-3">{t.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-[6px] text-[13px] text-gray-400 font-medium">
                                            <HelpCircle size={14} /> {t.questionCount} Questions
                                        </div>
                                        <button className="mt-auto w-full py-[10px] bg-gray-100 text-gray-700 rounded-lg border-none font-semibold text-[13px] cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                                            <Copy size={16} /> Use Template
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mx-auto sm:mx-0">
                            <h2 className="m-0 mb-6 text-xl font-extrabold text-gray-900 text-center sm:text-left">Quiz Defaults & Preferences</h2>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Default Time Limit (Minutes)</label>
                                    <div className="flex items-center gap-[10px] border border-gray-200 rounded-lg p-[10px_16px] w-full sm:w-[200px] focus-within:ring-2 focus-within:ring-[#FF5C1A] transition-all">
                                        <Clock size={16} className="text-gray-400" />
                                        <input type="number" defaultValue={30} className="border-none outline-none w-full text-sm text-gray-900 font-medium bg-transparent" />
                                    </div>
                                </div>

                                <hr className="border-none border-t border-gray-200 m-0" />

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Grading Scale</label>
                                    <select className="w-full sm:w-[200px] p-[10px_16px] border border-gray-200 rounded-lg text-sm text-gray-900 outline-none bg-white focus:ring-2 focus:ring-[#FF5C1A] transition-all">
                                        <option>Percentage (%)</option>
                                        <option>Points (10, 20, etc)</option>
                                        <option>Letter Grade (A, B, C)</option>
                                    </select>
                                </div>

                                <hr className="border-none border-t border-gray-200 m-0" />

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF5C1A]" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#FF5C1A] transition-colors">Email Notifications</span>
                                            <span className="text-[13px] text-gray-500">Notify me when a student completes a quiz</span>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF5C1A]" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#FF5C1A] transition-colors">Student Reports</span>
                                            <span className="text-[13px] text-gray-500">Automatically email students their score report</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="mt-4 flex justify-center sm:justify-start">
                                    <button onClick={handleSaveSettings} className="inline-flex items-center gap-2 bg-[#FF5C1A] text-white border-none p-[10px_24px] rounded-lg font-bold text-[14px] cursor-pointer hover:bg-[#e65317] transition-all shadow-md">
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
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={() => setShowDeleteConfirm(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-7 w-full max-w-[360px] shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-[10px]">
                                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                                        <AlertTriangle size={18} className="text-red-500" />
                                    </div>
                                    <span className="text-base font-bold text-gray-900">Delete Quiz</span>
                                </div>
                                <button onClick={() => setShowDeleteConfirm(null)} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Are you sure you want to delete this quiz? This action cannot be undone.
                            </p>
                            <div className="flex gap-[10px]">
                                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-[10px] rounded-lg border border-gray-200 bg-white text-gray-700 font-bold text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-[10px] rounded-lg border-none bg-red-500 text-white font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors shadow-sm">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 bg-emerald-500 text-white p-[12px_24px] rounded-lg flex items-center gap-[10px] font-bold text-sm shadow-xl shadow-emerald-500/30 z-[100]"
                    >
                        <CheckCircle size={18} /> Settings saved successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
