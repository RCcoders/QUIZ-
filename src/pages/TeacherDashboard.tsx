import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus, Search, Bell, Settings, FileText, TrendingUp,
    BookOpen, Users, BarChart2, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSidebar } from '../components/TeacherSidebar';

interface QuizWithCount {
    id: string;
    title: string;
    isActive: boolean;
    questionCount?: number;
}

// Stat card data
const statCards = [
    {
        label: 'Total Quizzes',
        value: '128',
        change: '+12%',
        positive: true,
        icon: BookOpen,
        iconBg: '#EEF2FF',
        iconColor: '#6366F1',
    },
    {
        label: 'Active Sessions',
        value: '5',
        change: '+25%',
        positive: true,
        icon: TrendingUp,
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
    },
    {
        label: 'Total Students',
        value: '842',
        change: '-1%',
        positive: false,
        icon: Users,
        iconBg: '#FFF7ED',
        iconColor: '#F97316',
    },
    {
        label: 'Average Score',
        value: '76.2%',
        change: '+5.4%',
        positive: true,
        icon: BarChart2,
        iconBg: '#FFF3EE',
        iconColor: '#FF5C1A',
    },
];

// Weekly bar chart data (heights as percentages)
const weeklyData = [
    { day: 'Mon', pct: 72 },
    { day: 'Tue', pct: 58 },
    { day: 'Wed', pct: 88 },
    { day: 'Thu', pct: 52 },
    { day: 'Fri', pct: 76 },
    { day: 'Sat', pct: 40 },
    { day: 'Sun', pct: 30 },
];

export function TeacherDashboard() {
    const { user } = useAuth();
    const [quizzes] = useState<QuizWithCount[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Derive teacher initials from email or display name
    const teacherInitials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'T';

    // Derive display name for greeting
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Teacher';

    return (
        /* ── 3.1 Page shell: flex row, sidebar + main ── */
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
            <TeacherSidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '0 2rem 2rem', marginLeft: '240px' }}>

                {/* ── 3.1 Top bar ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px 0',
                    borderBottom: '1px solid #E5E7EB',
                    marginBottom: '28px',
                }}>
                    {/* Search */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search
                            size={16}
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
                        />
                        <input
                            type="text"
                            placeholder="Search quizzes, students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 40px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '10px',
                                background: '#FFFFFF',
                                fontSize: '14px',
                                color: '#111827',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Bell */}
                    <button style={{
                        width: '40px', height: '40px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}>
                        <Bell size={18} color="#6B7280" />
                    </button>

                    {/* Settings */}
                    <button style={{
                        width: '40px', height: '40px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}>
                        <Settings size={18} color="#6B7280" />
                    </button>

                    {/* Avatar */}
                    <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '50%',
                        background: '#FF5C1A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '14px',
                        flexShrink: 0,
                    }}>
                        {teacherInitials}
                    </div>
                </div>

                {/* ── 3.2 Welcome row ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>
                            Hello, {displayName}! 👋
                        </h1>
                        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                            Welcome back! Here's how your classes are performing today.
                        </p>
                    </div>
                    <Link
                        to="/teacher/quiz/new"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FF5C1A',
                            color: '#FFFFFF',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        <Plus size={16} />
                        Create New Quiz
                    </Link>
                </div>

                {/* ── 3.2 Stat cards ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '16px',
                    marginBottom: '28px',
                }}>
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '14px',
                                padding: '20px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                {/* Icon circle */}
                                <div style={{
                                    width: '40px', height: '40px',
                                    borderRadius: '10px',
                                    background: card.iconBg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <card.icon size={18} color={card.iconColor} />
                                </div>
                                {/* Change badge */}
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: card.positive ? '#10B981' : '#EF4444',
                                    background: card.positive ? '#ECFDF5' : '#FEF2F2',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                }}>
                                    {card.change}
                                </span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                                {card.value}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
                                {card.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── 3.3 + 3.4 Main content: Recent Quizzes + Performance ── */}
                <div style={{ display: 'flex', gap: '24px', flex: 1 }}>

                    {/* ── 3.3 Recent Quizzes (60%) ── */}
                    <div style={{ flex: '0 0 60%', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>Recent Quizzes</h2>
                            <Link to="#" style={{ fontSize: '13px', color: '#FF5C1A', fontWeight: 600, textDecoration: 'none' }}>
                                View All
                            </Link>
                        </div>

                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            overflow: 'hidden',
                        }}>
                            {filteredQuizzes.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '56px', height: '56px',
                                        background: '#F3F4F6',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px',
                                    }}>
                                        <FileText size={28} color="#9CA3AF" />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                                        No quizzes found
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 20px' }}>
                                        {searchQuery ? 'No quizzes match your search.' : 'Start by creating your first quiz!'}
                                    </p>
                                    {!searchQuery && (
                                        <Link
                                            to="/teacher/quiz/new"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: '#FF5C1A', color: '#FFFFFF',
                                                padding: '8px 20px', borderRadius: '8px',
                                                fontWeight: 600, fontSize: '14px', textDecoration: 'none',
                                            }}
                                        >
                                            <Plus size={14} />
                                            Create Quiz
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                filteredQuizzes.slice(0, 5).map((quiz, i) => (
                                    <motion.div
                                        key={quiz.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '14px 20px',
                                            borderBottom: i < filteredQuizzes.slice(0, 5).length - 1 ? '1px solid #F3F4F6' : 'none',
                                        }}
                                    >
                                        {/* Quiz icon */}
                                        <div style={{
                                            width: '44px', height: '44px',
                                            borderRadius: '10px',
                                            background: '#FFF3EE',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            fontSize: '18px', fontWeight: 700, color: '#FF5C1A',
                                        }}>
                                            {quiz.title[0]?.toUpperCase()}
                                        </div>

                                        {/* Title + meta */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {quiz.title}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                                                {quiz.questionCount ?? 0} questions · 10 students
                                            </div>
                                        </div>

                                        {/* Avg score */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>82%</div>
                                            <div style={{ fontSize: '11px', color: '#10B981' }}>avg score</div>
                                        </div>

                                        {/* Status badge */}
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '3px 10px',
                                            borderRadius: '999px',
                                            background: quiz.isActive ? '#ECFDF5' : '#F3F4F6',
                                            color: quiz.isActive ? '#10B981' : '#6B7280',
                                            flexShrink: 0,
                                        }}>
                                            {quiz.isActive ? 'Active' : 'Draft'}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── 3.4 Performance panel (40%) ── */}
                    <div style={{ flex: '0 0 calc(40% - 24px)', minWidth: 0 }}>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Performance</h2>

                        {/* Bar chart card */}
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            padding: '20px',
                            marginBottom: '16px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Weekly Quiz Completion</span>
                                <TrendingUp size={16} color="#9CA3AF" />
                            </div>

                            {/* CSS bar chart */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', marginBottom: '12px' }}>
                                {weeklyData.map((d) => (
                                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${d.pct}%`,
                                            background: '#FF5C1A',
                                            borderRadius: '4px 4px 0 0',
                                            opacity: 0.85,
                                        }} />
                                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{d.day}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>92%</div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Weekly completion rate</div>
                        </div>

                        {/* Avg student time card */}
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            padding: '20px',
                            marginBottom: '16px',
                        }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>Avg Student Time</div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827' }}>18m 42s</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Per quiz completion</div>
                        </div>

                        {/* Download Report button */}
                        <button style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: '#FFF3EE',
                            border: '1px solid #FDDCCC',
                            borderRadius: '10px',
                            color: '#FF5C1A',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}>
                            <Download size={16} />
                            Download Report PDF
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
