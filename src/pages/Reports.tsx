import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, CheckCircle, TrendingUp, Calendar, DownloadCloud } from 'lucide-react';
import { TeacherSidebar, MobileHeader } from '../components/TeacherSidebar';
import { apiFetch } from '../utils/api';

export interface QuizSession {
    id: string;
    quizTitle: string;
    date: string; // ISO date string
    participantCount: number;
    averageScore: number; // 0–100
    completed: boolean;
}

type DateRange = '7d' | '30d' | 'all';

// Pure filter function (exported for testing)
// eslint-disable-next-line react-refresh/only-export-components
export function filterSessionsByDate(sessions: QuizSession[], range: DateRange): QuizSession[] {
    if (range === 'all') return sessions;
    const now = Date.now();
    const ms = range === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return sessions.filter(s => now - new Date(s.date).getTime() <= ms);
}

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'All time', value: 'all' },
];

function computeStats(sessions: QuizSession[]) {
    const totalSessions = sessions.length;
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participantCount, 0);
    const avgScore = totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.averageScore, 0) / totalSessions)
        : 0;
    const completionRate = totalSessions > 0
        ? Math.round((sessions.filter(s => s.completed).length / totalSessions) * 100)
        : 0;
    return { totalSessions, totalParticipants, avgScore, completionRate };
}

export function Reports() {
    const [sessions, setSessions] = useState<QuizSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateRange>('all');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await apiFetch('/api/reports');
                setSessions(data);
            } catch (err: any) {
                console.error("Failed to fetch reports:", err);
                setError(err.message || 'Failed to load reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filtered = filterSessionsByDate(sessions, dateFilter);

    const handleDownloadCSV = () => {
        if (filtered.length === 0) return;

        // Define CSV headers
        const headers = ['Quiz Title', 'Date', 'Participants', 'Average Score', 'Status'];

        // Map filtered sessions to CSV rows
        const rows = filtered.map(session => [
            `"${session.quizTitle.replace(/"/g, '""')}"`, // Escape quotes
            new Date(session.date).toLocaleDateString(),
            session.participantCount.toString(),
            `${session.averageScore}%`,
            session.completed ? 'Completed' : 'In Progress'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create Blob and trigger download natively
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `quiz_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = computeStats(filtered);

    const statCards = [
        { label: 'Total Sessions', value: stats.totalSessions, icon: BarChart2, iconBg: '#EEF2FF', iconColor: '#6366F1' },
        { label: 'Total Participants', value: stats.totalParticipants, icon: Users, iconBg: '#FFF7ED', iconColor: '#F97316' },
        { label: 'Average Score', value: `${stats.avgScore}%`, icon: TrendingUp, iconBg: '#ECFDF5', iconColor: '#10B981' },
        { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: CheckCircle, iconBg: '#FFF3EE', iconColor: '#FF5C1A' },
    ];

    return (
        <div className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <MobileHeader onOpen={() => setIsSidebarOpen(true)} />
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 transition-all duration-300 lg:ml-[240px] px-4 sm:px-8 pb-8 mt-16 lg:mt-0 min-w-0">
                {/* Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-gray-200 mb-7 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-gray-900 m-0">Reports</h1>
                        <button
                            onClick={handleDownloadCSV}
                            disabled={filtered.length === 0 || loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-700 transition-all
                                ${filtered.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:scale-95 shadow-sm'}`}
                        >
                            <DownloadCloud size={16} />
                            Download CSV
                        </button>
                    </div>

                    {/* Date range filter */}
                    <div className="flex p-1 bg-white border border-gray-200 rounded-xl max-w-fit shadow-sm">
                        {DATE_RANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDateFilter(opt.value)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${dateFilter === opt.value ? 'bg-[#FF5C1A] text-white shadow-md shadow-[#FF5C1A]/20' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: card.iconBg }}
                                >
                                    <card.icon size={18} color={card.iconColor} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-gray-900 leading-none">
                                {card.value}
                            </div>
                            <div className="text-[13px] font-bold text-gray-500 mt-2 lowercase">{card.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Session list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr,140px,120px,120px] px-6 py-3 border-b border-gray-50 bg-gray-50/50">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Quiz Title</span>
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Participants</span>
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Avg Score</span>
                            </div>

                            {loading ? (
                                <div className="py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-gray-100 border-t-[#FF5C1A] rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-bold text-gray-500">Loading your analytics...</p>
                                </div>
                            ) : error ? (
                                <div className="p-12 text-center text-red-500 text-sm font-bold">{error}</div>
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center px-6">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Calendar size={32} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No sessions yet</h3>
                                    <p className="text-sm font-bold text-gray-500 m-0">Host a quiz to start seeing your analytics here.</p>
                                </div>
                            ) : (
                                filtered.map((session, i) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`grid grid-cols-[1fr,140px,120px,120px] px-6 py-4 items-center hover:bg-gray-50 transition-colors
                                            ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <span className="text-sm font-bold text-gray-900 truncate pr-4">{session.quizTitle}</span>
                                        <span className="text-[13px] font-bold text-gray-500">
                                            {new Date(session.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-[13px] font-bold text-gray-600">
                                            {session.participantCount} students
                                        </span>
                                        <span className={`text-[13px] font-black
                                            ${session.averageScore >= 70 ? 'text-emerald-500' : session.averageScore >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                            {session.averageScore}%
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
