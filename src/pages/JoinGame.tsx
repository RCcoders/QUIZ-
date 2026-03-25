import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, HelpCircle, User, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function JoinGame() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const [gameCode, setGameCode] = useState(() => code ? code.toUpperCase() : '');
    const [name, setName] = useState(() => userProfile?.displayName ?? '');
    const [email, setEmail] = useState('');
    const [validationError, setValidationError] = useState('');
    const [joiningSession, setJoiningSession] = useState(false);

    // Placeholder avatar colors for the avatar group
    const avatarColors = ['#FF5C1A', '#6366F1', '#10B981', '#F59E0B'];
    const placeholderAvatars = ['?', '?', '?'];

    const handleGameCodeChange = (value: string) => {
        const cleaned = value.replace(/\s/g, '').toUpperCase().slice(0, 6);
        setGameCode(cleaned);
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        if (!gameCode.trim()) {
            setValidationError('Please enter a game code.');
            return;
        }
        if (!name.trim()) {
            setValidationError('Please enter a nickname.');
            return;
        }

        setJoiningSession(true);

        // Navigate to play page with participant info in state
        navigate(`/play/${gameCode}`, {
            state: { participantId: crypto.randomUUID(), name }
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F5F5F5',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Helmet>
                <title>Join a Quiz — QuizMaster</title>
                <meta name="description" content="Enter a game code to join a live QuizMaster quiz session." />
            </Helmet>
            {/* Top Bar */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 32px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: '#FF5C1A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Play size={18} color="#fff" fill="#fff" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                        QuizMaster
                    </span>
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#6B7280',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    <HelpCircle size={16} />
                    Help
                </button>
            </header>

            {/* Main content */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
            }}>
                <div style={{ width: '100%', maxWidth: 480 }}>
                    {/* Card */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        padding: '40px 36px 32px',
                        borderBottom: '4px solid #FF5C1A',
                    }}>
                        {/* Heading */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <h1 style={{
                                fontSize: 28, fontWeight: 700, color: '#111827',
                                margin: '0 0 8px', fontFamily: 'Inter, sans-serif',
                            }}>
                                Ready to Play?
                            </h1>
                            <p style={{ color: '#6B7280', fontSize: 15, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                                Enter your details to hop into the game.
                            </p>
                        </div>

                        {/* Validation error */}
                        {validationError && (
                            <div style={{
                                background: '#FEF2F2', border: '1px solid #FECACA',
                                borderRadius: 8, padding: '10px 14px',
                                color: '#EF4444', fontSize: 14, marginBottom: 20,
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {validationError}
                            </div>
                        )}

                        <form onSubmit={handleJoin}>
                            {/* Game Code */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{
                                    display: 'block', fontSize: 12, fontWeight: 600,
                                    color: '#6B7280', marginBottom: 8, textTransform: 'uppercase',
                                    letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif',
                                }}>
                                    Game Join Code
                                </label>
                                <input
                                    type="text"
                                    value={gameCode}
                                    onChange={e => handleGameCodeChange(e.target.value)}
                                    placeholder="000 000"
                                    maxLength={6}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '12px 16px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: 8, fontSize: 22,
                                        fontWeight: 700, letterSpacing: '0.2em',
                                        textAlign: 'center', color: '#111827',
                                        outline: 'none', fontFamily: 'Inter, sans-serif',
                                    }}
                                />
                            </div>

                            {/* Nickname */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{
                                    display: 'block', fontSize: 12, fontWeight: 600,
                                    color: '#6B7280', marginBottom: 8, textTransform: 'uppercase',
                                    letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif',
                                }}>
                                    Nickname
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9CA3AF',
                                        display: 'flex', alignItems: 'center',
                                    }}>
                                        <User size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="E.g. SpeedRunner99"
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            padding: '12px 16px 12px 38px',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: 8, fontSize: 15,
                                            color: '#111827', outline: 'none',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: 28 }}>
                                <label style={{
                                    display: 'block', fontSize: 12, fontWeight: 600,
                                    color: '#6B7280', marginBottom: 8, textTransform: 'uppercase',
                                    letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif',
                                }}>
                                    Email Verification
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9CA3AF',
                                        display: 'flex', alignItems: 'center',
                                    }}>
                                        <Mail size={16} />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="student@school.edu"
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            padding: '12px 16px 12px 38px',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: 8, fontSize: 15,
                                            color: '#111827', outline: 'none',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                    />
                                </div>
                                <p style={{
                                    marginTop: 6, fontSize: 12, color: '#9CA3AF',
                                    fontFamily: 'Inter, sans-serif',
                                }}>
                                    We'll send your results here after the quiz.
                                </p>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={joiningSession}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: joiningSession ? '#FDA07A' : '#FF5C1A',
                                    color: '#fff', border: 'none', borderRadius: 8,
                                    fontSize: 16, fontWeight: 600, cursor: joiningSession ? 'not-allowed' : 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'background 0.2s',
                                }}
                            >
                                {joiningSession ? 'Joining...' : 'Join Game →'}
                            </button>
                        </form>

                        {/* Avatar group + lobby count */}
                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                                {placeholderAvatars.map((_, i) => (
                                    <div key={i} style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: avatarColors[i % avatarColors.length],
                                        border: '2px solid #fff',
                                        marginLeft: i === 0 ? 0 : -10,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, color: '#fff',
                                        fontFamily: 'Inter, sans-serif',
                                        zIndex: 4 - i,
                                        position: 'relative',
                                    }}>
                                        ?
                                    </div>
                                ))}
                            </div>
                            <p style={{
                                fontSize: 13, color: '#6B7280', fontWeight: 500,
                                fontFamily: 'Inter, sans-serif', margin: 0,
                            }}>
                                Students waiting in lobby
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p style={{
                        textAlign: 'center', marginTop: 20, fontSize: 12,
                        color: '#9CA3AF', fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.6,
                    }}>
                        By joining, you agree to our{' '}
                        <Link to="/tos" style={{ color: '#6B7280', textDecoration: 'underline' }}>Terms of Service</Link>.
                        {' '}No account registration required for students.
                    </p>
                </div>
            </main>
        </div>
    );
}
