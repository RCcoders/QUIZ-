import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Save, Plus, Trash2, CheckCircle, Loader, Clock, Target, XCircle,
    BookOpen, Zap, Eye, Lightbulb, ChevronDown
} from 'lucide-react';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface QuestionForm {
    id?: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    difficulty: 'easy' | 'medium' | 'hard';
}

const emptyQuestion: QuestionForm = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'medium',
};

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Other'];

export function QuizEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [timerSeconds, setTimerSeconds] = useState(30);
    const [showResults, setShowResults] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
    const [expandedQuestion, setExpandedQuestion] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'drafts' | 'templates' | 'settings'>('drafts');

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');

    // AI Generator state
    const [syllabusText, setSyllabusText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch quiz data if editing
    useEffect(() => {
        if (isEditing && id) {
            const fetchQuiz = async () => {
                try {
                    const data = await apiFetch(`/api/quizzes/${id}`);
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setSubject(data.subject || '');
                    setTimerEnabled(data.timerEnabled);
                    setTimerSeconds(data.timerSeconds);
                    setQuestions(data.questions.map((q: any) => ({
                        ...q,
                        // Ensure id is present if backend provides it
                        id: q._id || q.id
                    })));
                } catch (err) {
                    setError('Failed to load quiz data');
                } finally {
                    setLoading(false);
                }
            };
            fetchQuiz();
        }
    }, [id, isEditing]);

    const saveDraft = async () => {
        if (!title.trim()) { setError('Please enter a quiz title'); return; }
        setSaving(true);
        setError('');
        try {
            const body = {
                title,
                description,
                subject,
                timerEnabled,
                timerSeconds,
                questions,
                status: 'draft'
            };

            const endpoint = isEditing ? `/api/quizzes/${id}` : '/api/quizzes';
            const method = isEditing ? 'PUT' : 'POST';

            await apiFetch(endpoint, { method, body });
            setSaving(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save draft');
            setSaving(false);
        }
    };

    const publishQuiz = async () => {
        if (!title.trim()) { setError('Please enter a quiz title'); return; }
        if (questions.length === 0 || !questions[0].questionText.trim()) { setError('Please add at least one question'); return; }

        // Basic validation
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
                setError(`Question ${i + 1} is incomplete`);
                setExpandedQuestion(i);
                return;
            }
        }

        setPublishing(true);
        setError('');
        try {
            const body = {
                title,
                description,
                subject,
                timerEnabled,
                timerSeconds,
                questions,
                status: 'published'
            };

            const endpoint = isEditing ? `/api/quizzes/${id}` : '/api/quizzes';
            const method = isEditing ? 'PUT' : 'POST';

            await apiFetch(endpoint, { method, body });
            navigate('/teacher');
        } catch (err: any) {
            setError(err.message || 'Failed to publish quiz');
            setPublishing(false);
        }
    };

    const handleSave = publishQuiz;

    const addQuestion = () => {
        setQuestions([...questions, { ...emptyQuestion }]);
        setExpandedQuestion(questions.length);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
            if (expandedQuestion >= questions.length - 1) {
                setExpandedQuestion(Math.max(0, questions.length - 2));
            }
        }
    };

    const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const generateQuestions = async () => {
        if (!syllabusText.trim()) { setError('Please enter content to generate questions'); return; }
        setIsGenerating(true);
        setError('');
        try {
            const data = await apiFetch('/api/adaptive/generate-from-text', {
                method: 'POST',
                body: { text: syllabusText, count: 5 }
            });

            const newQuestions: QuestionForm[] = data.questions.map((q: any) => ({
                questionText: q.question_text,
                optionA: q.option_a,
                optionB: q.option_b,
                optionC: q.option_c,
                optionD: q.option_d,
                correctAnswer: q.correct_answer,
                difficulty: q.difficulty,
            }));

            if (questions.length === 1 && !questions[0].questionText.trim()) {
                setQuestions(newQuestions);
            } else {
                setQuestions([...questions, ...newQuestions]);
            }
            setSyllabusText('');
        } catch (err: any) {
            setError(err.message || 'Failed to generate questions');
        } finally {
            setIsGenerating(false);
        }
    };

    // Quiz Strength score: 0–100 based on completeness of questions
    const quizStrength = (() => {
        if (questions.length === 0) return 0;
        let score = 0;
        if (title.trim()) score += 20;
        if (description.trim()) score += 10;
        const qScore = questions.reduce((acc, q) => {
            let s = 0;
            if (q.questionText.trim()) s += 30;
            if (q.optionA.trim() && q.optionB.trim() && q.optionC.trim() && q.optionD.trim()) s += 70;
            return acc + s;
        }, 0) / questions.length;
        score += Math.round(qScore * 0.7);
        return Math.min(100, score);
    })();

    const strengthColor = quizStrength >= 70 ? '#10B981' : quizStrength >= 40 ? '#F59E0B' : '#EF4444';

    const optionLetters = ['A', 'B', 'C', 'D'] as const;

    // void handleSave to suppress unused warning while keeping it available
    void handleSave;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ds-bg-page, #F5F5F5)', fontFamily: "'Inter', sans-serif" }}>
            <TeacherSidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '240px' }}>
                {/* ── TOP BAR (task 6.1) ── */}
                <div style={{
                    background: '#fff',
                    borderBottom: '1px solid #E5E7EB',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 64,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    {/* Title + subtitle */}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                            {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>Manual Assessment Builder</div>
                    </div>

                    {/* Tab nav */}
                    <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
                        {(['drafts', 'templates', 'settings'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: activeTab === tab ? '#fff' : 'transparent',
                                    color: activeTab === tab ? '#111827' : '#6B7280',
                                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={saveDraft}
                            disabled={saving}
                            style={{
                                padding: '8px 18px',
                                borderRadius: 8,
                                border: '1.5px solid #E5E7EB',
                                background: '#fff',
                                color: '#374151',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                opacity: saving ? 0.7 : 1,
                            }}
                        >
                            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Draft
                        </button>
                        <button
                            onClick={publishQuiz}
                            disabled={publishing}
                            style={{
                                padding: '8px 18px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#FF5C1A',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: publishing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                opacity: publishing ? 0.7 : 1,
                            }}
                        >
                            {publishing ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                            Publish
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: '#FEF2F2', borderBottom: '1px solid #FECACA',
                            color: '#EF4444', padding: '10px 24px',
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                        }}
                    >
                        <XCircle size={16} />
                        {error}
                    </motion.div>
                )}

                {/* ── BODY: three-panel layout ── */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* ── LEFT PANEL — Quiz Information (task 6.2) ── */}
                    <div style={{
                        width: 320,
                        minWidth: 320,
                        background: '#fff',
                        borderRight: '1px solid #E5E7EB',
                        padding: '24px 20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                            Quiz Information
                        </div>

                        {/* Quiz Title */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Quiz Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter quiz title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB',
                                    fontSize: 14, fontWeight: 500, color: '#111827', outline: 'none',
                                    background: '#FAFAFA',
                                }}
                            />
                        </div>

                        {/* Subject */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Subject
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    style={{
                                        width: '100%', padding: '9px 32px 9px 12px', borderRadius: 8,
                                        border: '1.5px solid #E5E7EB', fontSize: 14, fontWeight: 500,
                                        color: subject ? '#111827' : '#9CA3AF', outline: 'none',
                                        background: '#FAFAFA', appearance: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="">Select subject...</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Timer */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Timer (seconds per question)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="number"
                                    min={5}
                                    value={timerSeconds}
                                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                                    style={{
                                        flex: 1, padding: '9px 12px', borderRadius: 8,
                                        border: '1.5px solid #E5E7EB', fontSize: 14, fontWeight: 500,
                                        color: '#111827', outline: 'none', background: '#FAFAFA',
                                    }}
                                />
                                <Clock size={16} style={{ color: '#9CA3AF' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>Enable timer</span>
                                <div
                                    onClick={() => setTimerEnabled(!timerEnabled)}
                                    style={{
                                        width: 40, height: 22, borderRadius: 11, position: 'relative',
                                        cursor: 'pointer', background: timerEnabled ? '#FF5C1A' : '#E5E7EB',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: 3, width: 16, height: 16,
                                        borderRadius: '50%', background: '#fff',
                                        left: timerEnabled ? 21 : 3, transition: 'left 0.2s',
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <textarea
                                placeholder="Add a short description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                style={{
                                    padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB',
                                    fontSize: 14, fontWeight: 500, color: '#111827', outline: 'none',
                                    background: '#FAFAFA', resize: 'vertical', fontFamily: 'inherit',
                                }}
                            />
                        </div>

                        {/* Show Results / Leaderboard toggles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                            {[
                                { label: 'Show Results', value: showResults, toggle: () => setShowResults(!showResults) },
                                { label: 'Show Leaderboard', value: showLeaderboard, toggle: () => setShowLeaderboard(!showLeaderboard) },
                            ].map(({ label, value, toggle }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
                                    <div onClick={toggle} style={{
                                        width: 40, height: 22, borderRadius: 11, position: 'relative',
                                        cursor: 'pointer', background: value ? '#FF5C1A' : '#E5E7EB', transition: 'background 0.2s',
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: 3, width: 16, height: 16,
                                            borderRadius: '50%', background: '#fff',
                                            left: value ? 21 : 3, transition: 'left 0.2s',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── CENTER PANEL — Question Editor (task 6.3) ── */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                                Questions <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({questions.length})</span>
                            </div>
                            <button
                                onClick={addQuestion}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    color: '#FF5C1A', fontWeight: 600, fontSize: 13,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                }}
                            >
                                <Plus size={16} /> Add Question
                            </button>
                        </div>

                        {questions.map((question, index) => (
                            <div
                                key={index}
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    border: expandedQuestion === index ? '1.5px solid #FF5C1A' : '1.5px solid #E5E7EB',
                                    padding: '20px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}
                            >
                                {/* Question header */}
                                <div
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, cursor: 'pointer' }}
                                    onClick={() => setExpandedQuestion(expandedQuestion === index ? -1 : index)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: expandedQuestion === index ? '#FF5C1A' : '#111827',
                                            color: '#fff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: 12, fontWeight: 700,
                                        }}>
                                            {index + 1}
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            Question {index + 1}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {/* TYPE dropdown */}
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value="multiple_choice"
                                                onChange={() => { }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '4px 24px 4px 8px', borderRadius: 6,
                                                    border: '1px solid #E5E7EB', fontSize: 11, fontWeight: 600,
                                                    color: '#374151', background: '#F9FAFB', appearance: 'none', cursor: 'pointer',
                                                }}
                                            >
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="true_false">True / False</option>
                                                <option value="short_answer">Short Answer</option>
                                            </select>
                                            <ChevronDown size={10} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF' }}>
                                            <Clock size={12} /> {timerSeconds}s
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF' }}>
                                            <Target size={12} /> 10 pts
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                                            style={{
                                                width: 28, height: 28, borderRadius: 6, border: 'none',
                                                background: 'none', cursor: 'pointer', color: '#D1D5DB',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Question text */}
                                <textarea
                                    placeholder="Write your question here..."
                                    value={question.questionText}
                                    onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                    rows={2}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8,
                                        border: '1.5px solid #E5E7EB', fontSize: 14, fontWeight: 500,
                                        color: '#111827', outline: 'none', background: '#FAFAFA',
                                        resize: 'vertical', fontFamily: 'inherit', marginBottom: 14,
                                        boxSizing: 'border-box',
                                    }}
                                />

                                {/* Answer options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {optionLetters.map((letter) => {
                                        const isCorrect = question.correctAnswer === letter;
                                        const bgColors: Record<string, string> = { A: '#FEE2E2', B: '#DBEAFE', C: '#FEF9C3', D: '#D1FAE5' };
                                        const textColors: Record<string, string> = { A: '#DC2626', B: '#2563EB', C: '#D97706', D: '#059669' };
                                        return (
                                            <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {/* Letter badge / correct toggle */}
                                                <button
                                                    onClick={() => updateQuestion(index, 'correctAnswer', letter)}
                                                    title="Mark as correct answer"
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 8, border: 'none',
                                                        background: isCorrect ? '#FF5C1A' : bgColors[letter],
                                                        color: isCorrect ? '#fff' : textColors[letter],
                                                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {isCorrect ? <CheckCircle size={16} /> : letter}
                                                </button>
                                                <input
                                                    type="text"
                                                    placeholder={`Option ${letter}`}
                                                    value={question[`option${letter}` as keyof QuestionForm] as string}
                                                    onChange={(e) => updateQuestion(index, `option${letter}` as keyof QuestionForm, e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '8px 12px', borderRadius: 8,
                                                        border: isCorrect ? '1.5px solid #FF5C1A' : '1.5px solid #E5E7EB',
                                                        fontSize: 13, fontWeight: 500, color: '#111827',
                                                        outline: 'none', background: isCorrect ? '#FFF3EE' : '#FAFAFA',
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* + Add another option link */}
                                <button
                                    style={{
                                        marginTop: 10, background: 'none', border: 'none',
                                        color: '#FF5C1A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                    onClick={() => {/* options are fixed A-D for now */ }}
                                >
                                    <Plus size={12} /> Add another option
                                </button>
                            </div>
                        ))}

                        {/* + Add Question dashed button */}
                        <button
                            onClick={addQuestion}
                            style={{
                                width: '100%', padding: '20px', border: '2px dashed #E5E7EB',
                                borderRadius: 14, background: 'none', cursor: 'pointer',
                                color: '#9CA3AF', fontWeight: 600, fontSize: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'border-color 0.2s, color 0.2s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF5C1A'; (e.currentTarget as HTMLButtonElement).style.color = '#FF5C1A'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
                        >
                            <Plus size={20} /> Add Question
                        </button>
                    </div>

                    {/* ── RIGHT PANEL — Live Preview (task 6.4) ── */}
                    <div style={{
                        width: 300,
                        minWidth: 300,
                        background: '#fff',
                        borderLeft: '1px solid #E5E7EB',
                        padding: '24px 18px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                            Live Preview
                        </div>

                        {/* Quiz title display */}
                        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #F3F4F6' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                Quiz Title
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', wordBreak: 'break-word' }}>
                                {title || <span style={{ color: '#D1D5DB' }}>Untitled Quiz</span>}
                            </div>
                            {description && (
                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {description}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> {timerEnabled ? `${timerSeconds}s` : 'No timer'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <BookOpen size={12} /> {questions.length} Q
                                </span>
                            </div>
                        </div>

                        {/* Question preview (first question, read-only) */}
                        {questions[0] && (
                            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #F3F4F6' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    Question Preview
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10, minHeight: 36 }}>
                                    {questions[expandedQuestion >= 0 && expandedQuestion < questions.length ? expandedQuestion : 0].questionText || <span style={{ color: '#D1D5DB' }}>Write your question...</span>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {optionLetters.map((letter) => {
                                        const q = questions[expandedQuestion >= 0 && expandedQuestion < questions.length ? expandedQuestion : 0];
                                        const text = q[`option${letter}` as keyof QuestionForm] as string;
                                        const isCorrect = q.correctAnswer === letter;
                                        return (
                                            <div key={letter} style={{
                                                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                                                background: isCorrect ? '#FFF3EE' : '#fff',
                                                border: isCorrect ? '1px solid #FF5C1A' : '1px solid #E5E7EB',
                                                color: isCorrect ? '#FF5C1A' : '#374151',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                <span style={{ fontWeight: 700, fontSize: 11 }}>{letter}.</span>
                                                {text || <span style={{ color: '#D1D5DB' }}>Option {letter}</span>}
                                                {isCorrect && <CheckCircle size={12} style={{ marginLeft: 'auto', color: '#FF5C1A' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quiz Strength indicator */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Quiz Strength</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: strengthColor }}>{quizStrength}%</span>
                            </div>
                            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 4,
                                    width: `${quizStrength}%`,
                                    background: strengthColor,
                                    transition: 'width 0.4s ease, background 0.4s ease',
                                }} />
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                                {quizStrength < 40 ? 'Add more questions and options' : quizStrength < 70 ? 'Looking good — fill in all options' : 'Great quiz!'}
                            </div>
                        </div>

                        {/* Full Preview button */}
                        <button
                            style={{
                                width: '100%', padding: '10px', borderRadius: 8,
                                border: '1.5px solid #E5E7EB', background: '#fff',
                                color: '#374151', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            <Eye size={14} /> Full Preview
                        </button>

                        {/* Quick Tip card */}
                        <div style={{
                            background: '#FFF3EE', borderRadius: 10, padding: '14px',
                            border: '1px solid #FFD5C2',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Lightbulb size={14} style={{ color: '#FF5C1A' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5C1A' }}>Quick Tip</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5, margin: 0 }}>
                                Add at least 4 questions with all options filled in to maximize your Quiz Strength score and keep students engaged.
                            </p>
                        </div>
                    </div>

                </div>{/* end body */}
            </div>{/* end main column */}
        </div>
    );
}
