import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Library,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { navItems } from '../config/navigation';

interface TeacherSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ isOpen, onClose }: TeacherSidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (onClose && isOpen) onClose();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-white border-r border-gray-100 flex flex-col z-[100] transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF5C1A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF5C1A]/20">
              <Play fill="currentColor" size={18} />
            </div>
            <span className="font-extrabold text-lg text-gray-900 tracking-tight">Quizly</span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/teacher'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative group
                ${isActive
                  ? 'bg-[#FFF3EE] text-[#FF5C1A]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#FF5C1A] rounded-r-full"
                    />
                  )}
                  <item.icon size={18} className={isActive ? 'text-[#FF5C1A]' : 'text-gray-400 group-hover:text-gray-600'} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pro Tip card */}
        <div className="p-4 mt-auto">
          <div className="bg-[#FFF3EE] rounded-2xl p-4 mb-3 border border-[#FF5C1A]/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-[#FF5C1A]" />
              <span className="text-[10px] font-black text-[#FF5C1A] uppercase tracking-widest">Upgrade Account</span>
            </div>
            <p className="text-[12px] font-bold text-gray-600 mb-4 leading-relaxed line-clamp-2">
              Unlock AI quiz generation and advanced analytics.
            </p>
            <button
              onClick={() => navigate('/teacher/billing')}
              className="w-full py-2 bg-white border-1.5 border-[#FF5C1A] rounded-xl text-[#FF5C1A] text-[11px] font-black hover:bg-[#FF5C1A] hover:text-white transition-all uppercase tracking-wider shadow-sm"
            >
              Get Pro Access
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#6B7280] text-sm font-bold hover:bg-red-50 hover:text-red-500 transition-all group"
          >
            <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
