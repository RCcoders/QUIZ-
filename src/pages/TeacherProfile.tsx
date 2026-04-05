import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, User, Book, Building, IdCard, Briefcase, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { TeacherHeader } from '../components/TeacherHeader';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

export function TeacherProfile() {
    const { user, refreshUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        displayName: '',
        teacherId: '',
        department: '',
        subjects: '',
        post: '',
        idCardImage: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                teacherId: user.teacherId || '',
                department: user.department || '',
                subjects: user.subjects?.join(', ') || '',
                post: user.post || '',
                idCardImage: user.idCardImage || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const data = await apiFetch('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    ...formData,
                    subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s !== ''),
                }),
            });
            // Update local state and context if necessary
            // e.g. setUserProfile(data);
            await refreshUser();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] overflow-x-hidden font-['Inter',_sans-serif]">
            <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 transition-all duration-300 lg:ml-[240px] px-4 sm:px-8 pb-12 min-w-0">
                <TeacherHeader
                    title="Teacher Profile"
                    showSearch={false}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <Link to="/teacher" className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-[#FF5C1A] transition-colors mb-6 no-underline">
                        <ChevronLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Photo / Basic Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF5C1A] to-[#ff8c5a] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-[#FF5C1A]/30 border-4 border-white">
                                        {formData.displayName ? formData.displayName[0].toUpperCase() : 'T'}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2.5 bg-white rounded-2xl shadow-xl border border-gray-100 text-[#FF5C1A] hover:bg-gray-50 transition-all active:scale-95 group">
                                        <Camera size={18} />
                                    </button>
                                </div>
                                <h2 className="text-xl font-black text-gray-900 m-0">{formData.displayName}</h2>
                                <p className="text-sm font-bold text-gray-400 mt-1">{user?.email}</p>
                                <span className="inline-block mt-4 px-4 py-1.5 bg-[#FFF3EE] text-[#FF5C1A] text-[11px] font-black uppercase tracking-widest rounded-full">
                                    Verified Teacher
                                </span>
                            </div>

                            {/* Verification Stats */}
                            <div className="bg-[#111827] rounded-3xl p-8 text-white">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                    Account Status
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                                        <span className="text-xs font-bold text-gray-400">Institutional ID</span>
                                        <span className="text-xs font-black text-emerald-400 uppercase">Linked</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                                        <span className="text-xs font-bold text-gray-400">Profile Completion</span>
                                        <span className="text-xs font-black text-white">85%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                                    <User size={20} className="text-[#FF5C1A]" />
                                    Department Details
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    name="displayName"
                                                    value={formData.displayName}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                    placeholder="e.g. Dr. Jane Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Teacher ID</label>
                                            <div className="relative">
                                                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    name="teacherId"
                                                    value={formData.teacherId}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                    placeholder="e.g. PROF-9821"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                                            <div className="relative">
                                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                    placeholder="e.g. Computer Science"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Position / Post</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    name="post"
                                                    value={formData.post}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                    placeholder="e.g. Associate Professor"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Subjects (Comma separated)</label>
                                        <div className="relative">
                                            <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                name="subjects"
                                                value={formData.subjects}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                placeholder="e.g. Data Structures, Algorithms, AI"
                                            />
                                        </div>
                                    </div>

                                    {/* ID Card Image - Simulation */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">ID Card Mock / Link</label>
                                        <div className="relative">
                                            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                name="idCardImage"
                                                value={formData.idCardImage}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FF5C1A]/20 focus:border-[#FF5C1A] focus:bg-white transition-all"
                                                placeholder="Link to ID card image or document"
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl border border-red-100">{error}</div>}
                                    {saveSuccess && <div className="p-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-2xl border border-emerald-100">Profile updated successfully!</div>}

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                                                ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#FF5C1A] text-white hover:bg-[#e65317] shadow-xl shadow-[#FF5C1A]/20 active:scale-95'}`}
                                        >
                                            <Save size={18} />
                                            {loading ? 'Saving Changes...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
