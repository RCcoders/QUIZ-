import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, BookOpen, Eye, Library as LibraryIcon,
    Users, Hash, Star, TrendingUp, Clock, Filter,
} from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';

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
    Geography:   { bg: '#E0F2FE', text: '#0369A1', dot: '#38BDF8' },
    Mathematics: { bg: '#FEF3C7', text: '#B45309', dot: '#FBBF24' },
    Science:     { bg: '#EDE9FE', text: '#6D28D9', dot: '#A78BFA' },
    History:     { bg: '#FCE7F3', text: '#9D174D', dot: '#F472B6' },
    English:     { bg: '#DCFCE7', text: '#166534', dot: '#4ADE80' },
    Default:     { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
    Easy:   { bg: '#DCFCE7', text: '#166534' },
    Medium: { bg: '#FEF3C7', text: '#B45309' },
    Hard:   { bg: '#FEE2E2', text: '#991B1B' },
};

const MOCK_QUIZZES: LibraryQuiz[] = [
    { id: '1', title: 'World Capitals Challenge', subject: 'Geography',   questionCount: 25, author: 'Ms. Rivera',   plays: 1240, rating: 4.8, difficulty: 'Medium', createdAt: '2 days ago' },
    { id: '2', title: 'Algebra Fundamentals',     subject: 'Mathematics', questionCount: 20, author: 'Mr. Chen',     plays: 890,  rating: 4.6, difficulty: 'Hard',   createdAt: '1 week ago' },
    { id: '3', title: 'The Periodic Table',        subject: 'Science',     questionCount: 30, author: 'Dr. Patel',   plays: 2100, rating: 4.9, difficulty: 'Medium', createdAt: '3 days ago' },
    { id: '4', title: 'World War II Overview',     subject: 'History',     questionCount: 18, author: 'Prof. Adams', plays: 670,  rating: 4.4, difficulty: 'Easy',   createdAt: '5 days ago' },
    { id: '5', title: 'Shakespeare & Sonnets',     subject: 'English',     questionCount: 15, author: 'Ms. Okafor',  plays: 430,  rating: 4.7, difficulty: 'Hard',   createdAt: '1 week ago' },
    { id: '6', title: 'Continents & Oceans',       subject: 'Geography',   questionCount: 12, author: 'Mr. Torres',  plays: 980,  rating: 4.5, difficulty: 'Easy',   createdAt: '4 days ago' },
    { id: '7', title: 'Fractions & Decimals',      subject: 'Mathematics', questionCount: 22, author: 'Ms. Kim',     plays: 560,  rating: 4.3, difficulty: 'Medium', createdAt: '2 weeks ago' },
    { id: '8', title: 'Human Body Systems',        subject: 'Science',     questionCount: 28, author: 'Dr. Nguyen',  plays: 1560, rating: 4.8, difficulty: 'Medium', createdAt: '6 days ago' },
];

const SORT_OPTIONS = [
    { label: 'Most Popular', value: 'plays', icon: TrendingUp },
    { label: 'Top Rated',    value: 'rating', icon: Star },
    { label: 'Newest',       value: 'newest', icon: Clock },
];

function sortQuizzes(quizzes: LibraryQuiz[], sort: string): LibraryQuiz[] {
    return [...quizzes].sort((a, b) => {
        if (sort === 'plays')  return (b.plays  ?? 0) - (a.plays  ?? 0);
        if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        return 0; // newest — keep insertion order
    });
}

export function Library() {
    const [quizzes] = useState<LibraryQuiz[]>(MOCK_QUIZZES);
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [sortBy, setSortBy] = useState('plays');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const subjects = ['all', ...Array.from(new Set(quizzes.map(q => q.subject)))];
    const filtered = sortQuizzes(filterLibraryQuizzes(quizzes, searchQuery, subjectFilter), sortBy);

    const totalPlays = quizzes.reduce((s, q) => s + (q.plays ?? 0), 0);
    const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
            <TeacherSidebar />

            <main style={{ flex: 1, marginLeft: '240px', padding: '0 2rem 2rem', minWidth: 0 }}>
            {/* ── Hero ── */}
            <div style={{ background: 'linear-gradient(135deg, #FF5C1A 0%, #FF8C42 100%)', padding: '48px 0 0' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
                    {/* Headline row */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32 }}>
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(255,255,255,0.2)', borderRadius: 999,
                                padding: '4px 12px', marginBottom: 12,
                            }}>
                                <LibraryIcon size={13} color="rgba(255,255,255,0.9)" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Public Library</span>
                            </div>
                            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                                Discover Quizzes
                            </h1>
                            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                Browse {quizzes.length} community-made quizzes across all subjects
                            </p>
                        </div>

                        {/* Stats pills */}
                        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                            {[
                                { icon: BookOpen, label: `${quizzes.length} Quizzes` },
                                { icon: Users,    label: `${(totalPlays / 1000).toFixed(1)}k Plays` },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    background: 'rgba(255,255,255,0.2)', borderRadius: 10,
                                    padding: '10px 16px',
                                }}>
                                    <stat.icon size={15} color="rgba(255,255,255,0.9)" />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search bar — sits on the bottom edge of the hero */}
                    <div style={{
                        background: '#fff', borderRadius: '14px 14px 0 0',
                        padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                    }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                placeholder="Search by title or subject..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px 10px 42px',
                                    border: '1.5px solid #E5E7EB', borderRadius: 10,
                                    fontSize: 14, color: '#111827', background: '#F9FAFB',
                                    outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = '#FF5C1A')}
                                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                            />
                        </div>

                        {/* Sort dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowSortMenu(v => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '10px 16px', borderRadius: 10,
                                    border: '1.5px solid #E5E7EB', background: '#fff',
                                    fontSize: 13, fontWeight: 600, color: '#374151',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                            >
                                <Filter size={14} color="#6B7280" />
                                {activeSortLabel}
                            </button>
                            {showSortMenu && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                    background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 160, overflow: 'hidden',
                                }}>
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 9,
                                                width: '100%', padding: '10px 14px',
                                                border: 'none', background: sortBy === opt.value ? '#FFF3EE' : '#fff',
                                                color: sortBy === opt.value ? '#FF5C1A' : '#374151',
                                                fontSize: 13, fontWeight: sortBy === opt.value ? 700 : 500,
                                                cursor: 'pointer', textAlign: 'left',
                                            }}
                                        >
                                            <opt.icon size={14} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
                {/* White panel continuation from hero search bar */}
                <div style={{ background: '#fff', borderRadius: '0 0 14px 14px', padding: '0 20px 16px', marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    {/* Subject chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {subjects.map(s => {
                            const active = subjectFilter === s;
                            const color = s !== 'all' ? (SUBJECT_COLORS[s] ?? SUBJECT_COLORS.Default) : null;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSubjectFilter(s)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '5px 14px', borderRadius: 999, border: '1.5px solid',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        borderColor: active ? '#FF5C1A' : '#E5E7EB',
                                        background: active ? '#FF5C1A' : '#fff',
                                        color: active ? '#fff' : '#374151',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {color && !active && (
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color.dot, flexShrink: 0 }} />
                                    )}
                                    {s === 'all' ? 'All Subjects' : s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Results count */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                        {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'} found
                    </span>
                </div>

                {/* Grid or empty state */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div style={{
                            width: 64, height: 64, background: '#F3F4F6', borderRadius: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <LibraryIcon size={28} color="#9CA3AF" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                            No quizzes found
                        </h3>
                        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                            Try a different search term or subject filter.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filtered.map((quiz, i) => {
                            const subjectStyle = SUBJECT_COLORS[quiz.subject] ?? SUBJECT_COLORS.Default;
                            const diffStyle = quiz.difficulty ? DIFFICULTY_COLORS[quiz.difficulty] : null;
                            return (
                                <QuizCard key={quiz.id} quiz={quiz} index={i} subjectStyle={subjectStyle} diffStyle={diffStyle} />
                            );
                        })}
                    </div>
                )}
            </div>
            </main>
        </div>
    );
}

interface QuizCardProps {
    quiz: LibraryQuiz;
    index: number;
    subjectStyle: { bg: string; text: string; dot: string };
    diffStyle: { bg: string; text: string } | null;
}

function QuizCard({ quiz, index, subjectStyle, diffStyle }: QuizCardProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff', borderRadius: 14,
                border: `1.5px solid ${hovered ? '#FF5C1A' : '#E5E7EB'}`,
                boxShadow: hovered ? '0 8px 24px rgba(255,92,26,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'default',
            }}
        >
            {/* Colored top strip */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${subjectStyle.dot}, ${subjectStyle.text})` }} />

            <div style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 9px',
                            borderRadius: 999, background: subjectStyle.bg, color: subjectStyle.text,
                        }}>
                            {quiz.subject}
                        </span>
                        {diffStyle && quiz.difficulty && (
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: '3px 9px',
                                borderRadius: 999, background: diffStyle.bg, color: diffStyle.text,
                            }}>
                                {quiz.difficulty}
                            </span>
                        )}
                    </div>
                    {quiz.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Star size={13} color="#FBBF24" fill="#FBBF24" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{quiz.rating}</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {quiz.title}
                    </h3>
                    {quiz.author && (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>by {quiz.author}</span>
                    )}
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Hash size={13} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{quiz.questionCount} questions</span>
                    </div>
                    {quiz.plays !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Users size={13} color="#9CA3AF" />
                            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                                {quiz.plays >= 1000 ? `${(quiz.plays / 1000).toFixed(1)}k` : quiz.plays} plays
                            </span>
                        </div>
                    )}
                    {quiz.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                            <Clock size={12} color="#9CA3AF" />
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{quiz.createdAt}</span>
                        </div>
                    )}
                </div>

                {/* Preview button */}
                <button
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                        background: hovered ? '#FF5C1A' : '#F3F4F6',
                        color: hovered ? '#fff' : '#374151',
                        fontWeight: 600, fontSize: 13,
                        transition: 'background 0.2s, color 0.2s',
                        marginTop: 'auto',
                    }}
                >
                    <Eye size={14} />
                    Preview Quiz
                </button>
            </div>
        </motion.div>
    );
}
