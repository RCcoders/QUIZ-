import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
    if (code.includes('not supported')) {
        return code;
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

    const { signIn, signInWithGoogle, user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Login — Quizly';
        document.querySelector('meta[name="description"]')
            ?.setAttribute('content', 'Sign in to your Quizly account. Access your teacher dashboard or student reports.');
    }, []);

    useEffect(() => {
        if (user && userProfile && !authLoading) {
            navigate(getRedirectPath(userProfile.role), { replace: true });
        }
    }, [user, userProfile, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            localStorage.setItem('userRole', role);
            const { error: signInError } = await signIn(email, password, role);
            if (signInError) {
                const code = (signInError as { code?: string }).code ?? signInError.message ?? '';
                setError(friendlyError(code));
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            localStorage.setItem('userRole', role);
            const { error: googleError } = await signInWithGoogle();
            if (googleError) {
                const code = (googleError as { code?: string }).code ?? googleError.message ?? '';
                setError(friendlyError(code));
            }
        } catch (err) {
            const code = (err as { code?: string }).code ?? (err instanceof Error ? err.message : '');
            setError(friendlyError(code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Log In — Quizly</title>
                <meta name="description" content="Sign in to your Quizly account to manage quizzes and view student results." />
            </Helmet>

            {/* Full-viewport locked layout — no scroll */}
            <div style={{
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: '#F3F4F6',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}>
                {/* ── Navbar ── */}
                <header style={{
                    flexShrink: 0,
                    height: 52,
                    background: 'white',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 28px',
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        {/* Logo mark */}
                        <div style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: '#FF5C1A',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                                <path d="M3 5h14M3 10h14M3 15h8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', letterSpacing: '-0.2px' }}>
                            Quizly
                        </span>
                    </Link>
                    <a
                        href="#"
                        style={{ fontSize: '0.85rem', color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                    >
                        Help Center
                    </a>
                </header>

                {/* ── Body ── */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 40,
                    padding: '0 24px',
                    overflow: 'hidden',
                }}>
                    {/* Left — illustration + copy */}
                    <div className="qm-left-panel" style={{
                        flex: '0 1 380px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}>
                        <div style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            background: '#FDE8DC',
                            aspectRatio: '4/3',
                            maxHeight: 260,
                        }}>
                            <img
                                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80"
                                alt="Student studying"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        </div>
                        <div>
                            <h2 style={{
                                fontSize: '1.55rem', fontWeight: 800, color: '#111827',
                                margin: '0 0 8px', lineHeight: 1.25,
                            }}>
                                Master your subjects with interactive quizzes.
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                                Join over 10,000 students and teachers worldwide in the ultimate learning journey with Quizly.
                            </p>
                        </div>
                    </div>

                    {/* Right — form card */}
                    <div style={{
                        flex: '0 1 360px',
                        background: 'white',
                        borderRadius: 14,
                        padding: '28px 28px 24px',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                    }}>
                        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                            Welcome Back
                        </h1>
                        <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '0 0 18px' }}>
                            Please enter your details to sign in
                        </p>

                        {/* Role toggle */}
                        <div
                            role="group"
                            aria-label="Select role"
                            style={{
                                display: 'flex',
                                background: '#F3F4F6',
                                borderRadius: 8,
                                padding: 3,
                                marginBottom: 18,
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
                                        padding: '7px 0',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        transition: 'all 0.15s',
                                        background: role === r ? 'white' : 'transparent',
                                        color: role === r ? '#FF5C1A' : '#6B7280',
                                        boxShadow: role === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    }}
                                >
                                    {r === 'student' ? 'Student' : 'Teacher'}
                                </button>
                            ))}
                        </div>

                        {/* Error banner */}
                        {error && (
                            <div
                                role="alert"
                                data-testid="error-message"
                                style={{
                                    background: '#FEF2F2', border: '1px solid #FECACA',
                                    color: '#DC2626', borderRadius: 7,
                                    padding: '9px 12px', marginBottom: 14,
                                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7,
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Email */}
                            <div style={{ marginBottom: 13 }}>
                                <label htmlFor="email" style={{
                                    display: 'block', fontSize: '0.82rem', fontWeight: 500,
                                    color: '#374151', marginBottom: 5,
                                }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={14} style={{
                                        position: 'absolute', left: 11, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none',
                                    }} />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', padding: '9px 12px 9px 34px',
                                            background: 'white', border: '1px solid #D1D5DB',
                                            borderRadius: 7, fontSize: '0.875rem', outline: 'none',
                                            boxSizing: 'border-box', color: '#111827',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onFocus={e => (e.target.style.borderColor = '#FF5C1A')}
                                        onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                    <label htmlFor="password" style={{ fontSize: '0.82rem', fontWeight: 500, color: '#374151' }}>
                                        Password
                                    </label>
                                    <button type="button" style={{
                                        background: 'none', border: 'none', color: '#FF5C1A',
                                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, padding: 0,
                                    }}>
                                        Forgot password?
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={14} style={{
                                        position: 'absolute', left: 11, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none',
                                    }} />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', padding: '9px 36px 9px 34px',
                                            background: 'white', border: '1px solid #D1D5DB',
                                            borderRadius: 7, fontSize: '0.875rem', outline: 'none',
                                            boxSizing: 'border-box', color: '#111827',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onFocus={e => (e.target.style.borderColor = '#FF5C1A')}
                                        onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: 10, top: '50%',
                                            transform: 'translateY(-50%)', background: 'none',
                                            border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Sign In */}
                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="submit-button"
                                style={{
                                    width: '100%', padding: '10px',
                                    background: loading ? '#FDBA74' : '#FF5C1A',
                                    color: 'white', border: 'none', borderRadius: 7,
                                    fontWeight: 600, fontSize: '0.9rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    marginBottom: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#E54E10'; }}
                                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#FF5C1A'; }}
                            >
                                {loading && (
                                    <span
                                        data-testid="loading-indicator"
                                        style={{
                                            width: 14, height: 14,
                                            border: '2px solid rgba(255,255,255,0.35)',
                                            borderTopColor: 'white', borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'qm-spin 0.7s linear infinite',
                                        }}
                                    />
                                )}
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                            <span style={{ color: '#9CA3AF', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Or continue with</span>
                            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            data-testid="google-signin-button"
                            style={{
                                width: '100%', padding: '9px',
                                background: 'white', border: '1px solid #E5E7EB',
                                borderRadius: 7, fontWeight: 500, fontSize: '0.875rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 9, color: '#374151', marginBottom: 16,
                                transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'white';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                            }}
                        >
                            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>

                        {/* Sign up */}
                        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                data-testid="signup-link"
                                style={{ color: '#FF5C1A', fontWeight: 600, textDecoration: 'none' }}
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* ── Footer ── */}
                <footer style={{
                    flexShrink: 0,
                    height: 44,
                    background: 'white',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 28px',
                    fontSize: '0.78rem',
                    color: '#9CA3AF',
                }}>
                    <span>© {new Date().getFullYear()} Quizly. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: 18 }}>
                        <Link to="/privacy" style={{ color: '#6B7280', textDecoration: 'none' }}>Privacy Policy</Link>
                        <Link to="/terms" style={{ color: '#6B7280', textDecoration: 'none' }}>Terms of Service</Link>
                    </div>
                </footer>
            </div>

            <style>{`
                @keyframes qm-spin { to { transform: rotate(360deg); } }
                @media (max-width: 700px) {
                    .qm-left-panel { display: none !important; }
                }
            `}</style>
        </>
    );
}
