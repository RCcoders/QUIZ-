import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Download, BarChart2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    getQuiz,
    getResponsesByQuiz,
    getGameSessionsByQuiz,
    getParticipants,
    getQuestions,
    getGameAnswers,
    type Quiz,
    type Response
} from '../lib/database';
import { SCORING_CONFIG } from '../config/performance';

export function QuizResults() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [responses, setResponses] = useState<(Response & { status?: string })[]>([]);
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

            // 1. Fetch Self-Paced Responses
            const responsesData = await getResponsesByQuiz(id);

            // 2. Fetch Live Game Sessions & Participants (LATEST SESSION ONLY)
            const sessions = await getGameSessionsByQuiz(id);
            const questions = await getQuestions(id);
            const totalQuestions = questions.length;

            let liveGameResults: Response[] = [];

            if (sessions.length > 0) {
                // Sort sessions by creation date descending and take the most recent
                const latestSession = sessions.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];

                const participants = await getParticipants(latestSession.id);
                const gameAnswers = await getGameAnswers(latestSession.id);

                // Map participants to Response format with CORRECT ANSWER COUNT
                liveGameResults = participants.map(p => {
                    // Count correct answers for this participant
                    const participantAnswers = gameAnswers.filter(a => a.participantId === p.id);
                    const correctCount = participantAnswers.filter(a => a.isCorrect).length;

                    return {
                        id: p.id,
                        quizId: id,
                        studentName: p.name,
                        studentEmail: p.email,
                        score: p.score, // Use stored score (includes speed bonus)
                        totalQuestions: totalQuestions,
                        answers: [],
                        startedAt: p.joinedAt,
                        completedAt: latestSession.endedAt || null,
                        status: p.status // Include status
                    } as Response & { status?: string };
                });
            }

            // 3. Combine and Sort
            const allResults = [...responsesData, ...liveGameResults];

            // Sort by score descending
            allResults.sort((a, b) => b.score - a.score);
            setResponses(allResults);
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

    const maxPointsPerQuestion = SCORING_CONFIG.BASE_POINTS + SCORING_CONFIG.MAX_SPEED_BONUS;

    const averageScore = responses.length > 0
        ? Math.round(responses.reduce((sum, r) => {
            const maxPossible = r.totalQuestions * maxPointsPerQuestion;
            return sum + (maxPossible > 0 ? (r.score / maxPossible * 100) : 0);
        }, 0) / responses.length)
        : 0;

    const exportXLSX = () => {
        const excelData = responses.map((r, index) => {
            const maxPossible = r.totalQuestions * maxPointsPerQuestion;
            const percentage = maxPossible > 0 ? Math.round(r.score / maxPossible * 100) : 0;

            return {
                'Rank': index + 1,
                'Name': r.studentName,
                'Email': r.studentEmail,
                'Score': r.score,
                'Total Questions': r.totalQuestions,
                'Percentage': `${percentage}%`,
                'Completed At': r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress'
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, `${quiz?.title.replace(/[^a-z0-9]/gi, '_') || 'quiz'}_results.xlsx`);
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
                        <button onClick={fetchResults} className="btn btn-secondary mr-sm">
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={exportXLSX} className="btn btn-secondary" disabled={responses.length === 0}>
                            <Download size={18} />
                            Export XLSX
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
                            {isNaN(averageScore) ? 0 : averageScore}%
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
                                    const maxPossible = response.totalQuestions * maxPointsPerQuestion;
                                    const percentage = maxPossible > 0
                                        ? Math.round(response.score / maxPossible * 100)
                                        : 0;
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
                                                {response.status === 'kicked' ? (
                                                    <span style={{
                                                        color: 'var(--accent-error)',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <XCircle size={16} />
                                                        Kicked
                                                    </span>
                                                ) : response.completedAt ? (
                                                    <CheckCircle size={20} color="var(--accent-success)" />
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>In Progress</span>
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
