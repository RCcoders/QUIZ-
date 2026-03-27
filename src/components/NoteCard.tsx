import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { Note } from '../types/student';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-blue-50 text-blue-600',
  science: 'bg-green-50 text-green-600',
  english: 'bg-purple-50 text-purple-600',
  history: 'bg-yellow-50 text-yellow-700',
  geography: 'bg-teal-50 text-teal-600',
  default: 'bg-slate-50 text-slate-500',
};

function getSubjectColor(subject: string): string {
  const key = subject.toLowerCase();
  return SUBJECT_COLORS[key] ?? SUBJECT_COLORS.default;
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trimEnd() + '…';
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100 hover:border-[#FF5C1A] transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#FF5C1A] group-hover:bg-[#FF5C1A] group-hover:text-white transition-all flex-shrink-0">
          <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-[#0F172A] mb-2 truncate">{note.title}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getSubjectColor(note.subject)}`}>
            {note.subject}
          </span>
        </div>
      </div>

      <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2">
        {truncateContent(note.content)}
      </p>
    </motion.div>
  );
}
