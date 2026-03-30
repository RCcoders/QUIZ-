import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
    Play, Users, CheckCircle, Clock, ArrowRight, Trophy,
    Eye, Copy, Download, XCircle, Pause, Radio, Lock,
    AlertTriangle, MessageSquare, Send, Medal, BarChart2,
    Hash, UserCheck, Target
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import type { Quiz, Question, GameSession, GameParticipant, GameAnswer } from '../types/game';
import { getSocket, connectSocket, disconnectSocket } from '../utils/socket';
import { apiFetch } from '../utils/api';

export function GameHost() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [participants, setParticipants] = useState<GameParticipant[]>([]);
    const [answers, setAnswers] = useState<GameAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setCopied] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    const currentQuestion = session ? questions[session.currentQuestionIndex] : null;

    // Use participant answers from state
    const currentQuestionAnswers = answers.filter(
        a => a.questionIndex === session?.currentQuestionIndex
    );

    // Helper functions to categorize participants
    const getActiveParticipants = () => {
        return participants.filter(p => p.status === 'active');
    };

    const getAnsweredParticipants = () => {
        const activeIds = getActiveParticipants().map(p => p.id);
        return currentQuestionAnswers.filter(a => activeIds.includes(a.participantId));
    };

    const getWaitingParticipants = () => {
        const answeredIds = currentQuestionAnswers.map(a => a.participantId);
        return getActiveParticipants().filter(p => !answeredIds.includes(p.id));
    };

    useEffect(() => {
        initializeGame();
    }, [id]);

    // Socket orchestration for teacher
    useEffect(() => {
        if (!session?.gameCode || !user?.token) return;

        const socket = connectSocket(user.token);

        const onConnect = () => {
            console.log('Socket connected, joining room:', session.gameCode);
            socket.emit('join_room', { gameCode: session.gameCode });
        };

        const onPlayerJoined = (data: any) => {
            setParticipants(prev => {
                const existing = prev.find(p =>
                    (data.participantId && p.id === data.participantId) ||
                    p.socketId === data.socketId
                );

                if (existing) return prev;

                return [...prev, {
                    id: data.participantId || data.socketId,
                    socketId: data.socketId,
                    name: data.name,
                    score: 0,
                    answersCount: 0,
                    status: 'active'
                }];
            });
        };

        const onAnswerReceived = (data: { participantId: string; isCorrect: boolean; pointsEarned: number; timeTakenMs?: number; answer?: string }) => {
            setAnswers(prev => [...prev, {
                participantId: data.participantId,
                questionIndex: session.currentQuestionIndex,
                answer: (data.answer as any) || 'A',
                isCorrect: data.isCorrect,
                pointsEarned: data.pointsEarned,
                timeTakenMs: data.timeTakenMs || 0,
                timestamp: new Date().toISOString()
            } as GameAnswer]);

            setParticipants(prev => prev.map(p =>
                p.id === data.participantId
                    ? { ...p, score: p.score + data.pointsEarned, answersCount: p.answersCount + 1 }
                    : p
            ));
        };

        const onPlayerLeft = (data: { socketId: string, participantId: string }) => {
            console.log('Player left:', data);
            setParticipants(prev => prev.filter(p =>
                (data.participantId ? p.id !== data.participantId : true) &&
                p.socketId !== data.socketId
            ));
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('player_joined', onPlayerJoined);
        socket.on('answer_received', onAnswerReceived);
        socket.on('player_left', onPlayerLeft);

        return () => {
            socket.off('connect', onConnect);
            socket.off('player_joined', onPlayerJoined);
            socket.off('answer_received', onAnswerReceived);
            socket.off('player_left', onPlayerLeft);
        };
    }, [session?.gameCode, user?.token, session?.currentQuestionIndex]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectSocket();
        };
    }, []);

    const initializeGame = async () => {
        if (!id || !user) return;

        try {
            // Fetch the actual quiz
            const quizData = await apiFetch(`/api/quizzes/${id}`);
            setQuiz(quizData);
            setQuestions(quizData.questions);

            // Create a live session on the backend
            const sessionData = await apiFetch('/api/sessions/host', {
                method: 'POST',
                body: JSON.stringify({ quizId: id })
            });

            setSession(sessionData);

            // Initialize participants from database (crucial for reloads or early joiners)
            if (sessionData.participants) {
                setParticipants(sessionData.participants.map((p: any) => ({
                    id: p._id,
                    name: p.name,
                    score: p.score || 0,
                    answersCount: 0,
                    status: 'active'
                })));
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to initialize game:', error);
            setLoading(false);
        }
    };

    const copyGameCode = () => {
        if (session) {
            navigator.clipboard.writeText(session.gameCode ?? '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const startGame = () => {
        if (!session) return;
        const socket = getSocket();
        socket.emit('start_game', { gameCode: session.gameCode });

        // Optimistic update - transition directly to first question
        setSession({ ...session, status: 'question', currentQuestionIndex: 0 });
    };

    const revealAnswer = () => {
        if (!session) return;
        const socket = getSocket();
        socket.emit('reveal_results', { gameCode: session.gameCode });
        setSession({ ...session, status: 'results' });
    };

    const nextQuestion = () => {
        if (!session) return;
        const nextIndex = session.currentQuestionIndex + 1;
        const socket = getSocket();

        if (nextIndex >= questions.length) {
            socket.emit('end_game', { gameCode: session.gameCode });
            setSession({ ...session, status: 'ended', endedAt: new Date().toISOString() });
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            socket.emit('next_question', { gameCode: session.gameCode, nextIndex });
            setSession({ ...session, status: 'question', currentQuestionIndex: nextIndex });
        }
    };

    const endGame = () => {
        if (!session || !confirm('Are you sure you want to end this game?')) return;
        navigate('/teacher');
    };

    const handleKickParticipant = (participantId: string, participantName: string) => {
        if (!confirm(`Are you sure you want to kick ${participantName}?`)) return;
        setParticipants(prev => prev.map(p =>
            p.id === participantId ? { ...p, status: 'kicked' as const } : p
        ));
    };

    const getAnswerDistribution = () => {
        const distribution = { A: 0, B: 0, C: 0, D: 0 };
        currentQuestionAnswers.forEach(a => {
            distribution[a.answer as keyof typeof distribution]++;
        });
        return distribution;
    };

    const handleDownloadResults = () => {
        if (!quiz || !session) return;

        const excelData = participants.map((p, index) => ({
            'Rank': index + 1,
            'Student Name': p.name,
            'Email': p.email,
            'Total Score': p.score,
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`);

        if (confirm('Results downloaded. Return to dashboard?')) {
            navigate('/teacher');
        }
    };

    const joinUrl = session ? `${window.location.origin}/join/${session.gameCode}` : '';

    const [searchQuery, setSearchQuery] = useState('');
    const [sessionPaused, setSessionPaused] = useState(false);
    const [studentsLocked, setStudentsLocked] = useState(false);
    const [activityMessages, setActivityMessages] = useState<{ id: number; text: string; time: string }[]>([
        { id: 1, text: 'Session started', time: 'now' },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const filteredActiveParticipants = getActiveParticipants().filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Elapsed timer for top bar
    useEffect(() => {
        if (session?.status === 'question' || session?.status === 'results') {
            if (!elapsedRef.current) {
                elapsedRef.current = setInterval(() => {
                    setElapsedSeconds(s => s + 1);
                }, 1000);
            }
        }
        return () => {
            if (elapsedRef.current) {
                clearInterval(elapsedRef.current);
                elapsedRef.current = null;
            }
        };
    }, [session?.status]);

    const formatElapsed = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const classAverage = participants.length > 0
        ? Math.round(participants.reduce((sum, p) => sum + p.score, 0) / participants.length)
        : 0;

    const handlePause = () => setSessionPaused(p => !p);
    const handleLockStudents = () => setStudentsLocked(l => !l);
    const handleBroadcast = () => {
        const msg = prompt('Enter broadcast message:');
        if (msg) {
            setActivityMessages(prev => [...prev, { id: Date.now(), text: `📢 ${msg}`, time: 'now' }]);
        }
    };
    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        setActivityMessages(prev => [...prev, { id: Date.now(), text: chatInput, time: 'now' }]);
        setChatInput('');
    };


    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #FF5C1A', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
        );
    }

    if (!quiz || !session) {
        return (
            <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#111827' }}>Failed to initialize game</h2>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: 0, fontFamily: "'Inter', sans-serif" }}>
            {/* Top Navigation Bar */}
            <div style={{
                background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
                padding: '0 32px', height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, background: '#FF5C1A', borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                        <Play fill="currentColor" size={20} />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                        Quizly <span style={{ color: '#94A3B8', fontWeight: 500 }}>Host</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#F8FAFC', borderRadius: 20, padding: '6px 14px',
                        border: '1px solid #E2E8F0',
                    }}>
                        <div style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Teacher Mode</span>
                    </div>
                    <button
                        onClick={() => navigate('/teacher')}
                        style={{
                            background: '#F1F5F9', color: '#374151', border: '1px solid #E2E8F0',
                            borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                {/* Waiting Room */}
                <AnimatePresence mode="wait">
                    {session.status === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Header Section */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                                <div>
                                    <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>Session Lobby</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: '#FFF3EE', color: '#FF5C1A',
                                            borderRadius: 20, padding: '4px 12px',
                                            fontSize: 13, fontWeight: 700, border: '1px solid #FDBA74',
                                        }}>
                                            <div style={{ width: 8, height: 8, background: '#FF5C1A', borderRadius: '50%' }} />
                                            Join at quizly.app/join
                                        </div>
                                        <div style={{
                                            background: '#F1F5F9', color: '#475569',
                                            borderRadius: 20, padding: '4px 12px',
                                            fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0',
                                        }}>
                                            Code: {(session.gameCode ?? '').match(/.{1,3}/g)?.join(' ')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={copyGameCode}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            background: '#F8FAFC', color: '#374151',
                                            border: '1px solid #E2E8F0', borderRadius: 10,
                                            padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                        }}
                                    >
                                        <Copy size={16} />
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={endGame}
                                        style={{
                                            background: 'transparent', color: '#64748B',
                                            border: '1px solid #E2E8F0', borderRadius: 10,
                                            padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                        }}
                                    >
                                        Cancel Session
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                                {/* Left Column: Session Details */}
                                <div>
                                    <div style={{
                                        background: '#FFFFFF', borderRadius: 20, padding: 28,
                                        border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        position: 'sticky', top: 24,
                                    }}>
                                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Session Details</h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
                                            {[
                                                { icon: <Play size={20} />, bg: '#FFF3EE', color: '#FF5C1A', label: 'Quiz Title', value: quiz.title },
                                                { icon: <Users size={20} />, bg: '#EFF6FF', color: '#3B82F6', label: 'Questions', value: `${questions.length} Questions` },
                                                { icon: <Clock size={20} />, bg: '#F5F3FF', color: '#8B5CF6', label: 'Time Limit', value: quiz.timerEnabled ? `${quiz.timerSeconds}s per question` : 'Unlimited' },
                                            ].map(item => (
                                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: 12,
                                                        background: item.bg, color: item.color,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    }}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{item.label}</div>
                                                        <div style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>{item.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{
                                            background: '#F8FAFC', borderRadius: 14, padding: 20,
                                            border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        }}>
                                            <div style={{ background: '#fff', padding: 10, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 12 }}>
                                                <QRCodeSVG value={joinUrl} size={130} />
                                            </div>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textAlign: 'center' }}>
                                                Students can scan this QR code to join instantly
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Students Grid */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{
                                        background: '#FFFFFF', borderRadius: 20,
                                        border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1,
                                    }}>
                                        <div style={{
                                            padding: '18px 24px', borderBottom: '1px solid #F1F5F9',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Students joined</h3>
                                                <span style={{
                                                    background: '#F1F5F9', color: '#475569',
                                                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                                                }}>
                                                    {participants.length}
                                                </span>
                                            </div>
                                            <div style={{ position: 'relative', maxWidth: 280 }}>
                                                <Eye size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search students..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    style={{
                                                        padding: '7px 12px 7px 32px', border: '1px solid #E2E8F0',
                                                        borderRadius: 8, fontSize: 13, outline: 'none',
                                                        background: '#F8FAFC', width: '100%', boxSizing: 'border-box',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 520, background: '#FAFAFA', padding: 16 }}>
                                            {participants.length === 0 ? (
                                                <div style={{
                                                    height: 360, display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                                                }}>
                                                    <div style={{
                                                        width: 72, height: 72, background: '#F1F5F9', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                                    }}>
                                                        <Users size={30} color="#94A3B8" />
                                                    </div>
                                                    <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#475569' }}>Waiting for students to join...</p>
                                                    <p style={{ fontSize: 13, margin: 0 }}>Share the code or QR to get started</p>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                                    gap: 12,
                                                }}>
                                                    {filteredActiveParticipants.map(p => (
                                                        <motion.div
                                                            key={p.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            style={{
                                                                background: '#FFFFFF', borderRadius: 12,
                                                                border: '1px solid #E5E7EB', padding: '14px 10px',
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                gap: 8, position: 'relative',
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 44, height: 44, borderRadius: '50%',
                                                                background: '#FF5C1A', color: '#fff',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 700, fontSize: 18,
                                                            }}>
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'center', wordBreak: 'break-word' }}>
                                                                {p.name}
                                                            </div>
                                                            <button
                                                                onClick={() => handleKickParticipant(p.id, p.name)}
                                                                style={{
                                                                    position: 'absolute', top: 6, right: 6,
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    color: '#CBD5E1', padding: 2,
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'}
                                                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1'}
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{
                                            padding: '16px 24px', background: '#FFFFFF',
                                            borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end',
                                        }}>
                                            <button
                                                onClick={startGame}
                                                disabled={participants.length === 0}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    background: '#FF5C1A', color: '#fff',
                                                    border: 'none', borderRadius: 12,
                                                    padding: '12px 32px', fontWeight: 700, fontSize: 16,
                                                    cursor: participants.length === 0 ? 'not-allowed' : 'pointer',
                                                    opacity: participants.length === 0 ? 0.5 : 1,
                                                }}
                                            >
                                                <Play size={18} fill="currentColor" />
                                                Start Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Question/Results View */}
                    {(session.status === 'question' || session.status === 'results') && currentQuestion && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* ── Task 8.1: Top Bar ── */}
                            <div style={{
                                background: '#fff',
                                borderBottom: '1px solid #E5E7EB',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                marginBottom: 0,
                            }}>
                                {/* Left: quiz title + session badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{quiz.title}</span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: '#F3F4F6', borderRadius: 20, padding: '2px 10px',
                                        fontSize: 12, fontWeight: 700, color: '#6B7280',
                                    }}>
                                        <Hash size={12} />
                                        {session.gameCode}
                                    </span>
                                </div>

                                {/* Center: stats */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{getActiveParticipants().length}</span>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>students</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <BarChart2 size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{classAverage}</span>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>avg pts</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatElapsed(elapsedSeconds)}</span>
                                    </div>
                                    {quiz?.timerEnabled && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            background: timeLeft <= 5 ? '#FEF2F2' : '#FFF3EE',
                                            border: `1px solid ${timeLeft <= 5 ? '#FCA5A5' : '#FF5C1A'}`,
                                            borderRadius: 8, padding: '4px 10px',
                                            color: timeLeft <= 5 ? '#EF4444' : '#FF5C1A',
                                            fontWeight: 800, fontSize: 14,
                                        }}>
                                            {timeLeft}s
                                        </div>
                                    )}
                                </div>

                                {/* Right: action buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={handlePause}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: sessionPaused ? '#FF5C1A' : '#F9FAFB',
                                            color: sessionPaused ? '#fff' : '#374151',
                                            border: '1px solid #E5E7EB', borderRadius: 8,
                                            padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                        }}
                                    >
                                        <Pause size={14} />
                                        {sessionPaused ? 'Resume' : 'Pause'}
                                    </button>
                                    <button
                                        onClick={endGame}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: '#FEF2F2', color: '#EF4444',
                                            border: '1px solid #FECACA', borderRadius: 8,
                                            padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                        }}
                                    >
                                        End Session
                                    </button>
                                </div>
                            </div>

                            {/* ── Task 8.1: Stats Row ── */}
                            <div style={{
                                display: 'flex', gap: 12, padding: '12px 24px',
                                background: '#F5F5F5', borderBottom: '1px solid #E5E7EB',
                            }}>
                                {/* Total Students */}
                                <div style={{
                                    background: '#fff', borderRadius: 10, padding: '10px 20px',
                                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, flex: 1,
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={18} color="#3B82F6" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{participants.length}</div>
                                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Total Students</div>
                                    </div>
                                </div>

                                {/* Present */}
                                <div style={{
                                    background: '#fff', borderRadius: 10, padding: '10px 20px',
                                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, flex: 1,
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserCheck size={18} color="#10B981" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{getActiveParticipants().length}</div>
                                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Present</div>
                                    </div>
                                </div>

                                {/* Answer Status */}
                                <div style={{
                                    background: '#fff', borderRadius: 10, padding: '10px 20px',
                                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12, flex: 2,
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={18} color="#FF5C1A" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Finished: {currentQuestionAnswers.length}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>Remaining: {Math.max(0, getActiveParticipants().length - currentQuestionAnswers.length)}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${getActiveParticipants().length > 0 ? Math.round((currentQuestionAnswers.length / getActiveParticipants().length) * 100) : 0}%`,
                                                background: '#FF5C1A', borderRadius: 3, transition: 'width 0.4s ease',
                                            }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>Answer Status</div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Tasks 8.2 + 8.3: Body ── */}
                            <div style={{ display: 'flex', gap: 0, flex: 1, padding: '20px 24px', alignItems: 'flex-start' }}>

                                {/* ── Task 8.2: Question Card ── */}
                                <div style={{ flex: 1, marginRight: 20 }}>
                                    <div style={{
                                        background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24, marginBottom: 16,
                                    }}>
                                        {/* Badge + progress */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <span style={{
                                                background: '#FF5C1A', color: '#fff', borderRadius: 20,
                                                padding: '3px 12px', fontSize: 12, fontWeight: 700,
                                            }}>
                                                Question {session.currentQuestionIndex + 1} of {questions.length}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                                                {currentQuestionAnswers.length}/{getActiveParticipants().length} answered
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${((session.currentQuestionIndex + 1) / questions.length) * 100}%`,
                                                background: '#FF5C1A', borderRadius: 2,
                                            }} />
                                        </div>

                                        {/* Question text */}
                                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16, lineHeight: 1.4 }}>
                                            {currentQuestion.questionText}
                                        </h2>

                                        {/* Image placeholder */}
                                        <div style={{
                                            height: 80, background: '#F9FAFB', borderRadius: 8,
                                            border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', marginBottom: 20, color: '#9CA3AF', fontSize: 13,
                                        }}>
                                            Image / Media (optional)
                                        </div>

                                        {/* Answer options */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                            {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                                                const optionColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
                                                const isCorrect = currentQuestion.correctAnswer === letter;
                                                const showCorrect = session.status === 'results' && isCorrect;
                                                const answerCount = getAnswerDistribution()[letter];
                                                const percentage = currentQuestionAnswers.length > 0
                                                    ? Math.round((answerCount / currentQuestionAnswers.length) * 100) : 0;

                                                return (
                                                    <div key={letter} style={{
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        padding: '12px 14px', borderRadius: 10,
                                                        border: `2px solid ${showCorrect ? '#10B981' : session.status === 'results' ? '#E5E7EB' : '#E5E7EB'}`,
                                                        background: showCorrect ? '#F0FDF4' : session.status === 'results' && !isCorrect ? '#FAFAFA' : '#fff',
                                                        opacity: session.status === 'results' && !isCorrect ? 0.6 : 1,
                                                        transition: 'all 0.2s',
                                                    }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                                            background: showCorrect ? '#10B981' : optionColors[idx],
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#fff', fontWeight: 800, fontSize: 14,
                                                        }}>
                                                            {letter}
                                                        </div>
                                                        <span style={{ flex: 1, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                                                            {currentQuestion[`option${letter}` as keyof Question]}
                                                        </span>
                                                        {session.status === 'results' && (
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>{percentage}%</span>
                                                        )}
                                                        {showCorrect && <CheckCircle size={18} color="#10B981" />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {session.status === 'question' && (
                                                <button
                                                    onClick={revealAnswer}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        background: '#F9FAFB', color: '#374151',
                                                        border: '1px solid #E5E7EB', borderRadius: 8,
                                                        padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                                    }}
                                                >
                                                    <Eye size={15} /> Show Hint
                                                </button>
                                            )}
                                            {session.status === 'question' && (
                                                <button
                                                    onClick={revealAnswer}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        background: '#F0FDF4', color: '#10B981',
                                                        border: '1px solid #BBF7D0', borderRadius: 8,
                                                        padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                                    }}
                                                >
                                                    <CheckCircle size={15} /> Correct Answer
                                                </button>
                                            )}
                                            <button
                                                onClick={session.status === 'question' ? revealAnswer : nextQuestion}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    background: '#FF5C1A', color: '#fff',
                                                    border: 'none', borderRadius: 8,
                                                    padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                {session.status === 'question'
                                                    ? <><Eye size={15} /> Skip & Reveal</>
                                                    : session.currentQuestionIndex + 1 >= questions.length
                                                        ? <><Trophy size={15} /> Finish Game</>
                                                        : <><ArrowRight size={15} /> Next Question →</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Response distribution (results only) */}
                                    {session.status === 'results' && (
                                        <div style={{
                                            background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20,
                                        }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Response Distribution</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                                    const answerCount = getAnswerDistribution()[letter];
                                                    const percentage = currentQuestionAnswers.length > 0
                                                        ? Math.round((answerCount / currentQuestionAnswers.length) * 100) : 0;
                                                    const isCorrect = currentQuestion.correctAnswer === letter;
                                                    return (
                                                        <div key={letter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <div style={{ width: '100%', height: 100, background: '#F9FAFB', borderRadius: 8, position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${percentage}%` }}
                                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                    style={{
                                                                        position: 'absolute', bottom: 0, width: '100%',
                                                                        background: isCorrect ? '#10B981' : '#CBD5E1',
                                                                    }}
                                                                />
                                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#374151', fontSize: 16 }}>
                                                                    {answerCount}
                                                                </div>
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{letter}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Real-time status (question only) */}
                                    {session.status === 'question' && (
                                        <div style={{
                                            background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>Real-time Status</span>
                                                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                                                    {getAnsweredParticipants().length} answered · {getWaitingParticipants().length} thinking
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {participants.map(p => {
                                                    const answered = currentQuestionAnswers.some(a => a.participantId === p.id);
                                                    return (
                                                        <span key={p.id} style={{
                                                            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                            background: answered ? '#F0FDF4' : '#F9FAFB',
                                                            color: answered ? '#10B981' : '#9CA3AF',
                                                            border: `1px solid ${answered ? '#BBF7D0' : '#E5E7EB'}`,
                                                        }}>
                                                            {p.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Task 8.3: Right Panel ── */}
                                <div style={{ width: 320, flexShrink: 0 }}>
                                    {/* Controls */}
                                    <div style={{
                                        background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16, marginBottom: 12,
                                    }}>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                            <button
                                                onClick={handleLockStudents}
                                                style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    background: studentsLocked ? '#FEF2F2' : '#F9FAFB',
                                                    color: studentsLocked ? '#EF4444' : '#374151',
                                                    border: `1px solid ${studentsLocked ? '#FECACA' : '#E5E7EB'}`,
                                                    borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                                }}
                                            >
                                                <Lock size={14} />
                                                {studentsLocked ? 'Unlock' : 'Lock Students'}
                                            </button>
                                            <button
                                                onClick={handleBroadcast}
                                                style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    background: '#FFF3EE', color: '#FF5C1A',
                                                    border: '1px solid #FDBA74', borderRadius: 8,
                                                    padding: '8px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                                }}
                                            >
                                                <Radio size={14} />
                                                Broadcast
                                            </button>
                                        </div>

                                        {/* Anti-Cheat Monitor */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <AlertTriangle size={14} color="#F59E0B" />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Anti-Cheat Monitor</span>
                                            </div>
                                            <div style={{
                                                maxHeight: 120, overflowY: 'auto', background: '#FFFBEB',
                                                borderRadius: 8, border: '1px solid #FDE68A', padding: 8,
                                            }}>
                                                {participants.length === 0 ? (
                                                    <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>No violations detected</p>
                                                ) : (
                                                    <p style={{ fontSize: 12, color: '#92400E' }}>Monitoring {participants.length} students...</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Feed */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <MessageSquare size={14} color="#6B7280" />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Activity Feed</span>
                                            </div>
                                            <div style={{
                                                maxHeight: 140, overflowY: 'auto', background: '#F9FAFB',
                                                borderRadius: 8, border: '1px solid #E5E7EB', padding: 8, marginBottom: 8,
                                            }}>
                                                {activityMessages.map(msg => (
                                                    <div key={msg.id} style={{ fontSize: 12, color: '#374151', padding: '3px 0', borderBottom: '1px solid #F3F4F6' }}>
                                                        <span style={{ color: '#9CA3AF', marginRight: 4 }}>{msg.time}</span>
                                                        {msg.text}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                                    placeholder="Type a message..."
                                                    style={{
                                                        flex: 1, border: '1px solid #E5E7EB', borderRadius: 8,
                                                        padding: '6px 10px', fontSize: 12, outline: 'none',
                                                    }}
                                                />
                                                <button
                                                    onClick={handleSendChat}
                                                    style={{
                                                        background: '#FF5C1A', color: '#fff', border: 'none',
                                                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center',
                                                    }}
                                                >
                                                    <Send size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Task 8.4: Top Performers Leaderboard ── */}
                                    <div style={{
                                        background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <Trophy size={16} color="#FF5C1A" />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Top Performers</span>
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600 }}>Rank</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600 }}>Student</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>Score</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>Streak</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'right', color: '#9CA3AF', fontWeight: 600 }}>Acc%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {participants.slice(0, 8).map((p, i) => {
                                                    const pAnswers = answers.filter(a => a.participantId === p.id);
                                                    const accuracy = pAnswers.length > 0
                                                        ? Math.round((pAnswers.filter(a => a.isCorrect).length / pAnswers.length) * 100) : 0;
                                                    const medalColors = ['#F59E0B', '#94A3B8', '#CD7C2F'];
                                                    return (
                                                        <motion.tr key={p.id} layout style={{ borderBottom: '1px solid #F9FAFB' }}>
                                                            <td style={{ padding: '6px 6px' }}>
                                                                {i < 3 ? (
                                                                    <Medal size={16} color={medalColors[i]} />
                                                                ) : (
                                                                    <span style={{ color: '#9CA3AF', fontWeight: 700 }}>{i + 1}</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '6px 6px', fontWeight: 600, color: '#374151', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.name}
                                                            </td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#FF5C1A' }}>
                                                                {Math.round(p.score)}
                                                            </td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', color: '#6B7280' }}>
                                                                {p.answersCount ?? 0}
                                                            </td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', color: '#10B981', fontWeight: 600 }}>
                                                                {accuracy}%
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Ended - Final Results */}
                    {session.status === 'ended' && (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                                <div style={{
                                    display: 'inline-block', background: '#FFF3EE', color: '#FF5C1A',
                                    borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
                                }}>
                                    Session Complete
                                </div>
                                <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Victory Lap! ??</h1>
                                <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 16, margin: 0 }}>Incredible performance from all participants</p>
                            </div>

                            {/* Podium */}
                            {participants.length >= 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 40 }}>
                                    {participants.length >= 2 && (
                                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#94A3B8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
                                                {participants[1].name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ background: '#94A3B8', borderRadius: '12px 12px 0 0', padding: '16px 24px', textAlign: 'center', minWidth: 120, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{participants[1].name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>{Math.round(participants[1].score)} pts</div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontSize: 36, marginBottom: 8 }}>??</div>
                                        <div style={{ background: '#FF5C1A', borderRadius: '12px 12px 0 0', padding: '16px 24px', textAlign: 'center', minWidth: 140, height: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{participants[0].name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>{Math.round(participants[0].score)} pts</div>
                                        </div>
                                    </motion.div>
                                    {participants.length >= 3 && (
                                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#CD7C2F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                                                {participants[2].name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ background: '#CD7C2F', borderRadius: '12px 12px 0 0', padding: '16px 24px', textAlign: 'center', minWidth: 120, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{participants[2].name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>{Math.round(participants[2].score)} pts</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Results Table */}
                            <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 28, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Detailed Breakdown</h3>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={handleDownloadResults} style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            background: '#F8FAFC', color: '#475569',
                                            border: '1px solid #E2E8F0', borderRadius: 10,
                                            padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                        }}>
                                            <Download size={16} />
                                            Export CSV
                                        </button>
                                        <button onClick={() => navigate('/teacher')} style={{
                                            background: '#FF5C1A', color: '#fff',
                                            border: 'none', borderRadius: 10,
                                            padding: '9px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                        }}>
                                            Back to Dashboard
                                        </button>
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rank</th>
                                                <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</th>
                                                <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Score</th>
                                                {questions.map((_, i) => (
                                                    <th key={i} style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Q{i + 1}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {participants.map((p, i) => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                    <td style={{ padding: '16px 0', fontWeight: 800, color: '#0F172A' }}>{i + 1}</td>
                                                    <td style={{ padding: '16px 8px' }}>
                                                        <div style={{ fontWeight: 700, color: '#334155' }}>{p.name}</div>
                                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{p.email}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: '#FF5C1A' }}>{Math.round(p.score)}</td>
                                                    {questions.map((q, qIndex) => {
                                                        const answer = answers.find(a => a.participantId === p.id && a.questionIndex === qIndex);
                                                        const isCorrect = answer?.isCorrect;
                                                        return (
                                                            <td key={qIndex} style={{ padding: '16px 4px', textAlign: 'center' }}>
                                                                {answer ? (
                                                                    <div style={{
                                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                        width: 28, height: 28, borderRadius: 6, fontWeight: 800, fontSize: 11,
                                                                        background: isCorrect ? '#ECFDF5' : '#FEF2F2',
                                                                        color: isCorrect ? '#10B981' : '#EF4444',
                                                                        border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECACA'}`,
                                                                    }}>
                                                                        {answer.answer}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#CBD5E1', fontWeight: 700, fontSize: 11 }}>�</div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
