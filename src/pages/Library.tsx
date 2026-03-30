import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, BookOpen, Eye, Library as LibraryIcon,
    Users, Hash, Star, TrendingUp, Clock, Filter,
    Plus, ToggleLeft, ToggleRight, FileText, Trash2, X, Copy
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../hooks/useNotes';
import { TeacherSidebar, MobileHeader } from '../components/TeacherSidebar';
import type { Note } from '../types/student';

export interface LibraryQuiz {
    id: string;
    title: string;
    subject: string;
    questionCount: number;
    author?: string;
    plays?: number;
    rating?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    createdAt?: string;
}

// Pure filter function (exported for testing)
// eslint-disable-next-line react-refresh/only-export-components
export function filterLibraryQuizzes(
    quizzes: LibraryQuiz[],
    query: string,
    subject: string
): LibraryQuiz[] {
    let result = quizzes;
    if (query.trim()) {
        const lower = query.toLowerCase();
        result = result.filter(
            q => q.title.toLowerCase().includes(lower) || q.subject.toLowerCase().includes(lower)
        );
    }
    if (subject !== 'all') {
        result = result.filter(q => q.subject === subject);
    }
    return result;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    Geography: { bg: '#E0F2FE', text: '#0369A1', dot: '#38BDF8' },
    Mathematics: { bg: '#FEF3C7', text: '#B45309', dot: '#FBBF24' },
    Science: { bg: '#EDE9FE', text: '#6D28D9', dot: '#A78BFA' },
    History: { bg: '#FCE7F3', text: '#9D174D', dot: '#F472B6' },
    English: { bg: '#DCFCE7', text: '#166534', dot: '#4ADE80' },
    Default: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
    Easy: { bg: '#DCFCE7', text: '#166534' },
    Medium: { bg: '#FEF3C7', text: '#B45309' },
    Hard: { bg: '#FEE2E2', text: '#991B1B' },
};

const MOCK_QUIZZES: LibraryQuiz[] = [
    { id: '1', title: 'World Capitals Challenge', subject: 'Geography', questionCount: 25, author: 'Ms. Rivera', plays: 1240, rating: 4.8, difficulty: 'Medium', createdAt: '2 days ago' },
    { id: '2', title: 'Algebra Fundamentals', subject: 'Mathematics', questionCount: 20, author: 'Mr. Chen', plays: 890, rating: 4.6, difficulty: 'Hard', createdAt: '1 week ago' },
    { id: '3', title: 'The Periodic Table', subject: 'Science', questionCount: 30, author: 'Dr. Patel', plays: 2100, rating: 4.9, difficulty: 'Medium', createdAt: '3 days ago' },
    { id: '4', title: 'World War II Overview', subject: 'History', questionCount: 18, author: 'Prof. Adams', plays: 670, rating: 4.4, difficulty: 'Easy', createdAt: '5 days ago' },
    { id: '5', title: 'Shakespeare & Sonnets', subject: 'English', questionCount: 15, author: 'Ms. Okafor', plays: 430, rating: 4.7, difficulty: 'Hard', createdAt: '1 week ago' },
    { id: '6', title: 'Continents & Oceans', subject: 'Geography', questionCount: 12, author: 'Mr. Torres', plays: 980, rating: 4.5, difficulty: 'Easy', createdAt: '4 days ago' },
    { id: '7', title: 'Fractions & Decimals', subject: 'Mathematics', questionCount: 22, author: 'Ms. Kim', plays: 560, rating: 4.3, difficulty: 'Medium', createdAt: '2 weeks ago' },
    { id: '8', title: 'Human Body Systems', subject: 'Science', questionCount: 28, author: 'Dr. Nguyen', plays: 1560, rating: 4.8, difficulty: 'Medium', createdAt: '6 days ago' },
];

const SORT_OPTIONS = [
    { label: 'Most Popular', value: 'plays', icon: TrendingUp },
    { label: 'Top Rated', value: 'rating', icon: Star },
    { label: 'Newest', value: 'newest', icon: Clock },
];

function sortQuizzes(quizzes: LibraryQuiz[], sort: string): LibraryQuiz[] {
    return [...quizzes].sort((a, b) => {
        if (sort === 'plays') return (b.plays ?? 0) - (a.plays ?? 0);
        if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        return 0;
    });
}

interface NoteFormState {
    title: string;
    subject: string;
    content: string;
    linkedQuizId: string;
}

const EMPTY_NOTE_FORM: NoteFormState = { title: '', subject: '', content: '', linkedQuizId: '' };

export function Library() {
    const { user } = useAuth();
    const { notes, refresh } = useNotes({ authorUid: user?._id });

    const [quizzes] = useState<LibraryQuiz[]>(MOCK_QUIZZES);
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [sortBy, setSortBy] = useState('plays');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [previewQuiz, setPreviewQuiz] = useState<LibraryQuiz | null>(null);

    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteForm, setNoteForm] = useState<NoteFormState>(EMPTY_NOTE_FORM);
    const [noteFormErrors, setNoteFormErrors] = useState<{ title?: string; content?: string }>({});
    const [noteSubmitting, setNoteSubmitting] = useState(false);

    const subjects = ['all', ...Array.from(new Set(quizzes.map(q => q.subject)))];
    const filtered = sortQuizzes(filterLibraryQuizzes(quizzes, searchQuery, subjectFilter), sortBy);
    const totalPlays = quizzes.reduce((s, q) => s + (q.plays ?? 0), 0);
    const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

    async function handleNoteSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errors: { title?: string; content?: string } = {};
        if (!noteForm.title.trim()) errors.title = 'Title is required';
        if (!noteForm.content.trim()) errors.content = 'Content is required';
        setNoteFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setNoteSubmitting(true);
        try {
            await apiFetch('/api/notes', {
                method: 'POST',
                body: {
                    title: noteForm.title.trim(),
                    subject: noteForm.subject.trim(),
                    content: noteForm.content.trim(),
                    linkedQuizId: noteForm.linkedQuizId.trim() || null,
                }
            });
            setNoteForm(EMPTY_NOTE_FORM);
            setNoteFormErrors({});
            setShowNoteForm(false);
            refresh();
        } catch (err) {
            console.error('Failed to save note:', err);
        } finally {
            setNoteSubmitting(false);
        }
    }

    async function handlePublishToggle(note: Note) {
        try {
            await apiFetch(`/api/notes/${note.id || (note as any)._id}`, {
                method: 'PATCH',
                body: { published: !note.published }
            });
            refresh();
        } catch (err) {
            console.error('Failed to toggle publish state:', err);
        }
    }

    async function handleDeleteNote(id: string) {
        if (!window.confirm('Are you sure you want to delete this note?')) return;
        try {
            await apiFetch(`/api/notes/${id}`, {
                method: 'DELETE'
            });
            refresh();
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    }

    return (
        <div className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <MobileHeader onOpen={() => setIsSidebarOpen(true)} />
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content - Adjust margin-left for mobile when sidebar is hidden/collapsed if applicable */}
            <main className="flex-1 lg:ml-[240px] p-0 pb-8 min-w-0 transition-all duration-300 mt-16 lg:mt-0">

                {/* Header Section */}
                <div className="bg-gradient-to-br from-[#FF5C1A] to-[#FF8C42] pt-12 pb-8 px-4 sm:px-6">
                    <div className="max-w-[1100px] mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 scale-95 origin-left">
                                    <LibraryIcon size={13} className="text-white/90" />
                                    <span className="text-[12px] font-semibold text-white/90 uppercase tracking-wider">Public Library</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Discover Quizzes</h1>
                                <p className="text-white/80 text-sm sm:text-base max-w-md">
                                    Browse {quizzes.length} community-made quizzes across all subjects
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                                    <BookOpen size={16} className="text-white/90" />
                                    <span className="text-sm font-bold text-white whitespace-nowrap">{quizzes.length} Quizzes</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                                    <Users size={16} className="text-white/90" />
                                    <span className="text-sm font-bold text-white whitespace-nowrap">{(totalPlays / 1000).toFixed(1)}k Plays</span>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar Container */}
                        <div className="bg-white rounded-t-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-sm">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title or subject..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-1.5 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] transition-colors"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowSortMenu(v => !v)}
                                    className="flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-white border-1.5 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                                >
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-400" />
                                        <span>{activeSortLabel}</span>
                                    </div>
                                    <TrendingUp size={14} className={showSortMenu ? "rotate-180 transition-transform" : "transition-transform"} />
                                </button>

                                {showSortMenu && (
                                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[180px] overflow-hidden py-1">
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left
                                                    ${sortBy === opt.value ? 'bg-[#FFF3EE] text-[#FF5C1A] font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <opt.icon size={16} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-12">
                    <div className="bg-white rounded-b-2xl p-4 sm:p-5 pt-0 mb-6 border-t border-gray-100 shadow-sm">
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                            {subjects.map(s => {
                                const active = subjectFilter === s;
                                const color = s !== 'all' ? (SUBJECT_COLORS[s] ?? SUBJECT_COLORS.Default) : null;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setSubjectFilter(s)}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-1.5 text-sm font-bold whitespace-nowrap transition-all
                                            ${active
                                                ? 'bg-[#FF5C1A] border-[#FF5C1A] text-white shadow-md shadow-[#FF5C1A]/20'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF5C1A] hover:text-[#FF5C1A]'}`}
                                    >
                                        {color && !active && (
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: color.dot }}
                                            />
                                        )}
                                        {s === 'all' ? 'All Subjects' : s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-semibold">
                            {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'} found
                        </span>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 px-6 bg-white rounded-2xl border border-dashed border-gray-200">
                            <LibraryIcon size={32} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No quizzes found</h3>
                            <p className="text-sm text-gray-500">Try a different search term or subject filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((quiz, i) => {
                                const subjectStyle = SUBJECT_COLORS[quiz.subject] ?? SUBJECT_COLORS.Default;
                                const diffStyle = quiz.difficulty ? DIFFICULTY_COLORS[quiz.difficulty] : null;
                                return (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        index={i}
                                        subjectStyle={subjectStyle}
                                        diffStyle={diffStyle}
                                        onPreview={() => setPreviewQuiz(quiz)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 mb-12">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-[#FF5C1A]" />
                                <h2 className="text-lg font-bold text-gray-900">My Notes</h2>
                                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{notes.length}</span>
                            </div>
                            <button
                                onClick={() => setShowNoteForm(v => !v)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#FF5C1A] text-white rounded-xl text-sm font-bold hover:bg-[#e65217] transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                <span>New Note</span>
                            </button>
                        </div>

                        <AnimatePresence>
                            {showNoteForm && (
                                <motion.form
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    onSubmit={handleNoteSubmit}
                                    className="p-5 border-b border-gray-50 bg-gray-50/50 space-y-4 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Title</label>
                                            <input
                                                type="text"
                                                placeholder="Note title"
                                                value={noteForm.title}
                                                onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))}
                                                className={`w-full px-4 py-2 bg-white border-1.5 rounded-xl text-sm focus:outline-none transition-colors
                                                    ${noteFormErrors.title ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#FF5C1A]'}`}
                                            />
                                            {noteFormErrors.title && (
                                                <span data-testid="title-error" className="text-[11px] font-semibold text-red-500 ml-1">{noteFormErrors.title}</span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Subject</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Mathematics"
                                                value={noteForm.subject}
                                                onChange={e => setNoteForm(f => ({ ...f, subject: e.target.value }))}
                                                className="w-full px-4 py-2 bg-white border-1.5 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Content</label>
                                        <textarea
                                            placeholder="Write your note here..."
                                            value={noteForm.content}
                                            rows={4}
                                            onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))}
                                            className={`w-full px-4 py-3 bg-white border-1.5 rounded-xl text-sm focus:outline-none transition-colors resize-none
                                                ${noteFormErrors.content ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#FF5C1A]'}`}
                                        />
                                        {noteFormErrors.content && (
                                            <span data-testid="content-error" className="text-[11px] font-semibold text-red-500 ml-1">{noteFormErrors.content}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Linked Quiz ID <span className="text-gray-400 font-medium">(optional)</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter quiz ID to link"
                                            value={noteForm.linkedQuizId}
                                            onChange={e => setNoteForm(f => ({ ...f, linkedQuizId: e.target.value }))}
                                            className="w-full px-4 py-2 bg-white border-1.5 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] transition-colors"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={noteSubmitting}
                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#FF5C1A] text-white rounded-xl text-sm font-bold hover:bg-[#e65217] transition-all disabled:opacity-50"
                                        >
                                            {noteSubmitting ? 'Saving...' : 'Save Note'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowNoteForm(false); setNoteForm(EMPTY_NOTE_FORM); setNoteFormErrors({}); }}
                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-white border-1.5 border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {notes.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText size={24} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500 font-medium">No notes yet. Start by creating one!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notes.map(note => (
                                    <div key={note.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[15px] font-bold text-gray-900 truncate mb-0.5">{note.title}</h4>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">{note.subject}</p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-5">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full
                                                    ${note.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {note.published ? 'Published' : 'Draft'}
                                                </span>
                                                <button
                                                    onClick={() => handlePublishToggle(note)}
                                                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors group"
                                                    title={note.published ? 'Unpublish' : 'Publish'}
                                                >
                                                    {note.published
                                                        ? <ToggleRight size={24} className="text-emerald-500" />
                                                        : <ToggleLeft size={24} className="text-gray-400 group-hover:text-gray-600" />
                                                    }
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNote(note.id || (note as any)._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Note"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewQuiz(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-white sticky top-0 z-10">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                            style={{
                                                background: SUBJECT_COLORS[previewQuiz.subject]?.bg || SUBJECT_COLORS.Default.bg,
                                                color: SUBJECT_COLORS[previewQuiz.subject]?.text || SUBJECT_COLORS.Default.text
                                            }}
                                        >
                                            {previewQuiz.subject}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                            <Hash size={12} />
                                            {previewQuiz.questionCount} Questions
                                        </span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{previewQuiz.title}</h2>
                                </div>
                                <button
                                    onClick={() => setPreviewQuiz(null)}
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-4">
                                {Array.from({ length: Math.min(previewQuiz.questionCount, 5) }).map((_, i) => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className="w-8 h-8 rounded-xl bg-[#FFF3EE] text-[#FF5C1A] flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm shadow-[#FF5C1A]/10">
                                                {i + 1}
                                            </div>
                                            <h4 className="text-sm sm:text-[15px] font-bold text-gray-700 leading-relaxed pt-1">
                                                This is a mock sample question about {previewQuiz.subject.toLowerCase()} matching the difficulty level of this quiz. Can you select the correct answer below?
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:pl-12">
                                            {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, optIdx) => (
                                                <div key={optIdx} className="px-4 py-3 bg-gray-50 border-1.5 border-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#FF5C1A]/30 hover:bg-white transition-all cursor-default">
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {previewQuiz.questionCount > 5 && (
                                    <div className="text-center py-4 text-gray-400 text-sm font-bold bg-white/50 rounded-xl border border-dashed border-gray-200">
                                        + {previewQuiz.questionCount - 5} more questions in the full quiz
                                    </div>
                                )}
                            </div>

                            <div className="p-5 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 bg-white sticky bottom-0">
                                <button
                                    onClick={() => setPreviewQuiz(null)}
                                    className="flex-1 sm:flex-none px-6 py-3 border-1.5 border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all text-center"
                                >
                                    Close Preview
                                </button>
                                <button className="flex-1 px-6 py-3 bg-[#FF5C1A] text-white rounded-xl text-sm font-bold hover:bg-[#e65217] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C1A]/20">
                                    <Copy size={18} />
                                    <span>Duplicate to My Quizzes</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface QuizCardProps {
    quiz: LibraryQuiz;
    index: number;
    subjectStyle: { bg: string; text: string; dot: string };
    diffStyle: { bg: string; text: string } | null;
    onPreview?: () => void;
}

function QuizCard({ quiz, index, subjectStyle, diffStyle, onPreview }: QuizCardProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`group bg-white rounded-2xl border-1.5 transition-all duration-300 flex flex-col overflow-hidden h-full
                ${hovered ? 'border-[#FF5C1A] shadow-xl shadow-[#FF5C1A]/10 -translate-y-1' : 'border-gray-100 shadow-sm'}`}
        >
            <div
                className="h-1.5 w-full bg-gradient-to-r"
                style={{ backgroundImage: `linear-gradient(to right, ${subjectStyle.dot}, ${subjectStyle.text})` }}
            />
            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                        <span
                            className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
                            style={{ background: subjectStyle.bg, color: subjectStyle.text }}
                        >
                            {quiz.subject}
                        </span>
                        {diffStyle && quiz.difficulty && (
                            <span
                                className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                style={{ background: diffStyle.bg, color: diffStyle.text }}
                            >
                                {quiz.difficulty}
                            </span>
                        )}
                    </div>
                    {quiz.rating && (
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span className="text-xs font-black text-amber-700">{quiz.rating}</span>
                        </div>
                    )}
                </div>

                <div className="mb-5 flex-1">
                    <h3 className="text-[17px] font-black text-gray-900 leading-tight mb-1 group-hover:text-[#FF5C1A] transition-colors line-clamp-2">
                        {quiz.title}
                    </h3>
                    {quiz.author && (
                        <p className="text-xs font-bold text-gray-400">by <span className="text-gray-600">{quiz.author}</span></p>
                    )}
                </div>

                <div className="flex items-center justify-between py-4 border-t border-gray-50 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Hash size={14} className="text-gray-400" />
                            <span className="text-[13px] font-bold">{quiz.questionCount}</span>
                        </div>
                        {quiz.plays !== undefined && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Users size={14} className="text-gray-400" />
                                <span className="text-[13px] font-bold">
                                    {quiz.plays >= 1000 ? `${(quiz.plays / 1000).toFixed(1)}k` : quiz.plays}
                                </span>
                            </div>
                        )}
                    </div>
                    {quiz.createdAt && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={13} />
                            <span className="text-[11px] font-bold font-mono tracking-tighter uppercase">{quiz.createdAt}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onPreview}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-black transition-all duration-300
                        ${hovered
                            ? 'bg-[#FF5C1A] text-white shadow-lg shadow-[#FF5C1A]/20'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                    <Eye size={16} />
                    <span>PREVIEW QUIZ</span>
                </button>
            </div>
        </motion.div>
    );
}
