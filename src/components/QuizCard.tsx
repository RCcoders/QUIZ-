import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Play, BarChart2, ToggleLeft, ToggleRight, BookOpen, Loader } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    description?: string;
    isActive: boolean;
}

interface QuizWithCount extends Quiz {
    questionCount?: number;
}

interface QuizCardProps {
    quiz: QuizWithCount;
    index: number;
    onToggleActive: (quiz: QuizWithCount) => void;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

export function QuizCard({ quiz, index, onToggleActive, onDelete, deletingId }: QuizCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100 hover:border-[#FF5C1A] transition-all group"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#FF5C1A] group-hover:bg-[#FF5C1A] group-hover:text-white transition-all">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] mb-1">{quiz.title}</h3>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${quiz.isActive ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-400'}`}>
                                {quiz.isActive ? 'Active' : 'Draft'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                {quiz.questionCount || 0} Questions
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onToggleActive(quiz)}
                    className={`p-2 rounded-xl transition-all ${quiz.isActive ? 'text-[#FF5C1A]' : 'text-slate-300'}`}
                >
                    {quiz.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
            </div>

            {quiz.description && (
                <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-2 leading-relaxed">
                    {quiz.description}
                </p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Link
                    to={`/teacher/quiz/${quiz.id}/host`}
                    className="flex items-center justify-center gap-2 bg-[#FF5C1A] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#E64A10] transition-all"
                >
                    <Play size={16} fill="currentColor" />
                    Host
                </Link>
                <div className="flex gap-2">
                    <Link
                        to={`/teacher/quiz/${quiz.id}/edit`}
                        className="flex-1 flex items-center justify-center bg-slate-50 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all"
                        title="Edit"
                    >
                        <Edit size={18} />
                    </Link>
                    <Link
                        to={`/teacher/quiz/${quiz.id}/results`}
                        className="flex-1 flex items-center justify-center bg-slate-50 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all"
                        title="Reports"
                    >
                        <BarChart2 size={18} />
                    </Link>
                    <button
                        onClick={() => onDelete(quiz.id)}
                        className="flex-1 flex items-center justify-center bg-red-50 text-red-500 py-3 rounded-xl font-bold hover:bg-red-100 transition-all"
                        disabled={deletingId === quiz.id}
                        title="Delete"
                    >
                        {deletingId === quiz.id ? (
                            <Loader className="animate-spin" size={18} />
                        ) : (
                            <Trash2 size={18} />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
