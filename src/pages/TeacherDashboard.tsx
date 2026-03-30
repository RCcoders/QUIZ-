import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus, Search, Bell, Settings, FileText, TrendingUp,
    BookOpen, Users, BarChart2, Download, AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSidebar, MobileHeader } from '../components/TeacherSidebar';

interface QuizWithCount {
    _id: string;
    title: string;
    isActive: boolean;
    questionCount?: number;
    attempts?: number;
    avgScore?: number;
}

export async function fetchQuizzesForTeacher(): Promise<QuizWithCount[]> {
    return apiFetch('/api/quizzes/teacher/my-quizzes');
}

export interface DashboardStats {
    totalQuizzes: number;
    activeSessions: number;
    totalStudents: number;
    averageScore: number;
    averageTimeTakenMs: number;
    weeklyData: { day: string; pct: number }[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    return apiFetch('/api/teacher/dashboard-stats');
}

export function TeacherDashboard() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const { data: quizzes = [], isLoading: isQuizzesLoading, isError: isQuizzesError, error: quizzesError } = useQuery({
        queryKey: ['quizzes', user?._id],
        queryFn: () => fetchQuizzesForTeacher(),
        enabled: !!user,
        retry: 1,
    });

    const { data: stats, isLoading: isStatsLoading, isError: isStatsError, error: statsError } = useQuery({
        queryKey: ['dashboardStats', user?._id],
        queryFn: () => fetchDashboardStats(),
        enabled: !!user,
        retry: 1,
    });

    // Format ms to m and s
    const formatTime = (ms: number) => {
        if (!ms) return '0m 0s';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    const statCards = [
        {
            label: 'Total Quizzes',
            value: stats?.totalQuizzes?.toString() || '0',
            change: '--',
            positive: true,
            icon: BookOpen,
            iconBg: '#EEF2FF',
            iconColor: '#6366F1',
        },
        {
            label: 'Active Sessions',
            value: stats?.activeSessions?.toString() || '0',
            change: '--',
            positive: true,
            icon: TrendingUp,
            iconBg: '#ECFDF5',
            iconColor: '#10B981',
        },
        {
            label: 'Total Students',
            value: stats?.totalStudents?.toString() || '0',
            change: '--',
            positive: true,
            icon: Users,
            iconBg: '#FFF7ED',
            iconColor: '#F97316',
        },
        {
            label: 'Average Score',
            value: stats ? `${stats.averageScore}%` : '0%',
            change: '--',
            positive: true,
            icon: BarChart2,
            iconBg: '#FFF3EE',
            iconColor: '#FF5C1A',
        },
    ];

    const weeklyData = stats?.weeklyData || [
        { day: 'Mon', pct: 0 },
        { day: 'Tue', pct: 0 },
        { day: 'Wed', pct: 0 },
        { day: 'Thu', pct: 0 },
        { day: 'Fri', pct: 0 },
        { day: 'Sat', pct: 0 },
        { day: 'Sun', pct: 0 },
    ];

    const [searchQuery, setSearchQuery] = useState('');

    const filteredQuizzes = quizzes.filter((q: QuizWithCount) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Derive teacher initials from email or display name
    const teacherInitials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'T';

    // Derive display name for greeting
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Teacher';

    return (
        /* ── Page shell: flex row, sidebar + main ── */
        <div className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <MobileHeader onOpen={() => setIsSidebarOpen(true)} />
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-[240px] ${isMobile ? 'px-4 pb-8 mt-16' : 'px-8 pb-8'}`}>

                {/* ── Top bar ── */}
                {!isMobile && (
                    <div className="flex items-center gap-3 py-5 border-b border-gray-200 mb-7">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search
                                size={16}
                                className="absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search quizzes, students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-[10px] pl-[40px] pr-[14px] border border-gray-200 rounded-[10px] bg-white text-sm text-gray-900 outline-none box-border focus:ring-2 focus:ring-[#FF5C1A] transition-all"
                            />
                        </div>

                        {/* Bell */}
                        <button className="w-10 h-10 border border-gray-200 rounded-[10px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Bell size={18} className="text-gray-500" />
                        </button>

                        {/* Settings */}
                        <button className="w-10 h-10 border border-gray-200 rounded-[10px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Settings size={18} className="text-gray-500" />
                        </button>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#FF5C1A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {teacherInitials}
                        </div>
                    </div>
                )}
                {isMobile && <div className="h-3" />}

                {/* ── Welcome row ── */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="min-w-[200px]">
                        <h1 className="text-2xl md:text-[26px] font-extrabold text-gray-900 m-0">
                            Hello, {displayName}! 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Welcome back! Here's how your classes are performing today.
                        </p>
                    </div>
                    <Link
                        to="/teacher/quiz/new"
                        className="inline-flex items-center gap-2 bg-[#FF5C1A] text-white px-5 py-[10px] rounded-[10px] font-semibold text-sm no-underline whitespace-nowrap shrink-0 hover:bg-[#e65317] transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Create New Quiz
                    </Link>
                </div>

                {/* Authorization Warning Banner */}
                {(isQuizzesError || isStatsError) && ((quizzesError as any)?.message?.toLowerCase().includes('authorized') || (statsError as any)?.message?.toLowerCase().includes('authorized')) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6 flex items-center gap-3"
                    >
                        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-red-800">Session Conflict Detected</div>
                            <div className="text-[13px] text-red-700 mt-[2px]">
                                Your connection was rejected with a "403 Forbidden" error. This usually happens when testing as a student in the same browser.
                                Please use **Incognito Mode** for student joins or log out and log back in as a teacher.
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-white rounded-[14px] p-5 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center justify-between mb-[14px]">
                                {/* Icon circle */}
                                <div
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                                    style={{ background: card.iconBg }}
                                >
                                    <card.icon size={18} style={{ color: card.iconColor }} />
                                </div>
                                {/* Change badge */}
                                <span
                                    className={`text-[12px] font-bold px-2 py-[2px] rounded-full ${card.positive ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}
                                >
                                    {card.change}
                                </span>
                            </div>
                            <div className="text-[28px] font-extrabold text-gray-900 leading-none">
                                {card.value}
                            </div>
                            <div className="text-[13px] text-gray-500 mt-[6px]">
                                {card.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Main content: Recent Quizzes + Performance ── */}
                <div className="flex flex-col lg:flex-row gap-6 flex-1">
                    {/* ── Recent Quizzes (60%) ── */}
                    <div className="flex-[3] min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 m-0">Recent Quizzes</h2>
                            <Link to="/teacher/my-quizzes" className="text-[13px] text-[#FF5C1A] font-semibold no-underline hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden">
                            {isQuizzesLoading ? (
                                <div className="p-12 text-center text-gray-500 text-sm">
                                    Loading quizzes…
                                </div>
                            ) : isQuizzesError ? (
                                <div className="p-12 text-center text-red-500 text-sm">
                                    Failed to load quizzes. Please try again.
                                </div>
                            ) : filteredQuizzes.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <FileText size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-2">
                                        No quizzes found
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-5">
                                        {searchQuery ? 'No quizzes match your search.' : 'Start by creating your first quiz!'}
                                    </p>
                                    {!searchQuery && (
                                        <Link
                                            to="/teacher/quiz/new"
                                            className="inline-flex items-center gap-[6px] bg-[#FF5C1A] text-white px-5 py-2 rounded-lg font-semibold text-sm no-underline hover:bg-[#e65317] transition-colors shadow-sm"
                                        >
                                            <Plus size={14} />
                                            Create Quiz
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                filteredQuizzes.slice(0, 5).map((quiz: QuizWithCount, i: number) => (
                                    <motion.div
                                        key={quiz._id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={`flex items-center gap-[14px] p-[14px_20px] ${i < filteredQuizzes.slice(0, 5).length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                                    >
                                        {/* Quiz icon */}
                                        <div className="w-11 h-11 rounded-[10px] bg-[#FFF3EE] flex items-center justify-center shrink-0 text-lg font-bold text-[#FF5C1A]">
                                            {quiz.title[0]?.toUpperCase()}
                                        </div>

                                        {/* Title + meta */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {quiz.title}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-[2px]">
                                                {quiz.questionCount ?? 0} questions · {quiz.attempts ?? 0} students
                                            </div>
                                        </div>

                                        {/* Avg score */}
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-bold text-gray-900">{Math.round(quiz.avgScore ?? 0)}%</div>
                                            <div className="text-[11px] text-emerald-500 font-medium">avg score</div>
                                        </div>

                                        {/* Status badge */}
                                        <span className={`text-[11px] font-semibold px-[10px] py-[3px] rounded-full shrink-0 ${quiz.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-500'}`}>
                                            {quiz.isActive ? 'Active' : 'Draft'}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Performance panel (40%) ── */}
                    <div className="flex-[2] min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Performance</h2>

                        {/* Bar chart card */}
                        <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-5 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-gray-900">Weekly Quiz Completion</span>
                                <TrendingUp size={16} className="text-gray-400" />
                            </div>

                            {/* CSS bar chart */}
                            <div className="flex items-end gap-[6px] h-20 mb-3">
                                {weeklyData.map((d) => (
                                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group transition-all duration-300">
                                        <div
                                            className="w-full bg-[#FF5C1A] rounded-[4px_4px_0_0] opacity-80 group-hover:opacity-100 transition-all duration-300 relative"
                                            style={{ height: `${d.pct}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                {d.pct}%
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-xl font-extrabold text-gray-900 leading-none">Recent</div>
                            <div className="text-xs text-gray-500 mt-1">Weekly completion breakdown</div>
                        </div>

                        {/* Avg student time card */}
                        <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-5 mb-4">
                            <div className="text-[13px] font-semibold text-gray-500 mb-2">Avg Student Time</div>
                            <div className="text-[26px] font-extrabold text-gray-900 leading-tight">{formatTime(stats?.averageTimeTakenMs || 0)}</div>
                            <div className="text-xs text-gray-400 mt-1 font-medium">Per quiz completion</div>
                        </div>

                        {/* Download Report button */}
                        <button className="w-full flex items-center justify-center gap-2 p-3 bg-[#FFF3EE] border border-[#FDDCCC] rounded-[10px] text-[#FF5C1A] font-semibold text-sm cursor-pointer hover:bg-[#FDDCCC] transition-colors">
                            <Download size={16} />
                            Download Report PDF
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
