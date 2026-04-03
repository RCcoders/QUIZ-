import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Settings, Menu, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TeacherHeaderProps {
    title?: string;
    showSearch?: boolean;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    onMenuClick?: () => void;
}

export function TeacherHeader({
    title,
    showSearch = true,
    searchQuery = '',
    onSearchChange,
    onMenuClick
}: TeacherHeaderProps) {
    const { user } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Derive teacher initials from email or display name
    const teacherInitials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || 'T';

    return (
        <header className="sticky top-0 h-16 lg:h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-[80] lg:z-[60] transition-all">

            {/* Mobile: Logo & Menu */}
            <div className="flex items-center gap-3 lg:hidden">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu size={22} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FF5C1A] rounded-lg flex items-center justify-center text-white shadow-md shadow-[#FF5C1A]/10 scale-90 sm:scale-100">
                        <Play fill="currentColor" size={16} />
                    </div>
                    <span className="font-black text-base text-gray-900 tracking-tight hidden sm:inline">Quizly</span>
                </div>
            </div>

            {/* Title (Desktop) or Page Name */}
            {title && (
                <div className="flex-1 lg:flex-none">
                    <h1 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 m-0 truncate lg:max-w-xs ml-2 lg:ml-0">
                        {title}
                    </h1>
                </div>
            )}

            {!title && <div className="hidden lg:block flex-1" />}

            {/* Desktop Search / Profile Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                {showSearch && (
                    <div className="relative hidden md:block w-full max-w-[280px] lg:max-w-md ml-4">
                        <Search
                            size={16}
                            className="absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 border border-gray-100 rounded-xl bg-gray-50/50 text-sm font-medium text-gray-900 outline-none focus:ring-4 focus:ring-[#FF5C1A]/10 focus:border-[#FF5C1A] focus:bg-white transition-all"
                        />
                    </div>
                )}

                {/* Mobile Search Toggle (Optional) */}
                {showSearch && (
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <Search size={20} />
                    </button>
                )}

                <div className="flex items-center gap-1.5 sm:gap-3">
                    <button className="hidden sm:flex w-10 h-10 border border-transparent rounded-xl bg-gray-50/50 items-center justify-center cursor-pointer hover:bg-white hover:border-gray-200 transition-all group">
                        <Bell size={18} className="text-gray-400 group-hover:text-gray-600" />
                    </button>

                    <button className="hidden sm:flex w-10 h-10 border border-transparent rounded-xl bg-gray-50/50 items-center justify-center cursor-pointer hover:bg-white hover:border-gray-200 transition-all group">
                        <Settings size={18} className="text-gray-400 group-hover:text-gray-600" />
                    </button>

                    <Link
                        to="/teacher/profile"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FF5C1A] to-[#ff8c5a] flex items-center justify-center text-white font-black text-[10px] sm:text-xs shrink-0 shadow-lg shadow-[#FF5C1A]/20 hover:scale-105 active:scale-95 transition-all no-underline border-2 border-white ml-1"
                    >
                        {teacherInitials}
                    </Link>
                </div>
            </div>

            {/* Mobile Expanded Search */}
            {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 p-4 bg-white border-b border-gray-100 md:hidden animate-in slide-in-from-top duration-200">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-[#FF5C1A] transition-all outline-none"
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
