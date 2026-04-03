import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, CheckCircle, TrendingUp, Calendar, DownloadCloud } from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { TeacherHeader } from '../components/TeacherHeader';
import { apiFetch } from '../utils/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { QuizSession, DateRange } from '../types/teacher';
import { filterSessionsByDate } from '../utils/reportFilters';

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

function computeDetailedInsights(sessions: QuizSession[]) {
    if (sessions.length === 0) return null;

    const sortedByScore = [...sessions].sort((a, b) => b.averageScore - a.averageScore);
    const topQuiz = sortedByScore[0];
    const bottomQuiz = sortedByScore[sessions.length - 1];

    // Peak day calculation
    const dayCounts: Record<number, number> = {};
    sessions.forEach(s => {
        const day = new Date(s.date).getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDayIndex = Object.entries(dayCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    const peakDay = days[parseInt(peakDayIndex)];

    return { topQuiz, bottomQuiz, peakDay };
}

export function Reports() {
    const [sessions, setSessions] = useState<QuizSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateRange>('all');
    const [visibleCount, setVisibleCount] = useState(5);
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await apiFetch('/api/reports');
                setSessions(data);
            } catch (err: any) {
                console.error("Failed to fetch reports:", err);
                setError(err.message || 'Failed to load reports');
            } finally {
                // Simulate slightly longer loading for smooth transition to skeletons
                setTimeout(() => setLoading(false), 600);
            }
        };
        fetchReports();
    }, []);

    const filtered = filterSessionsByDate(sessions, dateFilter);
    const stats = computeStats(filtered);
    const insights = computeDetailedInsights(filtered);

    const handleDownloadCSV = () => {
        if (filtered.length === 0) return;
        const headers = ['Quiz Title', 'Date', 'Participants', 'Average Score', 'Status'];
        const rows = filtered.map(session => [
            `"${session.quizTitle.replace(/"/g, '""')}"`,
            new Date(session.date).toLocaleDateString(),
            session.participantCount.toString(),
            `${session.averageScore}%`,
            session.completed ? 'Completed' : 'In Progress'
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `quiz_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] overflow-x-hidden">
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 transition-all duration-300 lg:ml-[240px] px-4 sm:px-8 pb-12 min-w-0">
                <TeacherHeader
                    title="Reports Dashboard"
                    showSearch={false}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Export / Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-8 gap-4 bg-white/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        {/* Date range filter */}
                        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                            {DATE_RANGE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDateFilter(opt.value)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                        ${dateFilter === opt.value ? 'bg-[#FF5C1A] text-white shadow-lg shadow-[#FF5C1A]/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleDownloadCSV}
                            disabled={filtered.length === 0 || loading}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-[13px] font-bold text-gray-700 transition-all shadow-sm
                                ${filtered.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#FF5C1A] hover:text-[#FF5C1A] active:scale-95'}`}
                        >
                            <DownloadCloud size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                    {[
                        { label: 'Sessions', value: stats.totalSessions, icon: BarChart2, color: 'indigo' },
                        { label: 'Participants', value: stats.totalParticipants, icon: Users, color: 'orange' },
                        { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'emerald' },
                        { label: 'Completion', value: `${stats.completionRate}%`, icon: CheckCircle, color: 'blue' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between mb-2 sm:mb-4">
                                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon size={isMobile ? 18 : 24} />
                                </div>
                            </div>
                            {loading ? (
                                <div className="h-7 sm:h-9 w-16 sm:w-24 bg-gray-100 rounded-lg animate-pulse" />
                            ) : (
                                <div className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">{stat.value}</div>
                            )}
                            <div className="text-[10px] sm:text-[13px] font-black text-gray-400 mt-1 sm:mt-2 tracking-wide uppercase">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Reports Table (8 columns) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 sm:px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight m-0">Recent Activity</h2>
                            {!loading && (
                                <span className="text-[10px] sm:text-[11px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                                    {filtered.length} Reports
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-8 space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="p-16 text-center text-red-500 font-bold">{error}</div>
                            ) : filtered.length === 0 ? (
                                <div className="py-24 text-center px-8">
                                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Calendar size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">No activity recorded</h3>
                                    <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">Host a live quiz to start generating performance data and insights.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-5 sm:px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Quiz Details</th>
                                            <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Score</th>
                                            <th className="px-2 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center hidden sm:table-cell">Students</th>
                                            <th className="px-5 sm:px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.slice(0, visibleCount).map((session, i) => (
                                            <tr
                                                key={session.id}
                                                className={`group transition-colors hover:bg-gray-50/80 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
                                            >
                                                <td className="px-5 sm:px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 truncate max-w-[200px] sm:max-w-md group-hover:text-[#FF5C1A] transition-colors">{session.quizTitle}</span>
                                                        <span className="text-[11px] font-bold text-gray-400 mt-0.5">{new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`text-[13px] font-black px-3 py-1 rounded-lg ${session.averageScore >= 80 ? 'bg-emerald-50 text-emerald-600' :
                                                        session.averageScore >= 50 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {session.averageScore}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-gray-600">
                                                        <Users size={14} className="text-gray-300" />
                                                        <span className="text-[13px] font-bold">{session.participantCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border ${session.completed ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : 'bg-amber-50/50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {session.completed ? 'Completed' : 'In Progress'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {filtered.length > visibleCount && (
                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 10)}
                                    className="text-[12px] font-black text-[#FF5C1A] hover:underline uppercase tracking-tight"
                                >
                                    View More ({filtered.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Insights Panel (4 columns) */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Summary Widget */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-base font-black text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-[#FF5C1A]" />
                                Smart Insights
                            </h3>

                            <div className="space-y-6">
                                {/* Top Quiz */}
                                <div className="group">
                                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                        Top Performance
                                        <TrendingUp size={12} className="text-emerald-500" />
                                    </div>
                                    {loading ? (
                                        <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                                    ) : insights?.topQuiz ? (
                                        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50 group-hover:border-emerald-100 transition-colors">
                                            <div className="text-sm font-black text-gray-900 mb-1 truncate">{insights.topQuiz.quizTitle}</div>
                                            <div className="text-[11px] font-bold text-emerald-600">Avg. Score: {insights.topQuiz.averageScore}%</div>
                                        </div>
                                    ) : <div className="text-xs font-bold text-gray-400 italic">No data yet</div>}
                                </div>

                                {/* Lowest Quiz */}
                                <div className="group">
                                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                        Growth Focus
                                        <BarChart2 size={12} className="text-red-400" />
                                    </div>
                                    {loading ? (
                                        <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                                    ) : insights?.bottomQuiz ? (
                                        <div className="p-4 bg-red-50/30 rounded-2xl border border-red-50 group-hover:border-red-100 transition-colors">
                                            <div className="text-sm font-black text-gray-900 mb-1 truncate">{insights.bottomQuiz.quizTitle}</div>
                                            <div className="text-[11px] font-bold text-red-500">Avg. Score: {insights.bottomQuiz.averageScore}%</div>
                                        </div>
                                    ) : <div className="text-xs font-bold text-gray-400 italic">No data yet</div>}
                                </div>

                                {/* Peak Day */}
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Peak Activity</div>
                                            {loading ? (
                                                <div className="h-6 w-20 bg-gray-50 rounded-lg animate-pulse" />
                                            ) : (
                                                <div className="text-lg font-black text-gray-900">{insights?.peakDay || '—'}</div>
                                            )}
                                        </div>
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Calendar size={22} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp size={80} />
                            </div>
                            <h4 className="text-lg font-black mb-2 relative z-10">Advanced Analytics</h4>
                            <p className="text-[13px] font-bold text-gray-400 mb-6 relative z-10 leading-relaxed">
                                Unlock individual student progress tracking and AI-powered performance summaries.
                            </p>
                            <button className="w-full py-3 bg-white text-gray-900 rounded-xl text-[13px] font-black uppercase tracking-tight hover:bg-gray-100 transition-colors relative z-10 shadow-xl shadow-black/20">
                                Try Pro Access
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
