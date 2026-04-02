import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Instagram, Twitter, Facebook, Github } from 'lucide-react';

export function LandingFooter() {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Product',
            links: [
                { name: 'Features', href: '#features' },
                { name: 'How It Works', href: '#how-it-works' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Changelog', href: '#' },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'About', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'Press', href: '#' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Cookie Policy', href: '/privacy' },
                { name: 'GDPR', href: '#' },
            ],
        },
    ];

    return (
        <footer className="bg-[#0F172A] dark:bg-black text-gray-400 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 bg-[#FF5C1A] rounded-xl flex items-center justify-center">
                                <Play size={18} fill="white" color="white" className="ml-0.5" />
                            </div>
                            <span className="font-black text-xl tracking-tight text-white font-headline">Quizly</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-8">
                            The modern quiz platform for educators. Create, share, and analyze quizzes powered by AI. Save hours of prep time and engage students like never before.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Instagram, Facebook, Github].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF5C1A] hover:text-white transition-all transform hover:scale-110"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 font-headline">
                                {section.title}
                            </h3>
                            <ul className="space-y-4">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.href.startsWith('/') ? link.href : '#'}
                                            className="text-sm hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-slate-500">
                        © {currentYear} Quizly Inc. All rights reserved. Made with ❤️ for educators.
                    </p>
                    <div className="flex gap-8">
                        <Link to="/privacy" className="text-xs text-slate-500 hover:text-white">Privacy</Link>
                        <Link to="/terms" className="text-xs text-slate-500 hover:text-white">Terms</Link>
                        <Link to="/privacy" className="text-xs text-slate-500 hover:text-white">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
