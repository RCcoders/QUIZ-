import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Play, HelpCircle, User, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

export function JoinGame() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { userProfile, user } = useAuth();

    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [name, setName] = useState(() => userProfile?.displayName ?? '');
    const [email, setEmail] = useState(() => userProfile?.email ?? '');
    const [validationError, setValidationError] = useState('');
    const [joiningSession, setJoiningSession] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        document.title = 'Join a Live Quiz — Quizly';
        document.querySelector('meta[name="description"]')
            ?.setAttribute('content', 'Enter your game code to join a live Quizly session. Play in real time with your classmates.');
    }, []);

    useEffect(() => {
        if (code && code.length === 6) {
            setOtp(code.toUpperCase().split(''));
        }
    }, [code]);

    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        const value = element.value.toUpperCase();
        if (!/^[A-Z0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        const gameCode = otp.join('').trim().toUpperCase();
        if (gameCode.length < 6) {
            setValidationError('Please enter a full 6-digit game code.');
            return;
        }
        if (!name.trim()) {
            setValidationError('Please enter a nickname.');
            return;
        }

        setJoiningSession(true);

        try {
            const data = await apiFetch('/api/sessions/join', {
                method: 'POST',
                body: JSON.stringify({
                    gameCode,
                    name,
                    email,
                    userId: user?._id
                })
            });

            // Find ourselves in the participants list (might be re-joining)
            const participant = data.participants.find((p: any) =>
                p.name.toLowerCase() === name.toLowerCase() ||
                (user?._id && p.userId?.toString() === user?._id?.toString())
            ) || data.participants[data.participants.length - 1];

            // CRITICAL: Save to localStorage so PlayGame.tsx doesn't redirect back!
            localStorage.setItem('quizly_player_name', participant.name);
            localStorage.setItem('quizly_participant_id', participant._id);

            navigate(`/play/${gameCode}`, {
                state: {
                    participantId: participant._id,
                    name: participant.name,
                    sessionData: data
                }
            });
        } catch (error: any) {
            setValidationError(error.message || 'Failed to join session. Please check your code.');
        } finally {
            setJoiningSession(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <Helmet>
                <title>Join a Quiz — Quizly</title>
            </Helmet>

            {/* Background Blobs */}
            <div className="fixed inset-0 z-0 bg-white">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/[0.03] rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand/[0.03] rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[480px]"
                >
                    {/* Brand Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/30 mb-4 scale-110">
                            <Play size={32} color="#fff" fill="#fff" className="ml-1" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter uppercase font-outfit">Quizly</span>
                    </div>

                    {/* Main Join Card */}
                    <div className="card">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-black mb-2 tracking-tight">Enter Arena</h1>
                            <p className="text-sm text-zinc-400 font-medium">Join a live session to start competing</p>
                        </div>

                        {validationError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"
                            >
                                <HelpCircle size={16} />
                                {validationError}
                            </motion.div>
                        )}

                        <form onSubmit={handleJoin} className="flex flex-col gap-[var(--space-lg)]">
                            {/* Game Code Area */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4">
                                    6-Digit Join Code
                                </label>
                                <div className="otp-container">
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            value={data}
                                            onChange={(e) => handleOtpChange(e.target, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className="otp-input"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Participant Details */}
                            <div className="flex flex-col gap-[var(--space-md)]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4">
                                        Your Nickname
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. QuizMaster"
                                            className="form-input pl-14"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-4">
                                        Email Address (Optional)
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="To track progress"
                                            className="form-input pl-14"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={joiningSession}
                                className="btn btn-primary w-full mt-4 text-lg uppercase tracking-wider h-16"
                            >
                                {joiningSession ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Join The Battle <Play size={18} fill="white" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-zinc-100 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                Global Live Sessions Active
                            </p>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-10 flex justify-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                        <Link to="/tos" className="hover:text-brand transition-colors">Terms</Link>
                        <Link to="/" className="hover:text-brand transition-colors">Privacy</Link>
                        <span className="text-zinc-200">•</span>
                        <span>Secure Connection</span>
                    </div>
                </motion.div>
            </div>
        </div >
    );
}
