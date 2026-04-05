import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
    Play, Users, CheckCircle, Clock, ArrowRight, Trophy,
    Eye, Copy, Download, XCircle, Pause, Radio, Lock,
    AlertTriangle, MessageSquare, Send, Medal, BarChart2,
    Hash, UserCheck, Target, Zap
} from 'lucide-react';
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
    const [finalAnswers, setFinalAnswers] = useState<GameAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
            return (a.lastAnswerTimeMs || 0) - (b.lastAnswerTimeMs || 0);
        });
    }, [participants]);

    const [timeLeft, setTimeLeft] = useState(0);
    const [nextPending, setNextPending] = useState(false);

    const currentQuestion = session ? questions[session.currentQuestionIndex] : null;

    // Use participant answers from state
    const currentQuestionAnswers = answers.filter(
        a => a.questionIndex === session?.currentQuestionIndex
    );

    // ── Task 5: Dynamic Average Stats ──
    const classAveragePts = currentQuestionAnswers.length > 0
        ? (currentQuestionAnswers.reduce((sum, a) => sum + a.pointsEarned, 0) / currentQuestionAnswers.length).toFixed(1)
        : "0.0";

    const classAverageTime = currentQuestionAnswers.length > 0
        ? (currentQuestionAnswers.reduce((sum, a) => sum + (a.timeTakenMs || 0), 0) / currentQuestionAnswers.length / 1000).toFixed(1)
        : "0.0";

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

        const onAnswerReceived = (data: {
            participantId: string;
            isCorrect: boolean;
            pointsEarned: number;
            timeTakenMs?: number;
            answer?: string;
            questionIndex?: number;
        }) => {
            setAnswers(prev => [...prev, {
                participantId: data.participantId,
                questionIndex: data.questionIndex !== undefined ? data.questionIndex : session.currentQuestionIndex,
                answer: (data.answer as any) || 'A',
                isCorrect: data.isCorrect,
                pointsEarned: data.pointsEarned,
                timeTakenMs: data.timeTakenMs || 0,
                timestamp: new Date().toISOString()
            } as GameAnswer]);

            setParticipants(prev => prev.map(p =>
                (p.id === data.participantId)
                    ? { ...p, score: p.score + data.pointsEarned, answersCount: p.answersCount + 1 }
                    : p
            ));
        };

        const onPlayerLeft = (data: { socketId: string, participantId: string }) => {
            setParticipants(prev => {
                // IMPORTANT: If the session has already reached 'results' or 'ended' status,
                // do NOT filter out the participant. This ensures the leaderboard remains intact
                // even if students close their devices after finishing a battle.
                if (session && (session.status === 'results' || session.status === 'ended')) {
                    return prev;
                }

                return prev.filter(p =>
                    (data.participantId ? p.id !== data.participantId : true) &&
                    p.socketId !== data.socketId
                );
            });
        };

        const onViolationReport = (data: { participantId: string, violationCount: number, reason: string }) => {
            setParticipants(prev => prev.map(p =>
                p.id === data.participantId ? { ...p, violationCount: data.violationCount } : p
            ));
            setActivityMessages(prev => [
                { id: Date.now(), text: `⚠️ Violation: ${data.reason} by participant`, time: 'now' },
                ...prev
            ]);
        };

        const onPlayerKicked = (data: { participantId: string }) => {
            setParticipants(prev => prev.map(p =>
                p.id === data.participantId ? { ...p, status: 'kicked' } : p
            ));
        };

        const onGameEnded = (data: { finalParticipants: any[]; finalAnswers?: any[]; session: any }) => {
            setSession(prev => prev ? { ...prev, status: 'ended', endedAt: data.session?.endedAt } : prev);
            setParticipants(data.finalParticipants.map((p: any) => ({
                id: p._id || p.id,
                name: p.name,
                email: p.email,
                score: p.score || 0,
                answersCount: (p.playerAnswers || []).length,
                lastAnswerTimeMs: p.lastAnswerTimeMs || 0,
                violationCount: p.violationCount || 0,
                disqualified: p.disqualified || false,
                status: p.status || 'active',
            })));
            // DB-persisted answers — always correct, even if teacher reloaded
            if (data.finalAnswers && data.finalAnswers.length > 0) {
                setFinalAnswers(data.finalAnswers as GameAnswer[]);
            }
        };

        const onAllAnswered = (data: { session: any }) => {
            setSession(data.session);
        };

        const onAckNextQuestion = () => {
            setNextPending(false);
        };

        const onNextQuestion = (data: { question: any; session: any }) => {
            setSession(data.session);
            setNextPending(false);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('player_joined', onPlayerJoined);
        socket.on('answer_received', onAnswerReceived);
        socket.on('player_left', onPlayerLeft);
        socket.on('violation_report', onViolationReport);
        socket.on('player_kicked', onPlayerKicked);
        socket.on('all_answered', onAllAnswered);
        socket.on('ack_next_question', onAckNextQuestion);
        socket.on('next_question', onNextQuestion);
        socket.on('game_ended', onGameEnded);

        return () => {
            socket.off('connect', onConnect);
            socket.off('player_joined', onPlayerJoined);
            socket.off('answer_received', onAnswerReceived);
            socket.off('player_left', onPlayerLeft);
            socket.off('violation_report', onViolationReport);
            socket.off('player_kicked', onPlayerKicked);
            socket.off('all_answered', onAllAnswered);
            socket.off('ack_next_question', onAckNextQuestion);
            socket.off('next_question', onNextQuestion);
            socket.off('game_ended', onGameEnded);
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
        if (!session || nextPending) return;
        const nextIndex = session.currentQuestionIndex + 1;
        const socket = getSocket();

        if (nextIndex >= questions.length) {
            socket.emit('end_game', { gameCode: session.gameCode });
            setSession({ ...session, status: 'ended', endedAt: new Date().toISOString() });
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            setNextPending(true);
            // Fallback: re-enable after 3 seconds if no ack
            setTimeout(() => setNextPending(false), 3000);
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
        const socket = getSocket();
        socket.emit('kick_player', { gameCode: session?.gameCode, participantId });

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

    const handleDownloadResults = async () => {
        if (!quiz || !session) return;

        try {
            // Dynamic import to reduce initial bundle size
            const XLSX = await import('xlsx');

            const rankedParticipants = participants
                .filter(p => !p.disqualified)
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            const excelData = participants.map((p) => {
                const rank = p.disqualified ? 'N/A' : (rankedParticipants.findIndex(rp => rp.id === p.id) + 1);
                return {
                    'Rank': rank,
                    'Student Name': p.name,
                    'Email': p.email || 'N/A',
                    'Total Score': p.score,
                    'Violations': p.violationCount || 0,
                    'Status': p.disqualified ? 'Disqualified' : 'Qualified'
                };
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Results");
            XLSX.writeFile(wb, `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`);

            if (confirm('Results downloaded. Return to dashboard?')) {
                navigate('/teacher');
            }
        } catch (error) {
            console.error('Failed to export results:', error);
            alert('Failed to export results. Please try again.');
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
        ? (participants.reduce((sum, p) => sum + p.score, 0) / participants.length).toFixed(1)
        : "0.0";

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
        <div className="bg-zinc-50 min-h-screen font-sans">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-zinc-200 px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FF5C1A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Play fill="currentColor" size={20} />
                    </div>
                    <span className="text-lg font-bold text-zinc-900 hidden sm:inline">
                        Quizly <span className="text-zinc-400 font-medium">Host</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-zinc-50 rounded-full px-4 py-1.5 border border-zinc-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Teacher Mode</span>
                    </div>
                    <button
                        onClick={() => navigate('/teacher')}
                        className="bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl px-4 py-2 font-bold text-sm hover:bg-zinc-200 transition-colors"
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8">
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
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">Session Lobby</h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 bg-orange-50 text-[#FF5C1A] rounded-full px-4 py-1.5 text-xs font-bold border border-orange-100">
                                            <div className="w-2 h-2 bg-[#FF5C1A] rounded-full" />
                                            Join at quizly.app/join
                                        </div>
                                        <div className="bg-zinc-100 text-zinc-600 rounded-full px-4 py-1.5 text-xs font-bold border border-zinc-200">
                                            Code: {(session.gameCode ?? '').match(/.{1,3}/g)?.join(' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full lg:w-auto">
                                    <button
                                        onClick={copyGameCode}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-zinc-700 border border-zinc-200 rounded-xl px-5 py-3 font-bold text-sm hover:bg-zinc-50 transition-colors shadow-sm"
                                    >
                                        <Copy size={16} />
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={endGame}
                                        className="flex-1 lg:flex-none bg-white text-zinc-400 border border-zinc-200 rounded-xl px-5 py-3 font-bold text-sm hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                                    >
                                        Cancel Session
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Session Details */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl shadow-zinc-200/50 sticky top-24">
                                        <h3 className="text-lg font-bold text-zinc-900 mb-6 uppercase tracking-wider">Session Details</h3>

                                        <div className="space-y-6 mb-8">
                                            {[
                                                { icon: <Play size={20} />, bg: 'bg-orange-50', color: 'text-orange-500', label: 'Quiz Title', value: quiz.title },
                                                { icon: <Users size={20} />, bg: 'bg-blue-50', color: 'text-blue-500', label: 'Questions', value: `${questions.length} Questions` },
                                                { icon: <Clock size={20} />, bg: 'bg-purple-50', color: 'text-purple-500', label: 'Time Limit', value: quiz.timerEnabled ? `${quiz.timerSeconds}s per question` : 'Unlimited' },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{item.label}</div>
                                                        <div className="font-bold text-zinc-800 text-sm">{item.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex flex-col items-center">
                                            <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                                                <QRCodeSVG value={joinUrl} size={140} />
                                            </div>
                                            <p className="text-xs font-medium text-zinc-400 text-center">
                                                Students scan to join instantly
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Students Grid */}
                                <div className="lg:col-span-2 flex flex-col">
                                    <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden flex flex-col h-full">
                                        <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-zinc-900 leading-none">Warriors Joined</h3>
                                                <span className="bg-zinc-100 text-zinc-600 rounded-full px-3 py-1 text-xs font-black">
                                                    {participants.length}
                                                </span>
                                            </div>
                                            <div className="relative w-full sm:w-64">
                                                <Eye size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm w-full outline-none focus:bg-white focus:border-orange-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[500px] bg-zinc-50/50 p-6 overscroll-contain">
                                            {participants.length === 0 ? (
                                                <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-zinc-100">
                                                        <Users size={28} className="text-zinc-300" />
                                                    </div>
                                                    <p className="font-bold text-zinc-600 mb-1">Waiting for warriors...</p>
                                                    <p className="text-xs">Share the code or QR to start the battle</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {filteredActiveParticipants.map(p => (
                                                        <motion.div
                                                            key={p.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center gap-3 relative group hover:border-orange-500/30 hover:shadow-lg hover:shadow-zinc-200 transition-all cursor-default"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-inner relative">
                                                                {p.name.charAt(0).toUpperCase()}
                                                                {p.violationCount && p.violationCount > 0 && (
                                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                                                        {p.violationCount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs font-bold text-zinc-800 text-center truncate w-full px-2">
                                                                {p.name}
                                                            </div>
                                                            {p.violationCount && p.violationCount > 0 && (
                                                                <div className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Cheating Detected!</div>
                                                            )}
                                                            <button
                                                                onClick={() => handleKickParticipant(p.id, p.name)}
                                                                className="absolute top-2 right-2 text-zinc-200 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 bg-white border-t border-zinc-100 flex justify-end">
                                            <button
                                                onClick={startGame}
                                                disabled={participants.length === 0}
                                                className={`flex items-center gap-3 bg-[#FF5C1A] text-white rounded-2xl px-10 py-4 font-black text-lg transition-all active:scale-95 shadow-xl shadow-orange-500/20 ${participants.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-orange-600'}`}
                                            >
                                                <Play size={20} fill="currentColor" />
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
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap' as const,
                                gap: 12,
                                marginBottom: 0,
                            }}>
                                {/* Left: quiz title + session badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto' }}>
                                    <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: '#F3F4F6', borderRadius: 20, padding: '2px 10px',
                                        fontSize: 12, fontWeight: 700, color: '#6B7280', flexShrink: 0,
                                    }}>
                                        <Hash size={12} />
                                        {session.gameCode}
                                    </span>
                                </div>

                                {/* Center: stats — hidden on very small screens */}
                                <div className="hidden md:flex" style={{ alignItems: 'center', gap: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{getActiveParticipants().length}</span>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>students</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <BarChart2 size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{classAveragePts}</span>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>avg pts</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={15} color="#6B7280" />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{classAverageTime}s</span>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>avg time</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Zap size={15} color="#6B7280" />
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
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
                            {/* ── Task 8.1: Header Stats ── */}
                            <div className="flex flex-wrap md:flex-nowrap gap-3 p-4 bg-[#F5F5F5] border-b border-[#E5E7EB]">
                                {/* Total Students */}
                                <div className="bg-white rounded-xl p-3 md:p-4 border border-[#E5E7EB] flex items-center gap-3 flex-1 min-w-[140px]">
                                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                                        <Users size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-extrabold text-[#111827] leading-none">{participants.length}</div>
                                        <div className="text-[11px] text-[#6B7280] font-semibold mt-1">Total Students</div>
                                    </div>
                                </div>

                                {/* Present */}
                                <div className="bg-white rounded-xl p-3 md:p-4 border border-[#E5E7EB] flex items-center gap-3 flex-1 min-w-[140px]">
                                    <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                        <UserCheck size={18} className="text-green-500" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-extrabold text-[#111827] leading-none">{getActiveParticipants().length}</div>
                                        <div className="text-[11px] text-[#6B7280] font-semibold mt-1">Present</div>
                                    </div>
                                </div>

                                {/* Answer Status */}
                                <div className="bg-white rounded-xl p-3 md:p-4 border border-[#E5E7EB] flex items-center gap-3 flex-1 md:flex-[2] min-w-[200px]">
                                    <div className="w-9 h-9 rounded-lg bg-[#FFF3EE] flex items-center justify-center flex-shrink-0">
                                        <Target size={18} className="text-[#FF5C1A]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold text-green-600">Finished: {currentQuestionAnswers.length}</span>
                                            <span className="text-xs font-bold text-gray-400">Remaining: {Math.max(0, getActiveParticipants().length - currentQuestionAnswers.length)}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#FF5C1A] rounded-full transition-all duration-500"
                                                style={{ width: `${getActiveParticipants().length > 0 ? Math.round((currentQuestionAnswers.length / getActiveParticipants().length) * 100) : 0}%` }}
                                            />
                                        </div>
                                        <div className="text-[11px] text-[#6B7280] mt-1">Answer Status</div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Tasks 8.2 + 8.3: Body ── */}
                            <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 items-start">

                                {/* ── Task 8.2: Question Card ── */}
                                <div className="flex-1 w-full">
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                                            {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                                                const optionColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
                                                const isCorrect = currentQuestion.correctAnswer === letter;
                                                const showCorrect = session.status === 'results' && isCorrect;
                                                const answerCount = getAnswerDistribution()[letter];
                                                const percentage = currentQuestionAnswers.length > 0
                                                    ? Math.round((answerCount / currentQuestionAnswers.length) * 100) : 0;

                                                return (
                                                    <div key={letter} className={`
                                                        flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                                                        ${showCorrect ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}
                                                        ${session.status === 'results' && !isCorrect ? 'opacity-60 grayscale-[0.5]' : ''}
                                                    `}>
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black text-sm"
                                                            style={{ background: showCorrect ? '#10B981' : optionColors[idx] }}
                                                        >
                                                            {letter}
                                                        </div>
                                                        <span className="flex-1 font-bold text-gray-700 text-sm">
                                                            {currentQuestion[`option${letter}` as keyof Question]}
                                                        </span>
                                                        {session.status === 'results' && (
                                                            <span className="text-xs font-bold text-gray-500">{percentage}%</span>
                                                        )}
                                                        {showCorrect && <CheckCircle size={18} className="text-green-500" />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            {session.status === 'question' && (
                                                <button
                                                    onClick={revealAnswer}
                                                    className="flex items-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-4 py-2 font-bold text-xs hover:bg-gray-100 transition-colors"
                                                >
                                                    <Eye size={15} /> Hint
                                                </button>
                                            )}
                                            {session.status === 'question' && (
                                                <button
                                                    onClick={revealAnswer}
                                                    className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-200 rounded-lg px-4 py-2 font-bold text-xs hover:bg-green-100 transition-colors"
                                                >
                                                    <CheckCircle size={15} /> Correct Answer
                                                </button>
                                            )}
                                            <button
                                                onClick={session.status === 'question' ? revealAnswer : nextQuestion}
                                                disabled={session.status === 'results' && nextPending}
                                                className={`flex items-center gap-2 bg-[#FF5C1A] text-white rounded-lg px-5 py-2 font-black text-sm ml-auto transition-colors shadow-sm ${session.status === 'results' && nextPending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#e45217]'}`}
                                            >
                                                {session.status === 'question'
                                                    ? <><Eye size={15} /> Skip & Reveal</>
                                                    : session.currentQuestionIndex + 1 >= questions.length
                                                        ? <><Trophy size={15} /> Finish Game</>
                                                        : nextPending
                                                            ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Advancing...</>
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
                                <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
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
                                                {[...participants]
                                                    .sort((a, b) => {
                                                        if ((b.score || 0) !== (a.score || 0)) {
                                                            return (b.score || 0) - (a.score || 0);
                                                        }
                                                        return (a.lastAnswerTimeMs || 0) - (b.lastAnswerTimeMs || 0);
                                                    })
                                                    .slice(0, 8).map((p, i) => {
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
                                                                    {(p.score).toFixed(1)}
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
                            className="max-w-5xl mx-auto px-4 pb-20"
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
                            {(() => {
                                const sortedP = [...participants].sort((a, b) => {
                                    if ((b.score || 0) !== (a.score || 0)) {
                                        return (b.score || 0) - (a.score || 0);
                                    }
                                    return (a.lastAnswerTimeMs || 0) - (b.lastAnswerTimeMs || 0);
                                });
                                return sortedP.length >= 1 && (
                                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 sm:gap-4 mb-12">
                                        {sortedP.length >= 2 && (
                                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                                className="flex flex-col items-center order-2 sm:order-1">
                                                <div className="w-14 h-14 rounded-full bg-slate-400 text-white flex items-center justify-center font-black text-xl mb-2 shadow-md">
                                                    {sortedP[1].name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="bg-slate-400 rounded-t-2xl p-4 text-center min-w-[140px] h-24 sm:h-32 flex flex-col justify-center shadow-lg">
                                                    <div className="text-white font-black text-base truncate max-w-[120px]">{sortedP[1].name}</div>
                                                    <div className="text-white/80 text-xs font-bold">{(sortedP[1].score).toFixed(1)} pts</div>
                                                </div>
                                            </motion.div>
                                        )}
                                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                            className="flex flex-col items-center order-1 sm:order-2">
                                            <div className="text-4xl mb-2">🏆</div>
                                            <div className="bg-[#FF5C1A] rounded-t-2xl p-5 text-center min-w-[160px] h-32 sm:h-40 flex flex-col justify-center shadow-xl border-b-4 border-[#e45217]">
                                                <div className="text-white font-black text-lg truncate max-w-[140px]">{sortedP[0].name}</div>
                                                <div className="text-white/90 text-sm font-bold">{(sortedP[0].score).toFixed(1)} pts</div>
                                            </div>
                                        </motion.div>
                                        {sortedP.length >= 3 && (
                                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                                                className="flex flex-col items-center order-3">
                                                <div className="w-12 h-12 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-lg mb-2 shadow-md">
                                                    {sortedP[2].name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="bg-amber-700 rounded-t-2xl p-4 text-center min-w-[140px] h-20 sm:h-28 flex flex-col justify-center shadow-lg">
                                                    <div className="text-white font-black text-sm truncate max-w-[120px]">{sortedP[2].name}</div>
                                                    <div className="text-white/80 text-xs font-bold">{(sortedP[2].score).toFixed(1)} pts</div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Detailed Results Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-7 overflow-hidden">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Detailed Breakdown</h3>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={handleDownloadResults} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-slate-100 transition-colors">
                                            <Download size={16} />
                                            Export
                                        </button>
                                        <button onClick={() => navigate('/teacher')} className="flex-1 sm:flex-none bg-[#FF5C1A] text-white rounded-xl px-4 py-2.5 font-black text-sm hover:bg-[#e45217] transition-colors shadow-sm">
                                            Dashboard
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
                                                <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Violations</th>
                                                {questions.map((_, i) => (
                                                    <th key={i} style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Q{i + 1}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...participants]
                                                .filter(p => !p.disqualified)
                                                .sort((a, b) => {
                                                    if ((b.score || 0) !== (a.score || 0)) {
                                                        return (b.score || 0) - (a.score || 0);
                                                    }
                                                    return (a.lastAnswerTimeMs || 0) - (b.lastAnswerTimeMs || 0);
                                                })
                                                .map((p, i) => (
                                                    <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                        <td style={{ padding: '16px 0', fontWeight: 800, color: '#0F172A' }}>{i + 1}</td>
                                                        <td style={{ padding: '16px 8px' }}>
                                                            <div style={{ fontWeight: 700, color: '#334155' }}>{p.name}</div>
                                                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{p.email}</div>
                                                        </td>
                                                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: '#FF5C1A' }}>{(p.score).toFixed(1)}</td>
                                                        <td style={{ padding: '16px 0', textAlign: 'center' }}>
                                                            {(p.violationCount || 0) > 0 ? (
                                                                <span style={{
                                                                    display: 'inline-flex', padding: '2px 8px', borderRadius: 12,
                                                                    fontSize: 10, fontWeight: 800, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA'
                                                                }}>
                                                                    {p.violationCount} {(p.violationCount || 0) === 1 ? 'Alert' : 'Alerts'}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#E2E8F0' }}>—</span>
                                                            )}
                                                        </td>
                                                        {questions.map((q, qIndex) => {
                                                            const answerSource = finalAnswers.length > 0 ? finalAnswers : answers;
                                                            const answer = answerSource.find(a => a.participantId === p.id && a.questionIndex === qIndex);
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
                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#CBD5E1', fontWeight: 700, fontSize: 11 }}>—</div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Disqualified Section */}
                                {participants.some(p => p.disqualified) && (
                                    <div style={{ marginTop: 40, borderTop: '2px dashed #F1F5F9', paddingTop: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <AlertTriangle size={18} className="text-red-500" />
                                            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disqualified Warriors</h4>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                        <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Student</th>
                                                        <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'center' }}>Violations</th>
                                                        <th style={{ paddingBottom: 12, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {participants.filter(p => p.disqualified).map(p => (
                                                        <tr key={p.id} style={{ borderBottom: '1px solid #FFF1F2' }}>
                                                            <td style={{ padding: '12px 8px' }}>
                                                                <div style={{ fontWeight: 700, color: '#334155' }}>{p.name}</div>
                                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{p.email}</div>
                                                            </td>
                                                            <td style={{ padding: '12px 0', textAlign: 'center' }}>
                                                                <span style={{
                                                                    display: 'inline-flex', padding: '4px 12px', borderRadius: 12,
                                                                    fontSize: 11, fontWeight: 800, background: '#EF4444', color: '#fff'
                                                                }}>
                                                                    {p.violationCount} Violations
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 0', fontSize: 12, fontWeight: 600, color: '#B91C1C' }}>
                                                                Exceeded threshold (Max: 3)
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
