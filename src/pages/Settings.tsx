import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { useState } from 'react';
import {
    User, Bell, Lock, Shield, CreditCard, Save,
    Camera, Mail, Globe, Zap, Settings as SettingsIcon,
    Database, Target, Cpu, HardDrive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSidebar, MobileHeader } from '../components/TeacherSidebar';
import { Helmet } from 'react-helmet-async';

export function Settings() {
    const { user, updateUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<'PROFILE' | 'PREFERENCES' | 'SECURITY' | 'BILLING'>('PROFILE');
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSave = async () => {
        if (activeSection === 'SECURITY') {
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
        }

        setIsSaving(true);
        const { error } = await updateUser({
            displayName,
            email,
            password: password || undefined
        });

        setIsSaving(false);
        if (error) {
            alert(error.message);
        } else {
            // Optional: Success toast
            setPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="flex min-h-screen bg-gray-50 dark:bg-black font-sans selection:bg-orange-100 selection:text-orange-900 transition-colors duration-300">
                <Helmet>
                    <title>System Oversight | Quizly</title>
                </Helmet>

                <MobileHeader onOpen={() => setIsSidebarOpen(true)} />
                <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-[240px] relative overflow-hidden">
                    {/* Background Decorations */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/10 dark:bg-orange-500/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />

                    {/* Hero Header */}
                    <header className="relative bg-white dark:bg-black pt-20 pb-20 px-8 lg:px-14 overflow-hidden border-b border-gray-100 dark:border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 dark:from-orange-500/10 to-transparent pointer-events-none" />

                        <div className="relative z-10 max-w-5xl mx-auto space-y-10">
                            <div className="space-y-6">
                                <m.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="inline-flex items-center gap-3 bg-orange-500/20 text-orange-400 px-6 py-2 rounded-full backdrop-blur-md border border-orange-500/30 font-black text-[10px] uppercase tracking-[0.2em] italic"
                                >
                                    <Cpu size={14} className="animate-pulse" />
                                    System Configuration
                                </m.div>
                                <m.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85] font-headline uppercase italic"
                                >
                                    Oversight <span className="text-[#FF5C1A] underline decoration-8 underline-offset-[12px] decoration-gray-900/10 dark:decoration-white/10 italic uppercase">Console</span>
                                </m.h1>
                                <m.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-gray-500 dark:text-gray-400 text-sm font-bold max-w-xl italic uppercase tracking-wider leading-relaxed"
                                >
                                    Modify your operational parameters. Configure identity protocols, security encryption, and node deployment preferences.
                                </m.p>
                            </div>
                        </div>
                    </header>

                    {/* Navigation Tabs */}
                    <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-8 py-6 transition-all duration-300">
                        <div className="max-w-5xl mx-auto flex items-center gap-4 overflow-x-auto no-scrollbar">
                            {(['PROFILE', 'PREFERENCES', 'SECURITY', 'BILLING'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSection(tab)}
                                    className={`px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all whitespace-nowrap
                                        ${activeSection === tab ? 'bg-gray-900 dark:bg-[#FF5C1A] text-white shadow-xl' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-900'}
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 lg:p-14 max-w-5xl mx-auto w-full relative z-10">
                        <AnimatePresence mode="wait">
                            {activeSection === 'PROFILE' && (
                                <m.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-12"
                                >
                                    {/* Avatar Section */}
                                    <div className="flex flex-col md:flex-row items-center gap-10 bg-white dark:bg-zinc-900/50 p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-black/[0.02] backdrop-blur-md">
                                        <div className="relative group">
                                            <div className="w-32 h-32 bg-orange-500/10 rounded-[2.5rem] flex items-center justify-center text-orange-500 font-black text-4xl shadow-inner border border-orange-500/20">
                                                {user?.displayName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 dark:bg-[#FF5C1A] text-white rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                                                <Camera size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <div className="space-y-4 text-center md:text-left">
                                            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic font-headline leading-none">Intelligence Officer</h2>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] italic">Identity UID: {user?._id || 'UNIDENTIFIED'}</p>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 italic">Status: ACTIVE</span>
                                                <span className="px-4 py-1.5 bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-orange-500/20 italic">Role: TEACHER_NODE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4 transition-all hover:border-gray-900 dark:hover:border-[#FF5C1A] backdrop-blur-md">
                                            <label className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-[0.2em] italic block">
                                                NODE OPERATOR NAME
                                            </label>
                                            <div className="relative group">
                                                <User size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" strokeWidth={2.5} />
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={e => setDisplayName(e.target.value)}
                                                    className="w-full pl-8 py-2 bg-transparent border-b-2 border-gray-50 dark:border-zinc-800 focus:border-gray-900 dark:focus:border-[#FF5C1A] outline-none font-black text-sm text-gray-900 dark:text-white uppercase italic tracking-widest transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4 transition-all hover:border-gray-900 dark:hover:border-[#FF5C1A] backdrop-blur-md">
                                            <label className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-[0.2em] italic block">
                                                COORDINATION EMAIL
                                            </label>
                                            <div className="relative group">
                                                <Mail size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" strokeWidth={2.5} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-8 py-2 bg-transparent border-b-2 border-gray-50 dark:border-zinc-800 focus:border-gray-900 dark:focus:border-[#FF5C1A] outline-none font-black text-sm text-gray-900 dark:text-white uppercase italic tracking-widest transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 opacity-60">
                                            <label className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-[0.2em] italic block">
                                                INSTITUTIONAL BIND
                                            </label>
                                            <div className="relative group">
                                                <Globe size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" strokeWidth={2.5} />
                                                <input
                                                    type="text"
                                                    disabled
                                                    defaultValue="Global Intelligence Network"
                                                    className="w-full pl-8 py-2 bg-transparent border-b-2 border-transparent outline-none font-black text-sm text-gray-900 dark:text-white uppercase italic tracking-widest"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 opacity-60">
                                            <label className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-[0.2em] italic block">
                                                PRIMARY SPECIALIZATION
                                            </label>
                                            <div className="relative group">
                                                <Target size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" strokeWidth={2.5} />
                                                <input
                                                    type="text"
                                                    disabled
                                                    defaultValue="Advanced Pedagogical Structures"
                                                    className="w-full pl-8 py-2 bg-transparent border-b-2 border-transparent outline-none font-black text-sm text-gray-900 dark:text-white uppercase italic tracking-widest"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </m.div>
                            )}

                            {activeSection === 'PREFERENCES' && (
                                <m.div
                                    key="preferences"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white dark:bg-zinc-900/50 p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-black/[0.02] space-y-10 backdrop-blur-md">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic font-headline">Intelligence Flow</h3>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest italic">Automate your node deployment protocols.</p>
                                        </div>

                                        <div className="space-y-6">
                                            {[
                                                { label: 'AUTO-GENERATE ANALYTICAL REPORTS', desc: 'Synthesize student performance data into PDF nodes immediately after session termination.', default: true },
                                                { label: 'GLOBAL ARCHIVE VISIBILITY', desc: 'Enable secondary node operators to access your intelligence structures.', default: false },
                                                { label: 'INTRA-NODE MESSAGING', desc: 'Maintain open links for real-time communication with deployed student nodes.', default: true },
                                            ].map((pref) => (
                                                <label key={pref.label} className="flex items-start justify-between gap-8 group cursor-pointer p-6 rounded-3xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase italic tracking-widest group-hover:text-[#FF5C1A] transition-colors">{pref.label}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase italic tracking-wide leading-relaxed max-w-md">{pref.desc}</p>
                                                    </div>
                                                    <div className="relative flex items-center mt-1">
                                                        <input type="checkbox" defaultChecked={pref.default} className="peer sr-only" />
                                                        <div className="w-14 h-8 bg-gray-200 dark:bg-zinc-800 rounded-full peer-checked:bg-orange-500 transition-all shadow-inner" />
                                                        <div className="absolute left-1 top-1 w-6 h-6 bg-white dark:bg-zinc-400 rounded-full peer-checked:translate-x-6 dark:peer-checked:bg-white transition-all shadow-xl shadow-black/20" />
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-zinc-900 dark:bg-zinc-950 p-10 rounded-[3.5rem] border border-black dark:border-white/10 shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="space-y-2 text-center md:text-left">
                                                <h3 className="text-xl font-black text-white uppercase italic font-headline">Danger Zone</h3>
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Proceed with extreme caution.</p>
                                            </div>
                                            <button className="px-10 py-5 bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-rose-500 hover:text-white transition-all">
                                                PURGE ACCOUNT NODE
                                            </button>
                                        </div>
                                    </div>
                                </m.div>
                            )}

                            {activeSection === 'SECURITY' && (
                                <m.div
                                    key="security"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white dark:bg-zinc-900/50 p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-black/[0.02] space-y-12 backdrop-blur-md">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gray-900 dark:bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center text-white dark:text-orange-500">
                                                <Shield size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic font-headline">Encryption Keys</h3>
                                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest italic">Maintain the integrity of your identity link.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8 max-w-md mx-auto">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic ml-2">
                                                    NEW ENCRYPTION STRING
                                                </label>
                                                <div className="relative group">
                                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        className="w-full pl-14 pr-8 py-4 bg-gray-100/50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-zinc-800 dark:text-white focus:border-gray-900 dark:focus:border-[#FF5C1A] outline-none font-black text-sm transition-all shadow-inner"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic ml-2">
                                                    CONFIRM STRING
                                                </label>
                                                <div className="relative group">
                                                    <Shield size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="w-full pl-14 pr-8 py-4 bg-gray-100/50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-zinc-800 dark:text-white focus:border-gray-900 dark:focus:border-[#FF5C1A] outline-none font-black text-sm transition-all shadow-inner"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSave}
                                                className="w-full py-5 bg-gray-900 dark:bg-[#FF5C1A] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] italic shadow-2xl shadow-black/20 dark:shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                UPDATE ENCRYPTION
                                            </button>
                                        </div>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>

                        {/* Global Actions */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-16 flex justify-end"
                        >
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`inline-flex items-center gap-4 px-12 py-6 bg-[#FF5C1A] text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all italic disabled:bg-gray-400 disabled:shadow-none
                                    ${isSaving ? 'animate-pulse' : ''}
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <Database size={18} className="animate-spin" />
                                        SYNCING DATA...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} strokeWidth={3} />
                                        COMMIT PARAMETERS
                                    </>
                                )}
                            </button>
                        </m.div>
                    </div>
                </main>
            </div>

            <style>{`
                .font-headline { font-family: 'Outfit', sans-serif; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
                .dark ::-webkit-scrollbar-thumb { background: #27272a; }
                ::-webkit-scrollbar-thumb:hover { background: #D1D5DB; background-clip: content-box; }
                .dark ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
            `}</style>
        </LazyMotion>
    );
}

export default Settings;
