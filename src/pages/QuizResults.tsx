import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BarChart2 } from 'lucide-react';

export function QuizResults() {
    const { id } = useParams();

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif", padding: '40px 24px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Back button */}
                <Link
                    to="/teacher"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        color: '#6B7280', textDecoration: 'none',
                        fontSize: 14, fontWeight: 600, marginBottom: 24,
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>

                {/* Header card */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: '24px 28px',
                    marginBottom: 20,
                }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                        Quiz Results
                    </h1>
                    <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                        Quiz ID: <span style={{ fontWeight: 600, color: '#374151' }}>{id}</span>
                    </p>
                </div>

                {/* Empty state card */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: '64px 24px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: 64, height: 64,
                        background: '#F3F4F6',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <BarChart2 size={32} color="#9CA3AF" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                        No responses yet
                    </h3>
                    <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                        Students will appear here once they complete the quiz.
                    </p>
                </div>
            </div>
        </div>
    );
}
