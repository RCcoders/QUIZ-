import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, CheckCircle, BarChart2, BookOpen, Users, HelpCircle } from 'lucide-react';
import { StudentNavbar } from '../components/StudentNavbar';
import { useAuth } from '../contexts/AuthContext';
import { useStudentStats } from '../hooks/useStudentStats';
import { useBadges } from '../hooks/useBadges';
import { BadgeList } from '../components/BadgeList';
import ToastNotification from '../components/ToastNotification';
import { evaluateBadges } from '../lib/badgeEngine';
import { getContinueLearning, getInitials } from '../utils/scoring';
import { useBreakpoint } from '../hooks/useBreakpoint';
import type { BadgeRecord } from '../types/student';

const RECOMMENDED_QUIZZES = [
    { id: 'practice-quiz', title: 'Machine Learning', description: 'Test your ML fundamentals with 10 questions.', color: '#3B82F6', bg: '#EFF6FF', emoji: '🤖' },
    { id: 'practice-sql', title: 'SQL Fundamentals', description: 'Master database queries with 10 SQL questions.', color: '#10B981', bg: '#ECFDF5', emoji: '🗄️' },
    { id: 'practice-nn', title: 'Neural Networks', description: 'Deep dive into neurons, layers, and training.', color: '#8B5CF6', bg: '#F5F3FF', emoji: '🧠' },
    { id: 'practice-vcs', title: 'Version Control', description: 'Check your Git command knowledge.', color: '#FF5C1A', bg: '#FFF3EE', emoji: '🌿' },
];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StudentDashboard() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const { records, streak, averageScore, totalCompleted, loading } = useStudentStats(user?._id);
    const { badges, loading: badgesLoading } = useBadges(user?._id);
    const [newBadges, setNewBadges] = useState<BadgeRecord[]>([]);
    const prevRecordsLengthRef = useRef<number | null>(null);
    const { isMobile } = useBreakpoint();

    useEffect(() => {
        document.title = 'My Dashboard — Quizly';
    }, []);

    // After records update (new score saved), evaluate badges asynchronously
    useEffect(() => {
        const uid = user?._id;
        if (!uid || loading) return;
        // Only trigger when records length increases (new score recorded)
        if (prevRecordsLengthRef.current === null) {
            prevRecordsLengthRef.current = records.length;
            return;
        }
        if (records.length > prevRecordsLengthRef.current) {
            prevRecordsLengthRef.current = records.length;
            // Non-blocking: never awaited in the render path
            evaluateBadges(uid, records, streak).then((awarded) => {
                if (awarded.length > 0) {
                    setNewBadges((prev) => [...prev, ...awarded]);
                }
            }).catch(() => {
                // Badge evaluation failure is silent — never blocks the UI
            });
        } else {
            prevRecordsLengthRef.current = records.length;
        }
    }, [records, loading, user?._id, streak]);

    const handleDismissToast = () => {
        setNewBadges((prev) => prev.slice(1));
    };

    const continueLearning = getContinueLearning(records, 3);

    const displayName = userProfile?.displayName ?? user?.email ?? 'Student';
    const initials = getInitials(displayName);

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
            <StudentNavbar activePage="/student/dashboard" />

            {/* Toast notification for newly awarded badges — shown one at a time */}
            {newBadges.length > 0 && (
                <ToastNotification
                    badge={newBadges[0]}
                    onDismiss={handleDismissToast}
                />
            )}

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>

                {/* Welcome header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                    {userProfile?.avatarUrl ? (
                        <img
                            src={userProfile.avatarUrl}
                            alt={displayName}
                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: '#6366F1', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 700,
                        }}>
                            {initials}
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
                            Welcome back, {displayName}!
                        </h1>
                        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
                            Keep up the great work.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div
                        data-testid="stats-loading"
                        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}
                    >
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                background: '#fff', borderRadius: 12, padding: '20px 24px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', height: 84,
                                animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6,
                            }} />
                        ))}
                    </div>
                ) : records.length === 0 ? (
                    <div
                        data-testid="empty-state"
                        style={{
                            background: '#fff', borderRadius: 16, padding: '60px 24px',
                            textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 32,
                        }}
                    >
                        <div style={{
                            width: 64, height: 64, background: '#EEF2FF', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        }}>
                            <BookOpen size={28} color="#6366F1" />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                            No quizzes completed yet
                        </h2>
                        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
                            Take your first quiz to start tracking your progress!
                        </p>
                        <Link
                            to="/student"
                            style={{
                                display: 'inline-block', background: '#6366F1', color: '#fff',
                                padding: '10px 24px', borderRadius: 8, fontWeight: 600,
                                fontSize: 14, textDecoration: 'none',
                            }}
                        >
                            Browse Quizzes
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Stats row */}
                        <div
                            data-testid="stats-row"
                            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}
                        >
                            <div style={{
                                background: '#fff', borderRadius: 12, padding: '20px 24px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16,
                            }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Flame size={22} color="#FF5C1A" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }} data-testid="streak-count">{streak}</div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Day Streak</div>
                                </div>
                            </div>

                            <div style={{
                                background: '#fff', borderRadius: 12, padding: '20px 24px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16,
                            }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={22} color="#10B981" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }} data-testid="total-completed">{totalCompleted}</div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Quizzes Completed</div>
                                </div>
                            </div>

                            <div style={{
                                background: '#fff', borderRadius: 12, padding: '20px 24px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16,
                            }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart2 size={22} color="#6366F1" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }} data-testid="average-score">{averageScore}%</div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Average Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Continue Learning */}
                        <section style={{ marginBottom: 32 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                                Continue Learning
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {continueLearning.map((record: any) => (
                                    <div
                                        key={record._id || record.id}
                                        onClick={() => navigate(`/student/quiz/${record.quizId}`)}
                                        style={{
                                            background: '#fff', borderRadius: 12, padding: '20px 24px',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)')}
                                    >
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                                            {record.quizTitle}
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}>
                                            <span>Score: <strong style={{ color: '#111827' }}>{record.score}/{record.total}</strong></span>
                                            <span>{formatDate(record.completedAt)}</span>
                                        </div>
                                        <div style={{ marginTop: 12, height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${record.percentage}%`, height: '100%',
                                                background: record.percentage >= 80 ? '#10B981' : record.percentage >= 60 ? '#6366F1' : '#FF5C1A',
                                                borderRadius: 99,
                                            }} />
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: 12, color: '#9CA3AF', textAlign: 'right' }}>
                                            {record.percentage}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {/* My Badges */}
                <section style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                        My Badges
                    </h2>
                    <BadgeList badges={badges} loading={badgesLoading} />
                </section>

                {/* Recommended Quizzes */}
                <section style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                        Recommended Quizzes
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {RECOMMENDED_QUIZZES.map(quiz => (
                            <Link key={quiz.id} to={`/student/quiz/${quiz.id}`} style={{ textDecoration: 'none' }}>
                                <div
                                    style={{
                                        background: '#fff', borderRadius: 12, padding: '20px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: quiz.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                                    }}>
                                        <HelpCircle size={22} color={quiz.color} />
                                    </div>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                                        {quiz.title}
                                    </h3>
                                    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                                        {quiz.description}
                                    </p>
                                    <div style={{
                                        width: '100%', background: '#FF5C1A', color: '#fff',
                                        borderRadius: 8, padding: '8px 0',
                                        fontWeight: 600, fontSize: 13, marginTop: 'auto',
                                    }}>
                                        Start Quiz
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Join Live Game CTA */}
                <div style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    borderRadius: 16, padding: isMobile ? '24px 20px' : '32px 40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left',
                    flexWrap: 'wrap', gap: 16,
                }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                            Ready for a live challenge?
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                            Join a teacher-hosted game session with a game code.
                        </p>
                    </div>
                    <Link
                        to="/join"
                        data-testid="join-live-game-btn"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: '#fff', color: '#6366F1',
                            padding: '12px 28px', borderRadius: 10,
                            fontWeight: 700, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                    >
                        <Users size={18} />
                        Join Live Game
                    </Link>
                </div>

            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }`}</style>
        </div>
    );
}
