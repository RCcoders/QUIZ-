import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Menu, X } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

export function LandingHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-[#FF5C1A] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
                            <Play size={18} fill="white" color="white" className="ml-0.5" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">Quizly</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#FF5C1A] transition-colors"
                            >
                                {link.name}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Login
                        </button>
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2.5 bg-[#FF5C1A] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:bg-[#E54E10] transition-all hover:scale-105 active:scale-95"
                        >
                            Create Quiz
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-4 text-base font-bold text-gray-700 dark:text-gray-300 hover:text-[#FF5C1A] hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    onClick={() => { navigate('/login'); setIsOpen(false); }}
                                    className="w-full py-4 text-base font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800 rounded-xl"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { navigate('/signup'); setIsOpen(false); }}
                                    className="w-full py-4 text-base font-bold text-white bg-[#FF5C1A] rounded-xl shadow-lg shadow-orange-100"
                                >
                                    Create Quiz
                                </button>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </header>
    );
}
