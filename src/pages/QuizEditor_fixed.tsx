import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Save, Plus, Trash2, CheckCircle, Loader, Clock, Target, XCircle,
    BookOpen, Zap, Eye, Lightbulb, ChevronDown
} from 'lucide-react';
import { generateQuestionsFromText, GeneratedQuestion } from '../lib/gemini';
import { TeacherSidebar } from '../components/TeacherSidebar';
import { useAuth } from '../contexts/AuthContext';
import { quizApi } from '../api';

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

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');

    // AI Generator state
    const [syllabusText, setSyllabusText] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

    useEffect(() => {
        if (isEditing && id) {
            const fetchQuiz = async () => {
                try {
                    const { data } = await quizApi.getQuiz(id);
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setSubject(data.subject || '');
                    setTimerEnabled(data.timerEnabled);
                    setTimerSeconds(data.timerSeconds);
                    setQuestions(data.questions);
                } catch (err) {
                    console.error('Error fetching quiz:', err);
                    setError('Failed to load quiz');
                }
            };
            fetchQuiz();
        }
    }, [isEditing, id]);

    // saveDraft — saves to MongoDB
    const saveDraft = async () => {
        if (!title.trim()) { setError('Please enter a quiz title'); return; }
        if (!user) { setError('User not authenticated'); return; }
        setSaving(true);
        setError('');
        try {
            await quizApi.create({
                teacherId: user._id,
                title,
                description,
                subject,
                timerEnabled,
                timerSeconds,
                questions,
            });
            setSaving(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save draft');
            setSaving(false);
        }
    };

    // publishQuiz — saves and redirects
    const publishQuiz = async () => {
        if (!title.trim()) { setError('Please enter a quiz title'); return; }
        if (questions.length === 0 || !questions[0].questionText.trim()) { setError('Please add at least one question'); return; }
        if (!user) { setError('User not authenticated'); return; }

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
            await quizApi.create({
                teacherId: user._id,
                title,
                description,
                subject,
                timerEnabled,
                timerSeconds,
                questions,
            });
            setPublishing(false);
            navigate('/teacher');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to publish quiz');
            setPublishing(false);
        }
    };

    // Keep original handleSave for backward compat
    const handleSave = publishQuiz;
