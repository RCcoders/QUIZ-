import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    Play, User, Mail, Zap, Trophy, HelpCircle,
    CheckCircle, XCircle, Clock, AlertCircle,
    Globe, Square, Circle, Triangle
} from 'lucide-react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '../utils/socket';
import confetti from 'canvas-confetti';

interface Participant {
    _id?: string;
    id: string;
    name: string;
    score: number;
    lastAnswerCorrect?: boolean;
}

interface Question {
    _id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    points: number;
}

interface Session {
    _id: string;
    gameCode: string;
    status: 'waiting' | 'question' | 'results' | 'ended';
    quizId: string;
    quizTitle: string;
    currentQuestionIndex: number;
    participants: Participant[];
    questionStartedAt?: string;
}

const Diamond = ({ size = 24, fill = "none", className = "" }: any) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2.7 10.3l7 7c1.1 1.1 2.9 1.1 4 0l7-7c1.1-1.1 1.1-2.9 0-4l-7-7c-1.1-1.1-2.9-1.1-4 0l-7 7c-1.1 1.1-1.1 2.9 0 4z" />
    </svg>
);

export function PlayGame() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [gameState, setGameState] = useState<'lobby' | 'playing' | 'results' | 'ended'>('lobby');
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
    const [violationCount, setViolationCount] = useState(0);
    const [gameCode, setGameCode] = useState<string>('');

    const questionsRef = useRef<Question[]>([]);
    const sessionRef = useRef<Session | null>(null);

    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    const { state } = useLocation();
    const playerName = localStorage.getItem('quizly_player_name') || state?.name;
    const participantId = localStorage.getItem('quizly_participant_id') || state?.participantId;

    const pageTitle = session?.quizTitle
        ? `${session.quizTitle} — ${gameState === 'lobby' ? 'Lobby' : (gameState === 'playing' ? `Question ${(session.currentQuestionIndex || 0) + 1}` : (gameState === 'results' ? 'Results' : 'Game Ended'))}`
        : 'Quiz — Quizly';

    useEffect(() => {
        if (!sessionId || !playerName || !participantId) {
            navigate('/join');
            return;
        }
        const newSocket = connectSocket();
        setSocket(newSocket);
        newSocket.emit('join_game', { gameCode: sessionId, name: playerName, participantId });

        newSocket.on('session_state', ({ session, questions }) => {
            if (!session) return;
            setSession(session);
            setGameCode(session.gameCode);
            setQuestions(questions || []);
            const parts = session.participants || [];
            setAllParticipants(parts);
            const currentP = parts.find((p: any) => (p._id || p.id) === participantId);
            setParticipant(currentP);
            updatePosition(parts);

            if (session.status === 'question' || session.status === 'playing') {
                setGameState('playing');
                if (questions && questions[session.currentQuestionIndex]) {
                    setCurrentQuestion(questions[session.currentQuestionIndex]);
                }
                setHasAnswered(false);
            } else if (session.status === 'results') {
                setGameState('results');
                if (questions && questions[session.currentQuestionIndex]) {
                    setCurrentQuestion(questions[session.currentQuestionIndex]);
                }
            } else if (session.status === 'ended') {
                setGameState('ended');
            }
        });

        newSocket.on('player_joined', (p) => {
            setAllParticipants(prev => [...prev.filter(item => (item._id || item.id) !== (p._id || p.id)), p]);
        });

        newSocket.on('player_left', ({ participantId }) => {
            setAllParticipants(prev => prev.filter(p => (p._id || p.id) !== participantId));
        });

        newSocket.on('game_started', () => {
            setGameState('playing');
            if (questionsRef.current && questionsRef.current.length > 0) {
                const currentS = sessionRef.current;
                const idx = currentS ? currentS.currentQuestionIndex || 0 : 0;
                setCurrentQuestion(questionsRef.current[idx]);
            }
            setHasAnswered(false);
        });

        newSocket.on('next_question', ({ question }) => {
            setGameState('playing');
            setCurrentQuestion(question);
            setHasAnswered(false);
            setIsCorrect(null);
            setPointsEarned(0);
        });

        newSocket.on('show_results', ({ participants }) => {
            setGameState('results');
            setAllParticipants(participants);
            const currentP = participants.find((p: any) => (p._id || p.id) === participantId);
            setParticipant(currentP);
            updatePosition(participants);
        });

        newSocket.on('game_ended', ({ finalParticipants }) => {
            setGameState('ended');
            setAllParticipants(finalParticipants);
            const currentP = finalParticipants.find((p: any) => (p._id || p.id) === participantId);
            setParticipant(currentP);
            updatePosition(finalParticipants);
            if (currentP && currentP.score > 0) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
        });

        newSocket.on('answer_result', ({ isCorrect, pointsEarned, newTotalScore }) => {
            setIsCorrect(isCorrect);
            setPointsEarned(pointsEarned);
            setParticipant(prev => prev ? { ...prev, score: newTotalScore } : null);
        });

        newSocket.on('answer_received', ({ participantId: pId, newTotalScore }) => {
            setAllParticipants(prev => {
                const updated = prev.map(p => (p._id || p.id) === pId ? { ...p, score: newTotalScore } : p);
                updatePosition(updated);
                return updated;
            });
        });

        return () => { disconnectSocket(); };
    }, [sessionId, playerName, participantId, navigate]);

    const updatePosition = (participants: Participant[]) => {
        if (!participants || !Array.isArray(participants)) return;
        const sorted = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));
        setCurrentPosition(sorted.findIndex(p => (p._id || p.id) === participantId) + 1);
    };

    const submitAnswer = (answer: string) => {
        if (hasAnswered || !currentQuestion || !socket || !session) return;
        const correct = answer === currentQuestion.correctAnswer;

        // Calculate time taken
        const startTime = session.questionStartedAt ? new Date(session.questionStartedAt).getTime() : Date.now();
        const timeTakenMs = Date.now() - startTime;

        setHasAnswered(true);
        // Optimistic UI can stay, but the server will confirm with 'answer_result'
        setIsCorrect(correct);

        socket.emit('submit_answer', {
            gameCode: sessionId,
            participantId,
            answer,
            isCorrect: correct,
            timeTakenMs: Math.max(0, timeTakenMs)
        });
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && gameState === 'playing') setViolationCount(v => v + 1);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [gameState]);

    if (!session) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-zinc-900 font-outfit">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                    <p className="text-xl font-black uppercase text-zinc-400 tracking-widest">Entering Arena...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden font-outfit">
            <Helmet><title>{pageTitle}</title></Helmet>

            <div className="fixed inset-0 z-0 bg-white">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/[0.03] rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/[0.03] rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 min-h-screen p-6 md:p-12">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    {violationCount > 0 && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-500 text-white rounded-2xl flex items-center gap-4 shadow-xl shadow-red-500/20">
                            <AlertCircle size={20} />
                            <div>
                                <div className="text-[10px] uppercase font-black">Anti-Cheat Alert</div>
                                <div className="text-sm font-bold">Warning: {violationCount}/3 violations.</div>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {gameState === 'lobby' && (
                            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-12">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start opacity-30">
                                            <Play size={20} fill="currentColor" />
                                            <span className="text-xl font-black uppercase tracking-tighter">Quizly Lobby</span>
                                        </div>
                                        <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tight text-zinc-900 uppercase leading-none">{session.quizTitle}</h1>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Session ID</span>
                                            <span className="text-xl md:text-2xl font-black tracking-widest text-brand">{gameCode}</span>
                                        </div>
                                    </div>
                                    <div className="card text-center min-w-[240px]">
                                        <div className="text-7xl font-black mb-1 text-zinc-900">{allParticipants.length}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Warriors Ready</div>
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-8 flex-1">
                                    <div className="lg:col-span-2 card flex flex-col">
                                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-100">
                                            <h3 className="text-2xl font-black uppercase italic text-zinc-900">Active Warriors</h3>
                                            <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black">LIVE SYNC</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {(allParticipants || []).map((p, idx) => (
                                                    <div key={(p?.id || p?._id) || idx} className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center gap-3 ${(p?.id || p?._id) === participantId ? 'bg-brand/10 border-brand/40 shadow-lg shadow-brand/10 text-zinc-900' : 'bg-zinc-50 border-zinc-100 opacity-60 text-zinc-600'}`}>
                                                        <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center font-black text-brand">{(p?.name || '?').charAt(0).toUpperCase()}</div>
                                                        <span className="font-bold text-xs truncate uppercase">{p?.name || 'Anonymous'} {(p?.id || p?._id) === participantId && '(Me)'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card flex flex-col">
                                        <h3 className="text-2xl font-black mb-8 pb-6 border-b border-zinc-100 uppercase italic text-zinc-900">Battle Rules</h3>
                                        <div className="space-y-6 flex-1">
                                            {[
                                                { icon: <Zap size={18} />, title: "Speed Matters", desc: "Fast answers = more points!" },
                                                { icon: <CheckCircle size={18} />, title: "Perfect Streaks", desc: "Keep it up for a bonus!" },
                                                { icon: <AlertCircle size={18} />, title: "Anti-Cheat", desc: "Keep this tab focused!" }
                                            ].map((rule, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100 text-brand">{rule.icon}</div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase text-zinc-900">{rule.title}</h4>
                                                        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{rule.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'playing' && currentQuestion && (
                            <motion.div key={session.currentQuestionIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col max-w-5xl mx-auto w-full pt-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                                    <div className="card !py-3 !px-6 flex items-center gap-4">
                                        <span className="text-3xl font-black text-brand italic">Q{(session.currentQuestionIndex || 0) + 1}</span>
                                        <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">of {questions.length}</span>
                                    </div>
                                    <div className="text-center order-first md:order-none">
                                        <p className="text-5xl md:text-6xl font-black tabular-nums tracking-tighter text-zinc-900">{Math.round(participant?.score || 0).toLocaleString()}</p>
                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Global Arena Points</p>
                                    </div>
                                    <div className="card !py-3 !px-6 border-l-4 border-orange-500 flex items-center gap-4">
                                        <Trophy size={20} className="text-orange-500" />
                                        <span className="text-xl font-black text-orange-500">#{currentPosition}</span>
                                    </div>
                                </div>

                                <div className="card !p-10 md:!p-24 text-center mb-12">
                                    <h2 className="text-3xl md:text-6xl font-black leading-tight tracking-tight uppercase italic">{currentQuestion.questionText}</h2>
                                </div>

                                {!hasAnswered ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                                            const optionText = currentQuestion[`option${letter}` as keyof Question];
                                            if (!optionText) return null;
                                            const COLORS = ['bg-[#EB1736]', 'bg-[#1368CE]', 'bg-[#D89E00]', 'bg-[#26890C]'];
                                            const SHAPES = [Triangle, Square, Circle, Diamond];
                                            const ShapeIcon: any = SHAPES[idx];
                                            return (
                                                <button key={letter} onClick={() => submitAnswer(letter)} className={`relative overflow-hidden p-6 md:p-8 rounded-3xl flex items-center gap-4 md:gap-6 group transition-all active:scale-95 ${COLORS[idx]} border-b-[6px] border-black/20`}>
                                                    <ShapeIcon className="absolute -right-6 -bottom-6 w-24 h-24 md:w-32 md:h-32 text-white/10 rotate-12 transition-transform group-hover:rotate-45" />
                                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/20"><ShapeIcon size={20} fill="white" /></div>
                                                    <span className="font-black text-lg md:text-xl text-left uppercase">{optionText}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="card !p-20 text-center flex flex-col items-center">
                                        <Clock size={48} className="text-zinc-200 mb-6 animate-pulse" />
                                        <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter text-zinc-900">Answer Locked</h2>
                                        <p className="text-sm font-bold text-zinc-400 tracking-widest uppercase">Round in progress...</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {gameState === 'results' && (
                            <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-center">
                                <div className={`card !p-10 md:!p-16 text-center border-t-[10px] ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} shadow-2xl`}>
                                        {isCorrect ? <CheckCircle size={40} /> : <XCircle size={40} />}
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase italic tracking-tighter">{isCorrect ? 'PERFECT' : 'FAILED'}</h2>
                                    <div className="mb-8">
                                        {isCorrect ? (
                                            <div className="text-4xl font-black text-green-600">+{pointsEarned} PTS</div>
                                        ) : (
                                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Answer was</p>
                                                <p className="text-xl font-bold uppercase text-red-600">{currentQuestion?.[`option${currentQuestion.correctAnswer}` as keyof Question]}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pt-10 border-t border-zinc-100">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Rank</p>
                                            <p className="text-3xl font-black text-zinc-900">#{currentPosition}</p>
                                        </div>
                                        <div className="border-l border-zinc-100">
                                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Total</p>
                                            <p className="text-3xl font-black text-zinc-900">{Math.round(participant?.score || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'ended' && (
                            <motion.div key="ended" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col max-w-4xl mx-auto w-full justify-center text-center py-10">
                                <Trophy size={80} className="text-brand mx-auto mb-8 drop-shadow-2xl md:w-[100px] md:h-[100px]" />
                                <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter italic uppercase text-zinc-900 leading-none">GAME OVER</h1>
                                <p className="text-lg md:text-xl font-bold text-zinc-400 uppercase tracking-widest mb-12">VICTORY LAP COMPLETE</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div className="card !p-6 md:!p-10"><div className="text-4xl font-black mb-1 text-zinc-900">#{currentPosition}</div><div className="text-[10px] font-black uppercase text-zinc-400 font-sans tracking-widest">Final Rank</div></div>
                                    <div className="card !p-6 md:!p-10"><div className="text-4xl font-black mb-1 text-zinc-900">{Math.round(participant?.score || 0)}</div><div className="text-[10px] font-black uppercase text-zinc-400 font-sans tracking-widest">Points</div></div>
                                    <div className="card !p-6 md:!p-10"><div className="text-4xl font-black mb-1 text-zinc-900">{questions.length}</div><div className="text-[10px] font-black uppercase text-zinc-400 font-sans tracking-widest">Rounds</div></div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <button onClick={() => navigate('/library')} className="btn btn-primary h-16 px-12 uppercase italic">Library</button>
                                    <button onClick={() => window.location.reload()} className="btn h-16 px-12 bg-zinc-50 border border-zinc-100 uppercase italic text-zinc-900">Replay</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
