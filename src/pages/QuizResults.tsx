import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Download, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { getQuiz, getResponsesByQuiz, type Quiz, type Response } from '../lib/database';

export function QuizResults() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        if (!id) return;
        try {
            const quizData = await getQuiz(id);
            if (quizData) {
                setQuiz(quizData);
            }

            const responsesData = await getResponsesByQuiz(id);
            // Sort by score descending
            responsesData.sort((a, b) => b.score - a.score);
            setResponses(responsesData);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResponses = responses.filter(r =>
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const averageScore = responses.length > 0
        ? Math.round(responses.reduce((sum, r) => sum + (r.score / r.totalQuestions * 100), 0) / responses.length)
        : 0;

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Score', 'Total Questions', 'Percentage', 'Completed At'];
        const rows = responses.map(r => [
            r.studentName,
            r.studentEmail,
            r.score,
            r.totalQuestions,
            `${Math.round(r.score / r.totalQuestions * 100)}%`,
            r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress'
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quiz?.title || 'quiz'}_results.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="page">
                <div className="container text-center">
                    <h2>Quiz not found</h2>
                    <Link to="/teacher" className="btn btn-primary mt-lg">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <Link to="/teacher" className="btn btn-secondary btn-sm mb-md">
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="page-title">{quiz.title} - Results</h1>
                            <p className="page-subtitle">{responses.length} responses</p>
                        </div>
                        <button onClick={exportCSV} className="btn btn-secondary" disabled={responses.length === 0}>
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-3 mb-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card text-center"
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                            {responses.length}
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Total Responses</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card text-center"
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-success)' }}>
                            {averageScore}%
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Average Score</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card text-center"
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                            {responses.filter(r => r.completedAt).length}
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Completed</p>
                    </motion.div>
                </div>

                {/* Search */}
                <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                {/* Results Table */}
                {filteredResponses.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <BarChart2 size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <h3>No responses yet</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {searchQuery ? 'No results match your search' : 'Students will appear here once they complete the quiz'}
                        </p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-elevated)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Student</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Score</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResponses.map((response, index) => {
                                    const percentage = Math.round(response.score / response.totalQuestions * 100);
                                    return (
                                        <tr
                                            key={response.id}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                background: index < 3 ? `rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'
                                                    }, 0.05)` : undefined
                                            }}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`leaderboard-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{response.studentName}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{response.studentEmail}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    color: percentage >= 70 ? 'var(--accent-success)' :
                                                        percentage >= 50 ? 'var(--accent-warning)' :
                                                            'var(--accent-error)',
                                                    fontWeight: '600'
                                                }}>
                                                    {response.score}/{response.totalQuestions} ({percentage}%)
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {response.completedAt ? (
                                                    <CheckCircle size={20} color="var(--accent-success)" />
                                                ) : (
                                                    <XCircle size={20} color="var(--accent-warning)" />
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {response.completedAt
                                                    ? new Date(response.completedAt).toLocaleString()
                                                    : 'In Progress'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
