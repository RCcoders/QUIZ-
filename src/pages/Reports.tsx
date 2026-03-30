import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, CheckCircle, TrendingUp, Calendar, DownloadCloud } from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';
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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
            <TeacherSidebar />

            <main style={{ flex: 1, marginLeft: '240px', padding: '0 2rem 2rem', minWidth: 0 }}>
                {/* Top bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 0', borderBottom: '1px solid #E5E7EB', marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>Reports</h1>
                        <button
                            onClick={handleDownloadCSV}
                            disabled={filtered.length === 0 || loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                                borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF',
                                fontSize: '13px', fontWeight: 600, color: '#374151', cursor: (filtered.length === 0 || loading) ? 'not-allowed' : 'pointer',
                                opacity: (filtered.length === 0 || loading) ? 0.6 : 1, transition: 'all 0.2s'
                            }}
                        >
                            <DownloadCloud size={16} />
                            Download CSV
                        </button>
                    </div>

                    {/* Date range filter */}
                    <div style={{ display: 'flex', gap: '4px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '4px' }}>
                        {DATE_RANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDateFilter(opt.value)}
                                style={{
                                    padding: '6px 14px', borderRadius: '7px', border: 'none',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    background: dateFilter === opt.value ? '#FF5C1A' : 'transparent',
                                    color: dateFilter === opt.value ? '#FFFFFF' : '#6B7280',
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            style={{
                                background: '#FFFFFF', borderRadius: '14px',
                                padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <card.icon size={18} color={card.iconColor} />
                                </div>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                                {card.value}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>{card.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Session list */}
                <div style={{ background: '#FFFFFF', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px',
                        padding: '12px 20px', borderBottom: '1px solid #F3F4F6',
                        fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                        <span>Quiz Title</span>
                        <span>Date</span>
                        <span>Participants</span>
                        <span>Avg Score</span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                            <div style={{
                                width: '40px', height: '40px', border: '3px solid #F3F4F6',
                                borderTopColor: '#FF5C1A', borderRightColor: '#FF5C1A', borderRadius: '50%',
                                animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                            }} />
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', margin: 0 }}>Loading your analytics...</p>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : error ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', color: '#EF4444', margin: 0 }}>{error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                            <div style={{
                                width: '56px', height: '56px', background: '#F3F4F6', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                            }}>
                                <Calendar size={26} color="#9CA3AF" />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                                No sessions yet
                            </h3>
                            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                                Host a quiz to start seeing your analytics here.
                            </p>
                        </div>
                    ) : (
                        filtered.map((session, i) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px',
                                    padding: '14px 20px', alignItems: 'center',
                                    borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                                }}
                            >
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{session.quizTitle}</span>
                                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                    {new Date(session.date).toLocaleDateString()}
                                </span>
                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                                    {session.participantCount} students
                                </span>
                                <span style={{
                                    fontSize: '13px', fontWeight: 700,
                                    color: session.averageScore >= 70 ? '#10B981' : session.averageScore >= 50 ? '#F97316' : '#EF4444',
                                }}>
                                    {session.averageScore}%
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
