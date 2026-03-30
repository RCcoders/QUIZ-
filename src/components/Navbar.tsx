import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Zap } from 'lucide-react';

export function Navbar() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isStudentPage = ['/student', '/join', '/play'].some(path => location.pathname.startsWith(path));
    const isLandingPage = location.pathname === '/';

    const navStyle = isLandingPage
        ? {}
        : {
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            backdropFilter: 'none',
        };

    return (
        <nav className="navbar" style={navStyle}>
            <div className="container flex justify-between items-center h-16">
                <Link
                    to="/"
                    className="navbar-brand flex items-center gap-2"
                    style={!isLandingPage ? { background: 'none', WebkitTextFillColor: '#6366F1', color: '#6366F1' } : {}}
                >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF5C1A' }}>
                        <Zap size={20} color="white" fill="white" />
                    </div>
                    Quizly
                </Link>

                {isLandingPage && (
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Features</a>
                        <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900">How It Works</a>
                        <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Pricing</a>
                    </div>
                )}

                <div className="navbar-nav">
                    {user ? (
                        <>
                            {!isStudentPage && (
                                <Link to="/teacher" className="btn btn-secondary btn-sm">
                                    <User size={16} />
                                    Dashboard
                                </Link>
                            )}
                            {location.pathname.startsWith('/teacher') && (
                                <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/auth" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                                Login
                            </Link>
                            <Link to="/auth" className="btn btn-primary btn-sm" style={{ background: '#6366F1' }}>
                                Create Quiz
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
