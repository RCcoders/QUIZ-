import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRedirectPath } from '../utils/scoring';

function friendlyError(code: string): string {
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        return 'Incorrect email or password. Please try again.';
    }
    if (code.includes('too-many-requests')) {
        return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (code.includes('user-disabled')) {
        return 'This account has been disabled. Contact support.';
    }
    if (code.includes('network-request-failed')) {
        return 'Network error. Check your connection and try again.';
    }
    if (code.includes('popup-closed-by-user')) {
        return 'Sign-in popup was closed. Please try again.';
    }
    return 'Something went wrong. Please try again.';
}

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<'student' | 'teacher'>('student');

    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                const code = (signInError as { code?: string }).code ?? signInError.message ?? '';
                setError(friendlyError(code));
            } else {
                navigate(getRedirectPath(role), { replace: true });
            }
        } catch (err) {
            const code = (err as { code?: string }).code ?? (err instanceof Error ? err.message : '');
            setError(friendlyError(code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            const { error: googleError } = await signInWithGoogle();
            if (googleError) {
                const code = (googleError as { code?: string }).code ?? googleError.message ?? '';
                setError(friendlyError(code));
            } else {
                navigate(getRedirectPath(role), { replace: true });
            }
        } catch (err) {
            const code = (err as { code?: string }).code ?? (err instanceof Error ? err.message : '');
            setError(friendlyError(code));
        } finally {
            setLoading(false);
        }
    };

    const isTeacher = role === 'teacher';
    const accentColor = isTeacher ? '#FF5C1A' : '#6366F1';
    const accentGradient = isTeacher
        ? 'linear-gradient(135deg, #FF5C1A, #FF8C42)'
        : 'linear-gradient(135deg, #6366F1, #818CF8)';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            padding: '24px',
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', top: '-120px', right: '-120px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: `radial-gradient(circle, ${isTeacher ? 'rgba(255,92,26,0.2)' : 'rgba(99,102,241,0.25)'} 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'background 0.3s',
            }} />
            <div style={{
                position: 'fixed', bottom: '-100px', left: '-100px',
                width: '350px', height: '350px', borderRadius: '50%',
                background: `radial-gradient(circle, ${isTeacher ? 'rgba(99,102,241,0.2)' : 'rgba(255,92,26,0.2)'} 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'background 0.3s',
            }} />

            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '20px',
                padding: '40px 36px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        marginBottom: '20px',
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: accentGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 4px 12px ${isTeacher ? 'rgba(255,92,26,0.4)' : 'rgba(99,102,241,0.4)'}`,
                            transition: 'all 0.3s',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                        </div>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>
                            QuizMaster
                        </span>
                    </div>
                    <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                        Welcome back
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                        Sign in as a {role}
                    </p>
                </div>

                {/* Role toggle */}
                <div
                    role="group"
                    aria-label="Select role"
                    style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: '50px',
                        padding: '4px',
                        marginBottom: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    {(['student', 'teacher'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            data-testid={`role-${r}`}
                            onClick={() => setRole(r)}
                            aria-pressed={role === r}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: '50px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                transition: 'all 0.2s',
                                background: role === r ? accentGradient : 'transparent',
                                color: role === r ? 'white' : 'rgba(255,255,255,0.45)',
                                boxShadow: role === r ? `0 2px 8px ${accentColor}55` : 'none',
                            }}
                        >
                            {r === 'student' ? '🎓 Student' : '📚 Teacher'}
                        </button>
                    ))}
                </div>

                {/* Error banner */}
                {error && (
                    <div
                        role="alert"
                        data-testid="error-message"
                        style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#FCA5A5',
                            borderRadius: '10px',
                            padding: '11px 14px',
                            marginBottom: '20px',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label htmlFor="email" style={{
                            display: 'block', fontSize: '0.8rem', fontWeight: 500,
                            color: 'rgba(255,255,255,0.6)', marginBottom: '7px', letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={15} style={{
                                position: 'absolute', left: '13px', top: '50%',
                                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                                pointerEvents: 'none',
                            }} />
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '11px 13px 11px 38px',
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem', outline: 'none',
                                    boxSizing: 'border-box',
                                    color: 'white',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => (e.target.style.borderColor = `${accentColor}bb`)}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="password" style={{
                            display: 'block', fontSize: '0.8rem', fontWeight: 500,
                            color: 'rgba(255,255,255,0.6)', marginBottom: '7px', letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={15} style={{
                                position: 'absolute', left: '13px', top: '50%',
                                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                                pointerEvents: 'none',
                            }} />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '11px 40px 11px 38px',
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem', outline: 'none',
                                    boxSizing: 'border-box',
                                    color: 'white',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => (e.target.style.borderColor = `${accentColor}bb`)}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.4)', padding: 0,
                                }}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot password */}
                    <div style={{ textAlign: 'right', marginBottom: '22px' }}>
                        <button type="button" style={{
                            background: 'none', border: 'none',
                            color: `${accentColor}dd`, cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: 500, padding: 0,
                        }}>
                            Forgot password?
                        </button>
                    </div>

                    {/* Sign In button */}
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="submit-button"
                        style={{
                            width: '100%', padding: '12px',
                            background: loading ? `${accentColor}88` : accentGradient,
                            color: 'white', border: 'none',
                            borderRadius: '10px', fontWeight: 600,
                            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: loading ? 'none' : `0 4px 15px ${accentColor}66`,
                            transition: 'all 0.2s',
                            letterSpacing: '0.2px',
                        }}
                    >
                        {loading && (
                            <span
                                data-testid="loading-indicator"
                                style={{
                                    width: '15px', height: '15px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }}
                            />
                        )}
                        {loading ? 'Signing in...' : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Google button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    data-testid="google-signin-button"
                    style={{
                        width: '100%', padding: '11px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px', fontWeight: 500,
                        fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '10px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px',
                        transition: 'background 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                {/* Sign up link */}
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
                    Don't have an account?{' '}
                    <Link
                        to="/signup"
                        data-testid="signup-link"
                        style={{ color: '#818CF8', fontWeight: 600, textDecoration: 'none' }}
                    >
                        Create one
                    </Link>
                </p>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                    © {new Date().getFullYear()} QuizMaster · Privacy Policy · Terms of Service
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.25) !important; }
                input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 100px #302B63 inset !important;
                    -webkit-text-fill-color: white !important;
                }
            `}</style>
        </div>
    );
}
