import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, signUp, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            const targetPath = user.role === 'teacher' ? '/teacher' : '/student';
            navigate(targetPath, { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;

                // Note: The useEffect handles navigation.
                // Here we can add a check to warn the user if they're on the wrong tab.
                // However, since we auto-redirect to the correct dashboard,
                // the primary goal is already met.
            } else {
                const { error } = await signUp(email, password, displayName, role);
                if (error) {
                    if (typeof error === 'string' && error.toLowerCase().includes('already exists')) {
                        throw new Error('This email is already registered. Please sign in instead.');
                    }
                    throw typeof error === 'string' ? new Error(error) : error;
                }
                setSuccess('Account created successfully!');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Left panel */}
            <div style={{
                width: '50%',
                position: 'relative',
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #FF5C1A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '10px',
                            background: '#FF5C1A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Play size={22} color="white" fill="white" />
                        </div>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem' }}>QuizMaster</span>
                    </div>
                    <h1 style={{
                        color: 'white', fontSize: '2rem', fontWeight: 700,
                        lineHeight: 1.3, marginBottom: '16px',
                    }}>
                        Master your subjects with interactive quizzes
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.6 }}>
                        Join thousands of students and teachers using QuizMaster to make learning engaging and effective.
                    </p>
                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '40px' }}>
                        {[['10K+', 'Students'], ['500+', 'Teachers'], ['50K+', 'Quizzes']].map(([val, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ color: '#FF5C1A', fontWeight: 700, fontSize: '1.5rem' }}>{val}</div>
                                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={{
                width: '50%',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 40px',
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: '#6B7280', marginBottom: '28px', fontSize: '0.95rem' }}>
                        {isLogin ? 'Sign in to your account to continue' : 'Join QuizMaster to start creating quizzes'}
                    </p>

                    {/* Student / Teacher tab toggle */}
                    <div style={{
                        display: 'flex',
                        background: '#F3F4F6',
                        borderRadius: '50px',
                        padding: '4px',
                        marginBottom: '24px',
                    }}>
                        {(['student', 'teacher'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                    background: role === r ? '#FF5C1A' : 'transparent',
                                    color: role === r ? 'white' : '#6B7280',
                                }}
                            >
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div style={{
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#DC2626', borderRadius: '8px',
                            padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem',
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            color: '#16A34A', borderRadius: '8px',
                            padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem',
                        }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Display Name input (Register only) */}
                        {!isLogin && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                    Full Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', padding: '10px 12px 10px 12px',
                                            border: '1px solid #E5E7EB', borderRadius: '8px',
                                            fontSize: '0.9rem', outline: 'none',
                                            boxSizing: 'border-box', color: '#111827',
                                            background: '#FAFAFA',
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute', left: '12px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#9CA3AF',
                                }} />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '10px 12px 10px 38px',
                                        border: '1px solid #E5E7EB', borderRadius: '8px',
                                        fontSize: '0.9rem', outline: 'none',
                                        boxSizing: 'border-box', color: '#111827',
                                        background: '#FAFAFA',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password input */}
                        <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{
                                    position: 'absolute', left: '12px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#9CA3AF',
                                }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{
                                        width: '100%', padding: '10px 38px 10px 38px',
                                        border: '1px solid #E5E7EB', borderRadius: '8px',
                                        fontSize: '0.9rem', outline: 'none',
                                        boxSizing: 'border-box', color: '#111827',
                                        background: '#FAFAFA',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                            <button
                                type="button"
                                style={{
                                    background: 'none', border: 'none',
                                    color: '#FF5C1A', cursor: 'pointer',
                                    fontSize: '0.85rem', fontWeight: 500,
                                }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Sign In / Sign Up button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '11px',
                                background: loading ? '#FDA07A' : '#FF5C1A',
                                color: 'white', border: 'none',
                                borderRadius: '8px', fontWeight: 600,
                                fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                                marginBottom: '16px', transition: 'background 0.2s',
                            }}
                        >
                            {isLogin
                                ? (loading ? 'Signing in...' : 'Sign In')
                                : (loading ? 'Creating account...' : 'Create Account')}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                        <span style={{ color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Or continue with</span>
                        <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                    </div>

                    {/* Google button */}
                    <button
                        type="button"
                        style={{
                            width: '100%', padding: '10px',
                            background: 'white', border: '1px solid #E5E7EB',
                            borderRadius: '8px', fontWeight: 500,
                            fontSize: '0.9rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '10px', color: '#374151', marginBottom: '20px',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Create account link */}
                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280', marginBottom: '32px' }}>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccess('');
                            }}
                            style={{
                                background: 'none', border: 'none',
                                color: '#FF5C1A', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.875rem',
                            }}
                        >
                            Create an account
                        </button>
                    </p>

                    {/* Footer */}
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9CA3AF' }}>
                        © {new Date().getFullYear()} QuizMaster. All rights reserved.{' '}
                        <button type="button" style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                            Privacy Policy
                        </button>
                        {' · '}
                        <button type="button" style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                            Terms of Service
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
