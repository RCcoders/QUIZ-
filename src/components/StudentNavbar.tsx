import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, BookOpen, BarChart2, Gamepad2, LogOut, Menu, X, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/scoring';

interface StudentNavbarProps {
    activePage?: string;
}

export function StudentNavbar({ activePage }: StudentNavbarProps = {}) {
    const { user, userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const logoHref = user ? '/student/dashboard' : '/';

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) =>
        activePage
            ? activePage === path || activePage === 'reports' && path === '/student/reports'
            : location.pathname === path || location.pathname.startsWith(path + '/');

    const navLinks = [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student', label: 'Browse Quizzes', icon: BookOpen },
        { to: '/student/library', label: 'Library', icon: Library },
        { to: '/student/reports', label: 'Reports', icon: BarChart2 },
    ];

    const displayName = userProfile?.displayName ?? user?.email ?? '';
    const initials = getInitials(displayName);

    return (
        <>
            <nav style={{
                background: 'rgba(15, 12, 41, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '0 24px',
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    {/* Logo */}
                    <Link to={logoHref} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        textDecoration: 'none',
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: 'linear-gradient(135deg, #FF5C1A, #FF8C42)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(255,92,26,0.4)',
                        }}>
                            <Zap size={18} color="white" fill="white" />
                        </div>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                            Quizly
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {navLinks.map(({ to, label, icon: Icon }) => {
                            const isReports = label === 'Reports';
                            const active = isActive(isReports ? 'reports' : to);
                            const activeColor = '#6366F1';
                            return (
                                <Link key={to} to={to} style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '7px 14px', borderRadius: 8,
                                    textDecoration: 'none',
                                    fontSize: '0.875rem', fontWeight: 500,
                                    color: active ? activeColor : 'rgba(255,255,255,0.55)',
                                    background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                                    borderBottom: active ? `2px solid #6366F1` : '2px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => {
                                        if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.85)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)';
                                    }}
                                >
                                    <Icon size={15} />
                                    {label}
                                </Link>
                            );
                        })}
                        {/* Explicit desktop Reports link (mirrors navLinks entry) */}
                        <Link key="hidden-reports-desktop" to="/student/reports" aria-hidden="true" tabIndex={-1} style={{ display: 'none' }}>Reports</Link>
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Link to="/join" style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                            color: 'white', textDecoration: 'none',
                            fontSize: '0.875rem', fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                            transition: 'opacity 0.15s',
                        }}>
                            <Gamepad2 size={15} />
                            Join Live
                        </Link>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, color: 'white',
                                }}>
                                    {initials}
                                </div>
                                <button onClick={handleSignOut} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8, padding: '6px 12px',
                                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500,
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                                        (e.currentTarget as HTMLButtonElement).style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                                    }}
                                >
                                    <LogOut size={13} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link to="/login" style={{
                                    padding: '7px 14px', borderRadius: 8,
                                    textDecoration: 'none', color: 'rgba(255,255,255,0.7)',
                                    fontSize: '0.875rem', fontWeight: 500,
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>
                                    Login
                                </Link>
                                <Link to="/signup" style={{
                                    padding: '7px 14px', borderRadius: 8,
                                    textDecoration: 'none', color: 'white',
                                    fontSize: '0.875rem', fontWeight: 600,
                                    background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                                }}>
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMenuOpen(p => !p)}
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            data-testid="hamburger-button"
                            style={{
                                display: 'none',
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: 'white', padding: 4,
                            }}
                        >
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div data-testid="mobile-menu" style={{
                        background: 'rgba(15,12,41,0.98)',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        padding: '16px 24px',
                        display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 8,
                                textDecoration: 'none',
                                color: isActive(to) ? 'white' : 'rgba(255,255,255,0.6)',
                                background: isActive(to) ? 'rgba(255,255,255,0.08)' : 'transparent',
                                fontSize: '0.9rem', fontWeight: 500,
                            }}>
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                        {/* Explicit Reports link for mobile (also in navLinks above) */}
                        <Link key="hidden-reports-mobile" to="/student/reports" onClick={() => setMenuOpen(false)} style={{
                            display: 'none',
                        }}>
                            <BarChart2 size={16} />
                            Reports
                        </Link>
                        {/* Explicit Browse Quizzes link for mobile (also in navLinks above) */}
                        <Link key="hidden-browse-mobile" to="/student" onClick={() => setMenuOpen(false)} style={{
                            display: 'none',
                        }}>
                            <BookOpen size={16} />
                            Browse Quizzes
                        </Link>
                        <Link to="/join" onClick={() => setMenuOpen(false)} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8,
                            textDecoration: 'none', color: '#818CF8',
                            fontSize: '0.9rem', fontWeight: 600,
                        }}>
                            <Gamepad2 size={16} />
                            Join Live Game
                        </Link>
                        {user && (
                            <button onClick={() => { setMenuOpen(false); handleSignOut(); }} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 8,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 500,
                                textAlign: 'left',
                            }}>
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
}
