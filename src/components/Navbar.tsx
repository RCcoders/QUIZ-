import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Zap } from 'lucide-react';

export function Navbar() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isStudentPage = ['/student', '/join', '/play'].some(path => location.pathname.startsWith(path));

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <Zap size={24} style={{ display: 'inline', marginRight: '8px' }} />
                Quiz Master
            </Link>

            <div className="navbar-nav">
                {user ? (
                    <>
                        {!isStudentPage && (
                            <Link to="/teacher" className="btn btn-secondary btn-sm">
                                <User size={16} />
                                {profile?.name || 'Dashboard'}
                            </Link>
                        )}
                        <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/student" className="btn btn-secondary btn-sm">
                            Join Quiz
                        </Link>
                        <Link to="/auth" className="btn btn-primary btn-sm">
                            Teacher Login
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
