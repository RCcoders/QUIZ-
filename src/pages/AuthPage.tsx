import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const { signIn, signUp, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect after auth has finished loading
        if (!authLoading && user) {
            navigate('/teacher', { replace: true });
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
                navigate('/teacher');
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                setSuccess('Account created! Check your email to verify, then log in.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
                    <div className="icon-circle bg-gradient-primary">
                        <Zap size={32} color="white" />
                    </div>
                    <h2>{isLogin ? 'Teacher Login' : 'Create Account'}</h2>
                    <p className="mt-sm" style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? 'Welcome back!' : 'Get started for free'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert-success">
                            {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            Email
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="teacher@school.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                            Password
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                        ) : (
                            <>
                                <User size={18} />
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center mt-xl">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccess('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>

                {/* Demo Account Info */}
                <div className="info-box">
                    <h4 className="info-box-title">
                        🎓 First Time Here?
                    </h4>
                    <p className="info-box-text">
                        {isLogin
                            ? 'Click "Sign up" above to create an account using your real email address (e.g., yourname@gmail.com).'
                            : 'Use your real email address (Gmail, Outlook, etc.) to receive the verification link. Example domains like @example.com will not work.'}
                    </p>

                    {/* Quick test account button */}
                    <button
                        type="button"
                        onClick={() => {
                            setEmail('shivammahajan1574@gmail.com');
                            setPassword('');
                            setError('');
                            setSuccess('');
                        }}
                        className="demo-btn"
                    >
                        📧 Use my email: shivammahajan1574@gmail.com
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

