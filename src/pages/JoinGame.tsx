import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Zap } from 'lucide-react';
import {
    getGameSessionByCode,
    getParticipantByEmail,
    addParticipant,
    type GameSession
} from '../lib/database';

export function JoinGame() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [gameCode, setGameCode] = useState(code || '');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<GameSession | null>(null);
    const [step, setStep] = useState<'code' | 'info'>('code');

    useEffect(() => {
        if (code) {
            verifyCode(code);
        }
    }, [code]);

    const verifyCode = async (inputCode: string) => {
        setLoading(true);
        setError('');

        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            const queryPromise = getGameSessionByCode(inputCode);

            const data = await Promise.race([queryPromise, timeoutPromise]);

            if (!data) {
                setError('Game not found. Check the code and try again.');
                setLoading(false);
                return;
            }

            // Check if game is still active
            if (!['waiting', 'playing', 'question'].includes(data.status)) {
                setError('This game is no longer active.');
                setLoading(false);
                return;
            }

            setSession(data);
            setStep('info');
        } catch (err) {
            console.error('Error verifying code:', err);
            if (err instanceof Error && err.message === 'Request timed out') {
                setError('Connection timed out. Please try again.');
            } else {
                setError('Failed to verify game code. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gameCode.length >= 6) {
            verifyCode(gameCode);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setLoading(true);
        setError('');

        try {
            // Check if already joined
            const existing = await getParticipantByEmail(session.id, email);

            let participantId: string;

            if (existing) {
                participantId = existing.id;
            } else {
                participantId = await addParticipant(session.id, {
                    name,
                    email,
                    score: 0,
                    answersCount: 0,
                });
            }

            // Navigate to play page with participant ID in state
            navigate(`/play/${session.id}`, {
                state: { participantId, name }
            });
        } catch (err) {
            console.error('Error joining game:', err);
            setError('Failed to join game');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card w-full max-w-md"
            >
                <div className="text-center mb-xl">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--answer-red), var(--answer-blue))' }}>
                        <Users size={32} color="white" />
                    </div>
                    <h2>Join Live Game</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {step === 'code' ? 'Enter the game code from your teacher' : 'Enter your information to join'}
                    </p>
                </div>

                {error && (
                    <div className="alert-error">
                        {error}
                    </div>
                )}

                {step === 'code' ? (
                    <form onSubmit={handleCodeSubmit}>
                        <div className="form-group">
                            <label className="form-label">Game Code</label>
                            <input
                                type="text"
                                className="form-input input-code"
                                placeholder="Enter 6-digit code"
                                value={gameCode}
                                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading || gameCode.length < 6}
                        >
                            {loading ? (
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                            ) : (
                                <>
                                    <ArrowRight size={20} />
                                    Continue
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleJoin}>
                        <div className="join-info">
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Joining game</span>
                            <div className="join-code-display">
                                {session?.gameCode}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="student@school.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                            ) : (
                                <>
                                    <Zap size={20} />
                                    Join Game
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('code');
                                setSession(null);
                                setGameCode('');
                                setError('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                marginTop: '1rem',
                                width: '100%',
                                fontSize: '0.9rem'
                            }}
                        >
                            ← Enter different code
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

