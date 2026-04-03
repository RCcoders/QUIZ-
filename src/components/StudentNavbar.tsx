import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, BookOpen, BarChart2, Gamepad2, LogOut, Menu, X, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <nav className="sticky top-0 z-50 bg-[#0F0C29]/95 backdrop-blur-xl border-b border-white/10 font-sans shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Logo Section */}
                <Link to={logoHref} className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5C1A] to-[#FF8C42] flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-105 transition-transform">
                        <Zap size={18} color="white" fill="white" />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight">
                        Quizly
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden lg:flex items-center gap-1.5 flex-1 justify-center px-8">
                    {navLinks.map(({ to, label, icon: Icon }) => {
                        const isReports = label === 'Reports';
                        const active = isActive(isReports ? 'reports' : to);
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-b-2 ${active
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500 shadow-sm'
                                    : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop Right Side Actions */}
                <div className="hidden lg:flex items-center gap-4">
                    <Link
                        to="/join"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Gamepad2 size={16} />
                        Join Live
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white ring-2 ring-white/10">
                                {initials}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-white/70 hover:text-white px-4 py-2 text-sm font-bold transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="bg-white text-[#0F0C29] px-5 py-2.5 rounded-xl text-sm font-black hover:bg-white/90 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile & Split-Screen Hamburger Toggle */}
                <div className="lg:hidden flex items-center gap-3">
                    <Link
                        to="/join"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 sm:w-auto sm:px-4 sm:gap-2"
                    >
                        <Gamepad2 size={18} />
                        <span className="hidden sm:inline text-xs font-black">Join</span>
                    </Link>

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white active:bg-white/10 transition-colors"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile / Split-Screen Menu Dropdown */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-white/10 bg-[#0F0C29] overflow-hidden"
                    >
                        <div className="px-4 py-6 space-y-2">
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl text-base font-bold transition-all ${isActive(to)
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {label}
                                </Link>
                            ))}
                            <div className="pt-4 mt-4 border-t border-white/10">
                                {user ? (
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-white">
                                                {initials}
                                            </div>
                                            <div className="text-sm">
                                                <div className="text-white font-bold truncate max-w-[150px]">{displayName}</div>
                                                <div className="text-white/40 text-xs">Student Account</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setMenuOpen(false); handleSignOut(); }}
                                            className="p-3 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors"
                                        >
                                            <LogOut size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link to="/login" className="flex items-center justify-center p-4 rounded-2xl border border-white/10 text-white/70 font-bold">
                                            Login
                                        </Link>
                                        <Link to="/signup" className="flex items-center justify-center p-4 rounded-2xl bg-indigo-500 text-white font-black shadow-lg">
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
