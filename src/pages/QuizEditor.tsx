import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Plus, Trash2, ChevronDown, ChevronUp, Sparkles,
    CheckCircle, Upload, Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    getQuiz,
    getQuestions,
    createQuiz,
    updateQuiz,
    saveQuestions,
    createProfile,
    type Question
} from '../lib/database';
import { generateQuestionsFromText, GeneratedQuestion } from '../lib/gemini';

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

export function QuizEditor() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [timerSeconds, setTimerSeconds] = useState(30);
    const [showResults, setShowResults] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
    const [expandedQuestion, setExpandedQuestion] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // AI Generator state
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [syllabusText, setSyllabusText] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

    useEffect(() => {
        if (isEditing) {
            fetchQuiz();
        }
    }, [id]);

    const fetchQuiz = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const quiz = await getQuiz(id);
            if (!quiz) {
                setError('Quiz not found');
                return;
            }

            const questionsData = await getQuestions(id);

            setTitle(quiz.title);
            setDescription(quiz.description || '');
            setTimerEnabled(quiz.timerEnabled);
            setTimerSeconds(quiz.timerSeconds);
            setShowResults(quiz.showResults);
            setShowLeaderboard(quiz.showLeaderboard);

            if (questionsData && questionsData.length > 0) {
                setQuestions(questionsData.map(q => ({
                    id: q.id,
                    questionText: q.questionText,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correctAnswer: q.correctAnswer,
                    difficulty: q.difficulty,
                })));
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            setError('Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Please enter a quiz title');
            return;
        }

        if (questions.length === 0 || !questions[0].questionText.trim()) {
            setError('Please add at least one question');
            return;
        }

        // Validate all questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim() || !q.optionA.trim() || !q.optionB.trim() ||
                !q.optionC.trim() || !q.optionD.trim()) {
                setError(`Question ${i + 1} is incomplete`);
                setExpandedQuestion(i);
                return;
            }
        }

        setSaving(true);
        setError('');

        try {
            let quizId = id;

            if (isEditing && id) {
                // Update existing quiz
                await updateQuiz(id, {
                    title,
                    description,
                    timerEnabled,
                    timerSeconds,
                    showResults,
                    showLeaderboard,
                });
            } else {
                // Ensure profile exists before creating quiz (handles users created before schema fix)
                await createProfile(user!.uid, user!.email || '', null);

                // Create new quiz
                quizId = await createQuiz({
                    teacherId: user!.uid,
                    title,
                    description,
                    isActive: false,
                    timerEnabled,
                    timerSeconds,
                    showResults,
                    showLeaderboard,
                });
            }

            // Save questions
            await saveQuestions(quizId!, questions.map(q => ({
                questionText: q.questionText,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctAnswer: q.correctAnswer,
                difficulty: q.difficulty,
                orderIndex: 0, // Will be set by saveQuestions
            })));

            navigate('/teacher');
        } catch (error) {
            console.error('Error saving quiz:', error);
            setError('Failed to save quiz');
        } finally {
            setSaving(false);
        }
    };

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSyllabusText(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const generateQuestions = async () => {
        if (!syllabusText.trim()) {
            setError('Please enter or upload syllabus content');
            return;
        }

        setGeneratingAI(true);
        setError('');

        try {
            const generated = await generateQuestionsFromText(syllabusText, 10);
            setGeneratedQuestions(generated);
        } catch (error) {
            console.error('Error generating questions:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate questions');
        } finally {
            setGeneratingAI(false);
        }
    };

    const addGeneratedQuestions = () => {
        const newQuestions: QuestionForm[] = generatedQuestions.map(q => ({
            questionText: q.question_text,
            optionA: q.option_a,
            optionB: q.option_b,
            optionC: q.option_c,
            optionD: q.option_d,
            correctAnswer: q.correct_answer,
            difficulty: q.difficulty,
        }));

        // Replace empty first question or append
        if (questions.length === 1 && !questions[0].questionText.trim()) {
            setQuestions(newQuestions);
        } else {
            setQuestions([...questions, ...newQuestions]);
        }

        setGeneratedQuestions([]);
        setShowAIGenerator(false);
        setSyllabusText('');
    };

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container container-lg">
                <div className="page-header flex justify-between items-center">
                    <div>
                        <h1 className="page-title">{isEditing ? 'Edit Quiz' : 'Create Quiz'}</h1>
                        <p className="page-subtitle">Build engaging quizzes for your students</p>
                    </div>
                    <div className="flex gap-md">
                        <button
                            onClick={() => setShowAIGenerator(!showAIGenerator)}
                            className="btn btn-secondary"
                        >
                            <Sparkles size={18} />
                            AI Generate
                        </button>
                        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                            {saving ? (
                                <div className="loading-spinner" style={{ width: '18px', height: '18px' }} />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Quiz
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid var(--accent-error)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md)',
                            marginBottom: 'var(--space-lg)',
                            color: 'var(--accent-error)'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* AI Generator Panel */}
                <AnimatePresence>
                    {showAIGenerator && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card mb-xl"
                            style={{ overflow: 'hidden' }}
                        >
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} />
                                AI Question Generator
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Paste your syllabus, notes, or educational content below. AI will generate 10 quiz questions sorted by difficulty.
                            </p>

                            <div className="form-group">
                                <div className="flex gap-md mb-md">
                                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                        <Upload size={16} />
                                        Upload .txt
                                        <input
                                            type="file"
                                            accept=".txt"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                                        or paste content below
                                    </span>
                                </div>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Paste your syllabus, textbook content, or notes here..."
                                    value={syllabusText}
                                    onChange={(e) => setSyllabusText(e.target.value)}
                                    style={{ minHeight: '200px' }}
                                />
                            </div>

                            <div className="flex gap-md">
                                <button
                                    onClick={generateQuestions}
                                    disabled={generatingAI || !syllabusText.trim()}
                                    className="btn btn-primary"
                                >
                                    {generatingAI ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Generate Questions
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowAIGenerator(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Generated Questions Preview */}
                            {generatedQuestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ marginTop: '1.5rem' }}
                                >
                                    <div className="flex justify-between items-center mb-md">
                                        <h4>Generated Questions ({generatedQuestions.length})</h4>
                                        <button onClick={addGeneratedQuestions} className="btn btn-primary btn-sm">
                                            <CheckCircle size={16} />
                                            Add All to Quiz
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {generatedQuestions.map((q, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: '0.75rem',
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: '0.5rem'
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span style={{ fontWeight: '500' }}>{i + 1}. {q.question_text}</span>
                                                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-active' :
                                                        q.difficulty === 'hard' ? 'badge-inactive' : ''
                                                        }`} style={{
                                                            background: q.difficulty === 'medium' ? 'rgba(255, 170, 0, 0.15)' : undefined,
                                                            color: q.difficulty === 'medium' ? 'var(--accent-warning)' : undefined
                                                        }}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                    Answer: {q.correct_answer}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quiz Settings */}
                <div className="card mb-xl">
                    <h3 style={{ marginBottom: '1rem' }}>Quiz Settings</h3>

                    <div className="form-group">
                        <label className="form-label">Quiz Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Chapter 5 Review"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Brief description of the quiz..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <div className="grid grid-3">
                        <div className="form-group">
                            <label className="form-label flex items-center gap-sm">
                                <input
                                    type="checkbox"
                                    checked={timerEnabled}
                                    onChange={(e) => setTimerEnabled(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Timer Enabled
                            </label>
                            {timerEnabled && (
                                <input
                                    type="number"
                                    className="form-input mt-sm"
                                    min={5}
                                    max={120}
                                    value={timerSeconds}
                                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                                    placeholder="Seconds per question"
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label flex items-center gap-sm">
                                <input
                                    type="checkbox"
                                    checked={showResults}
                                    onChange={(e) => setShowResults(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Show Detailed Results
                            </label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Students see correct answers after quiz
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label flex items-center gap-sm">
                                <input
                                    type="checkbox"
                                    checked={showLeaderboard}
                                    onChange={(e) => setShowLeaderboard(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Show Leaderboard
                            </label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Display rankings in live games
                            </p>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="mb-xl">
                    <div className="flex justify-between items-center mb-lg">
                        <h3>Questions ({questions.length})</h3>
                        <button onClick={addQuestion} className="btn btn-secondary btn-sm">
                            <Plus size={16} />
                            Add Question
                        </button>
                    </div>

                    {questions.map((question, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card mb-md"
                            style={{ padding: 0, overflow: 'hidden' }}
                        >
                            {/* Question Header */}
                            <div
                                onClick={() => setExpandedQuestion(expandedQuestion === index ? -1 : index)}
                                style={{
                                    padding: 'var(--space-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: expandedQuestion === index ? 'var(--bg-elevated)' : 'transparent'
                                }}
                            >
                                <div className="flex items-center gap-md">
                                    <span style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--gradient-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '700'
                                    }}>
                                        {index + 1}
                                    </span>
                                    <span style={{ fontWeight: '500' }}>
                                        {question.questionText || 'New Question'}
                                    </span>
                                    {question.questionText && (
                                        <span className="badge" style={{
                                            background: question.difficulty === 'easy' ? 'rgba(0, 255, 136, 0.15)' :
                                                question.difficulty === 'hard' ? 'rgba(255, 68, 68, 0.15)' :
                                                    'rgba(255, 170, 0, 0.15)',
                                            color: question.difficulty === 'easy' ? 'var(--accent-success)' :
                                                question.difficulty === 'hard' ? 'var(--accent-error)' :
                                                    'var(--accent-warning)'
                                        }}>
                                            {question.difficulty}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-sm">
                                    {questions.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeQuestion(index);
                                            }}
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    {expandedQuestion === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Question Form */}
                            <AnimatePresence>
                                {expandedQuestion === index && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 var(--space-lg) var(--space-lg)' }}>
                                            <div className="form-group">
                                                <label className="form-label">Question Text *</label>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Enter your question..."
                                                    value={question.questionText}
                                                    onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                                    style={{ minHeight: '80px' }}
                                                />
                                            </div>

                                            <div className="grid grid-2">
                                                {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                                                    <div key={letter} className="form-group">
                                                        <label className="form-label flex items-center gap-sm">
                                                            <span style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '700',
                                                                background: letter === 'A' ? 'var(--answer-red)' :
                                                                    letter === 'B' ? 'var(--answer-blue)' :
                                                                        letter === 'C' ? 'var(--answer-yellow)' :
                                                                            'var(--answer-green)'
                                                            }}>
                                                                {letter}
                                                            </span>
                                                            Option {letter} *
                                                            {question.correctAnswer === letter && (
                                                                <CheckCircle size={16} color="var(--accent-success)" />
                                                            )}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder={`Option ${letter}`}
                                                            value={question[`option${letter}` as keyof QuestionForm] as string}
                                                            onChange={(e) => updateQuestion(index, `option${letter}` as keyof QuestionForm, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-2 mt-md">
                                                <div className="form-group">
                                                    <label className="form-label">Correct Answer</label>
                                                    <select
                                                        className="form-select"
                                                        value={question.correctAnswer}
                                                        onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                                    >
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Difficulty</label>
                                                    <select
                                                        className="form-select"
                                                        value={question.difficulty}
                                                        onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                                                    >
                                                        <option value="easy">Easy</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="hard">Hard</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
