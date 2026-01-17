import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw, Camera, Mic, Maximize } from 'lucide-react';
import { StreakCounter } from '../components/StreakCounter';
import {
    getQuiz,
    getQuestions,
    createResponse,
    updateResponse,
    type Quiz,
    type Question
} from '../lib/database';

interface QuizAnswer {
    questionId: string;
    answer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timeTakenMs: number;
}

export function StudentQuiz() {
    const { id } = useParams();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Student info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [started, setStarted] = useState(false);

    // Quiz progress
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [currentStreak, setCurrentStreak] = useState(0);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);

    // Anti-cheat permissions
    const [fullscreenGranted, setFullscreenGranted] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        if (!quiz?.timerEnabled || !started || showResult || completed) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up - auto submit with no answer
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz?.timerEnabled, started, showResult, currentIndex, completed]);

    const handleTimeUp = useCallback(() => {
        if (selectedAnswer) {
            submitAnswer(selectedAnswer);
        } else {
            // Mark as wrong if no answer
            const currentQuestion = questions[currentIndex];
            const newAnswer: QuizAnswer = {
                questionId: currentQuestion.id,
                answer: 'A', // Default
                isCorrect: false,
                timeTakenMs: quiz?.timerSeconds ? quiz.timerSeconds * 1000 : 0,
            };
            setAnswers([...answers, newAnswer]);
            setShowResult(true);
        }
    }, [selectedAnswer, questions, currentIndex, quiz, answers]);

    const fetchQuiz = async () => {
        if (!id) return;

        // Handle Practice Quizzes
        if (id?.startsWith('practice-')) {
            let title = '';
            let description = '';
            let quizQuestions: any[] = [];

            switch (id) {
                case 'practice-quiz': // Keeping original ID for ML for backward compatibility
                    title = 'Machine Learning Practice Quiz';
                    description = 'Test your knowledge of ML fundamentals with 10 questions.';
                    quizQuestions = [
                        { id: 'p1', quizId: 'practice-quiz', questionText: 'Which type of learning uses labeled data to train a model?', optionA: 'Unsupervised Learning', optionB: 'Reinforcement Learning', optionC: 'Supervised Learning', optionD: 'Semi-supervised Learning', correctAnswer: 'C', difficulty: 'easy', orderIndex: 0, createdAt: '' },
                        { id: 'p2', quizId: 'practice-quiz', questionText: 'Which algorithm is mainly used for classification problems?', optionA: 'Linear Regression', optionB: 'K-Means', optionC: 'Decision Tree', optionD: 'Apriori', correctAnswer: 'C', difficulty: 'easy', orderIndex: 1, createdAt: '' },
                        { id: 'p3', quizId: 'practice-quiz', questionText: 'What does overfitting mean in machine learning?', optionA: 'Model performs well on both training and test data', optionB: 'Model performs poorly on training data', optionC: 'Model memorizes training data and performs poorly on new data', optionD: 'Model has too little data', correctAnswer: 'C', difficulty: 'medium', orderIndex: 2, createdAt: '' },
                        { id: 'p4', quizId: 'practice-quiz', questionText: 'Which evaluation metric is best for imbalanced datasets?', optionA: 'Accuracy', optionB: 'Precision-Recall / F1 Score', optionC: 'Mean Squared Error', optionD: 'R-squared', correctAnswer: 'B', difficulty: 'medium', orderIndex: 3, createdAt: '' },
                        { id: 'p5', quizId: 'practice-quiz', questionText: 'Which algorithm groups similar data points together?', optionA: 'Logistic Regression', optionB: 'K-Means Clustering', optionC: 'Naive Bayes', optionD: 'Random Forest', correctAnswer: 'B', difficulty: 'medium', orderIndex: 4, createdAt: '' },
                        { id: 'p6', quizId: 'practice-quiz', questionText: 'What is the main purpose of a loss function?', optionA: 'To visualize data', optionB: 'To measure model error', optionC: 'To increase accuracy manually', optionD: 'To normalize data', correctAnswer: 'B', difficulty: 'medium', orderIndex: 5, createdAt: '' },
                        { id: 'p7', quizId: 'practice-quiz', questionText: 'Which technique helps reduce overfitting?', optionA: 'Increasing model complexity', optionB: 'Adding more irrelevant features', optionC: 'Regularization', optionD: 'Reducing training data', correctAnswer: 'C', difficulty: 'hard', orderIndex: 6, createdAt: '' },
                        { id: 'p8', quizId: 'practice-quiz', questionText: 'Which activation function is commonly used in binary classification?', optionA: 'ReLU', optionB: 'Sigmoid', optionC: 'Tanh', optionD: 'Softmax', correctAnswer: 'B', difficulty: 'hard', orderIndex: 7, createdAt: '' },
                        { id: 'p9', quizId: 'practice-quiz', questionText: 'What does "feature scaling" do?', optionA: 'Removes missing values', optionB: 'Converts labels to numbers', optionC: 'Brings features to similar range', optionD: 'Reduces dataset size', correctAnswer: 'C', difficulty: 'hard', orderIndex: 8, createdAt: '' },
                        { id: 'p10', quizId: 'practice-quiz', questionText: 'Which algorithm works on Bayes Theorem?', optionA: 'Support Vector Machine', optionB: 'KNN', optionC: 'Naive Bayes', optionD: 'Decision Tree', correctAnswer: 'C', difficulty: 'hard', orderIndex: 9, createdAt: '' }
                    ];
                    break;

                case 'practice-sql':
                    title = 'SQL Fundamentals Quiz';
                    description = 'Test your SQL knowledge with 10 essential questions.';
                    quizQuestions = [
                        { id: 'sql1', quizId: 'practice-sql', questionText: 'Which SQL command is used to remove all rows from a table but keep the structure?', optionA: 'DROP', optionB: 'DELETE', optionC: 'TRUNCATE', optionD: 'REMOVE', correctAnswer: 'C', difficulty: 'medium', orderIndex: 0, createdAt: '' },
                        { id: 'sql2', quizId: 'practice-sql', questionText: 'Which clause is used to filter records?', optionA: 'ORDER BY', optionB: 'GROUP BY', optionC: 'WHERE', optionD: 'HAVING', correctAnswer: 'C', difficulty: 'easy', orderIndex: 1, createdAt: '' },
                        { id: 'sql3', quizId: 'practice-sql', questionText: 'Which join returns only matching records from both tables?', optionA: 'LEFT JOIN', optionB: 'RIGHT JOIN', optionC: 'INNER JOIN', optionD: 'FULL JOIN', correctAnswer: 'C', difficulty: 'medium', orderIndex: 2, createdAt: '' },
                        { id: 'sql4', quizId: 'practice-sql', questionText: 'Which constraint ensures a column cannot have NULL values?', optionA: 'UNIQUE', optionB: 'PRIMARY KEY', optionC: 'NOT NULL', optionD: 'CHECK', correctAnswer: 'C', difficulty: 'easy', orderIndex: 3, createdAt: '' },
                        { id: 'sql5', quizId: 'practice-sql', questionText: 'What does GROUP BY do?', optionA: 'Sorts records', optionB: 'Filters records', optionC: 'Aggregates rows with same values', optionD: 'Deletes duplicates', correctAnswer: 'C', difficulty: 'medium', orderIndex: 4, createdAt: '' },
                        { id: 'sql6', quizId: 'practice-sql', questionText: 'Which function returns the total number of rows?', optionA: 'SUM()', optionB: 'COUNT()', optionC: 'AVG()', optionD: 'TOTAL()', correctAnswer: 'B', difficulty: 'easy', orderIndex: 5, createdAt: '' },
                        { id: 'sql7', quizId: 'practice-sql', questionText: 'Which command is used to modify existing records?', optionA: 'UPDATE', optionB: 'INSERT', optionC: 'ALTER', optionD: 'MODIFY', correctAnswer: 'A', difficulty: 'easy', orderIndex: 6, createdAt: '' },
                        { id: 'sql8', quizId: 'practice-sql', questionText: 'Which keyword is used to eliminate duplicate values?', optionA: 'DISTINCT', optionB: 'UNIQUE', optionC: 'DIFFERENT', optionD: 'FILTER', correctAnswer: 'A', difficulty: 'medium', orderIndex: 7, createdAt: '' },
                        { id: 'sql9', quizId: 'practice-sql', questionText: 'Which normal form removes transitive dependency?', optionA: '1NF', optionB: '2NF', optionC: '3NF', optionD: 'BCNF', correctAnswer: 'C', difficulty: 'hard', orderIndex: 8, createdAt: '' },
                        { id: 'sql10', quizId: 'practice-sql', questionText: 'Which index improves SELECT query performance?', optionA: 'Clustered Index', optionB: 'Foreign Key', optionC: 'Trigger', optionD: 'View', correctAnswer: 'A', difficulty: 'hard', orderIndex: 9, createdAt: '' }
                    ];
                    break;

                case 'practice-nn':
                    title = 'Neural Networks Quiz';
                    description = 'Challenge yourself with 10 Neural Network questions.';
                    quizQuestions = [
                        { id: 'nn1', quizId: 'practice-nn', questionText: 'What is a neuron in neural networks?', optionA: 'A dataset', optionB: 'A mathematical function', optionC: 'A storage unit', optionD: 'A database', correctAnswer: 'B', difficulty: 'easy', orderIndex: 0, createdAt: '' },
                        { id: 'nn2', quizId: 'practice-nn', questionText: 'Which component adjusts during training?', optionA: 'Bias', optionB: 'Weights', optionC: 'Learning rate', optionD: 'Epoch', correctAnswer: 'B', difficulty: 'medium', orderIndex: 1, createdAt: '' },
                        { id: 'nn3', quizId: 'practice-nn', questionText: 'What does backpropagation do?', optionA: 'Forward data flow', optionB: 'Error calculation and weight update', optionC: 'Data normalization', optionD: 'Feature extraction', correctAnswer: 'B', difficulty: 'hard', orderIndex: 2, createdAt: '' },
                        { id: 'nn4', quizId: 'practice-nn', questionText: 'Which activation function is commonly used in hidden layers?', optionA: 'Sigmoid', optionB: 'ReLU', optionC: 'Softmax', optionD: 'Linear', correctAnswer: 'B', difficulty: 'medium', orderIndex: 3, createdAt: '' },
                        { id: 'nn5', quizId: 'practice-nn', questionText: 'What is an epoch?', optionA: 'One neuron update', optionB: 'One forward pass', optionC: 'One complete pass through training data', optionD: 'One batch', correctAnswer: 'C', difficulty: 'easy', orderIndex: 4, createdAt: '' },
                        { id: 'nn6', quizId: 'practice-nn', questionText: 'What problem does gradient descent solve?', optionA: 'Memory optimization', optionB: 'Minimizing loss function', optionC: 'Data cleaning', optionD: 'Feature selection', correctAnswer: 'B', difficulty: 'medium', orderIndex: 5, createdAt: '' },
                        { id: 'nn7', quizId: 'practice-nn', questionText: 'Which layer produces final output?', optionA: 'Input layer', optionB: 'Hidden layer', optionC: 'Output layer', optionD: 'Dropout layer', correctAnswer: 'C', difficulty: 'easy', orderIndex: 6, createdAt: '' },
                        { id: 'nn8', quizId: 'practice-nn', questionText: 'What causes vanishing gradient?', optionA: 'Large learning rate', optionB: 'Deep networks with sigmoid/tanh', optionC: 'Too much data', optionD: 'Too many neurons', correctAnswer: 'B', difficulty: 'hard', orderIndex: 7, createdAt: '' },
                        { id: 'nn9', quizId: 'practice-nn', questionText: 'Which technique randomly disables neurons during training?', optionA: 'Batch normalization', optionB: 'Regularization', optionC: 'Dropout', optionD: 'Pooling', correctAnswer: 'C', difficulty: 'medium', orderIndex: 8, createdAt: '' },
                        { id: 'nn10', quizId: 'practice-nn', questionText: 'Softmax activation is mainly used for:', optionA: 'Binary classification', optionB: 'Regression', optionC: 'Multi-class classification', optionD: 'Clustering', correctAnswer: 'C', difficulty: 'medium', orderIndex: 9, createdAt: '' }
                    ];
                    break;

                case 'practice-vcs':
                    title = 'Version Control (Git) Quiz';
                    description = 'Test your Git and Version Control skills.';
                    quizQuestions = [
                        { id: 'vcs1', quizId: 'practice-vcs', questionText: 'What is Git?', optionA: 'Programming language', optionB: 'Database', optionC: 'Version control system', optionD: 'IDE', correctAnswer: 'C', difficulty: 'easy', orderIndex: 0, createdAt: '' },
                        { id: 'vcs2', quizId: 'practice-vcs', questionText: 'Which command creates a new repository?', optionA: 'git clone', optionB: 'git init', optionC: 'git start', optionD: 'git create', correctAnswer: 'B', difficulty: 'easy', orderIndex: 1, createdAt: '' },
                        { id: 'vcs3', quizId: 'practice-vcs', questionText: 'Which command checks repository status?', optionA: 'git log', optionB: 'git diff', optionC: 'git status', optionD: 'git info', correctAnswer: 'C', difficulty: 'easy', orderIndex: 2, createdAt: '' },
                        { id: 'vcs4', quizId: 'practice-vcs', questionText: 'Which command saves changes to local repository?', optionA: 'git push', optionB: 'git commit', optionC: 'git merge', optionD: 'git pull', correctAnswer: 'B', difficulty: 'medium', orderIndex: 3, createdAt: '' },
                        { id: 'vcs5', quizId: 'practice-vcs', questionText: 'Which command uploads local commits to remote repository?', optionA: 'git pull', optionB: 'git clone', optionC: 'git push', optionD: 'git fetch', correctAnswer: 'C', difficulty: 'medium', orderIndex: 4, createdAt: '' },
                        { id: 'vcs6', quizId: 'practice-vcs', questionText: 'Which command downloads changes but doesn’t merge automatically?', optionA: 'git pull', optionB: 'git fetch', optionC: 'git clone', optionD: 'git merge', correctAnswer: 'B', difficulty: 'hard', orderIndex: 5, createdAt: '' },
                        { id: 'vcs7', quizId: 'practice-vcs', questionText: 'Which command creates a new branch?', optionA: 'git checkout', optionB: 'git branch', optionC: 'git merge', optionD: 'git fork', correctAnswer: 'B', difficulty: 'medium', orderIndex: 6, createdAt: '' },
                        { id: 'vcs8', quizId: 'practice-vcs', questionText: 'Which command switches branches?', optionA: 'git move', optionB: 'git branch', optionC: 'git checkout', optionD: 'git switch', correctAnswer: 'C', difficulty: 'medium', orderIndex: 7, createdAt: '' },
                        { id: 'vcs9', quizId: 'practice-vcs', questionText: 'Which command removes a branch safely?', optionA: 'git branch -D', optionB: 'git branch -d', optionC: 'git delete', optionD: 'git remove', correctAnswer: 'B', difficulty: 'hard', orderIndex: 8, createdAt: '' },
                        { id: 'vcs10', quizId: 'practice-vcs', questionText: 'What does git stash do?', optionA: 'Deletes files', optionB: 'Saves unfinished changes temporarily', optionC: 'Uploads code', optionD: 'Merges branches', correctAnswer: 'B', difficulty: 'medium', orderIndex: 9, createdAt: '' }
                    ];
                    break;
            }

            setQuiz({
                id: id,
                teacherId: 'system',
                title: title,
                description: description,
                isActive: true,
                timerEnabled: true,
                timerSeconds: 30,
                showResults: true,
                showLeaderboard: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setQuestions(quizQuestions);
            setLoading(false);
            return;
        }

        try {
            const quizData = await getQuiz(id);
            if (quizData) {
                setQuiz(quizData);
            }

            const questionsData = await getQuestions(id);
            setQuestions(questionsData);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        // Enter fullscreen mode
        try {
            await document.documentElement.requestFullscreen();
            setFullscreenGranted(true);
        } catch (err) {
            console.error('Error entering fullscreen:', err);
            alert('Please allow fullscreen mode to start the quiz.');
            return;
        }

        // Handle Practice Quiz - No DB
        if (id?.startsWith('practice-')) {
            setStarted(true);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
            return;
        }

        try {
            const newResponseId = await createResponse({
                quizId: id,
                studentName: name,
                studentEmail: email,
                score: 0,
                totalQuestions: questions.length,
                answers: [],
                startedAt: new Date().toISOString(),
                completedAt: null,
            });

            setResponseId(newResponseId);
            setStarted(true);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    };



    // Monitor fullscreen and tab switching
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && started && !completed) {
                // Don't count exits for practice quiz
                if (id?.startsWith('practice-')) {
                    alert('Warning: Exiting fullscreen mode during a quiz may be considered cheating!');
                    return;
                }

                setFullscreenExitCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 2) {
                        alert('You have exited fullscreen mode more than 2 times. Your test will now end.');
                        // Force complete the quiz
                        setCompleted(true);
                        // Exit fullscreen
                        if (document.fullscreenElement) {
                            document.exitFullscreen();
                        }
                    } else {
                        alert(`Warning: Exiting fullscreen mode! (${newCount}/2) - One more exit will end your test.`);
                    }
                    return newCount;
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && started) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    alert(`Warning: Tab switching detected! Count: ${newCount}. This may be considered cheating.`);
                    return newCount;
                });
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [started, completed, id]);

    // Cleanup media stream on unmount


    const selectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
        if (showResult) return;
        setSelectedAnswer(answer);
    };

    const submitAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
        const currentQuestion = questions[currentIndex];
        const timeTaken = Date.now() - questionStartTime;
        const isCorrect = answer === currentQuestion.correctAnswer;

        const newAnswer: QuizAnswer = {
            questionId: currentQuestion.id,
            answer,
            isCorrect,
            timeTakenMs: timeTaken,
        };

        setAnswers([...answers, newAnswer]);
        setShowResult(true);
    };

    const nextQuestion = async () => {
        if (currentIndex + 1 >= questions.length) {
            // Complete quiz
            const score = answers.filter(a => a.isCorrect).length + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0);

            if (responseId && !id?.startsWith('practice-')) {
                await updateResponse(responseId, {
                    score,
                    answers: [...answers, {
                        questionId: questions[currentIndex].id,
                        answer: selectedAnswer || 'A',
                        isCorrect: selectedAnswer === questions[currentIndex].correctAnswer,
                        timeTakenMs: Date.now() - questionStartTime,
                    }],
                    completedAt: new Date().toISOString(),
                });
            }

            setCompleted(true);
        } else {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
            setQuestionStartTime(Date.now());
            if (quiz?.timerEnabled) {
                setTimeLeft(quiz.timerSeconds);
            }
        }
    };

    const getScore = () => answers.filter(a => a.isCorrect).length;
    const getPercentage = () => Math.round((getScore() / questions.length) * 100);

    if (loading) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="page">
                <div className="container text-center">
                    <h2>Quiz not found or has no questions</h2>
                    <Link to="/student" className="btn btn-primary mt-lg">
                        Browse Quizzes
                    </Link>
                </div>
            </div>
        );
    }

    // Student Info Form
    if (!started) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ width: '100%', maxWidth: '450px' }}
                >
                    <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>{quiz.title}</h2>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                        {questions.length} questions
                        {quiz.timerEnabled && ` • ${quiz.timerSeconds}s per question`}
                    </p>

                    <form onSubmit={startQuiz}>
                        {/* Permission Status */}
                        <div style={{
                            background: 'var(--bg-elevated)',
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Quiz Requirements</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Maximize size={20} color="var(--text-muted)" />
                                    <span style={{ flex: 1 }}>Fullscreen Mode</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        (Activated on start)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="student@school.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                        >
                            Start Quiz
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // Completed
    if (completed) {
        return (
            <div className="page min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card text-center"
                    style={{ width: '100%', maxWidth: '500px' }}
                >
                    <Trophy size={64} style={{ color: '#ffd700', margin: '0 auto 1rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>Quiz Complete!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Great job, {name}!
                    </p>

                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        {getPercentage()}%
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {getScore()} out of {questions.length} correct
                    </p>

                    {quiz.showResults && (
                        <div className="text-left mb-xl">
                            <h3 className="text-center mb-lg">Review Your Answers</h3>
                            <div className="flex flex-col gap-md">
                                {questions.map((q, i) => {
                                    const userAnswer = answers.find(a => a.questionId === q.id);
                                    const isCorrect = userAnswer?.isCorrect;
                                    const userSelectedOption = userAnswer?.answer;

                                    return (
                                        <div
                                            key={q.id}
                                            className="card p-md"
                                            style={{
                                                borderLeft: `4px solid ${isCorrect ? 'var(--accent-success)' : 'var(--accent-error)'}`,
                                                background: 'var(--bg-elevated)'
                                            }}
                                        >
                                            <div className="flex items-start gap-md">
                                                <div className="mt-1">
                                                    {isCorrect ? (
                                                        <CheckCircle size={20} className="text-success" />
                                                    ) : (
                                                        <XCircle size={20} className="text-error" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold mb-sm">
                                                        {i + 1}. {q.questionText}
                                                    </p>

                                                    <div className="text-sm space-y-xs">
                                                        <div className={`flex items-center gap-xs ${isCorrect ? 'text-success' : 'text-error'}`}>
                                                            <span className="font-medium">Your Answer:</span>
                                                            <span>
                                                                {userSelectedOption ? (
                                                                    <>
                                                                        <span className="font-bold">{userSelectedOption}</span>: {q[`option${userSelectedOption}` as keyof typeof q]}
                                                                    </>
                                                                ) : 'Skipped'}
                                                            </span>
                                                        </div>

                                                        {!isCorrect && (
                                                            <div className="flex items-center gap-xs text-success">
                                                                <span className="font-medium">Correct Answer:</span>
                                                                <span>
                                                                    <span className="font-bold">{q.correctAnswer}</span>: {q[`option${q.correctAnswer}` as keyof typeof q]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-md justify-center">
                        <Link to="/student" className="btn btn-primary">
                            <RotateCcw size={18} />
                            Take Another Quiz
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Quiz in progress
    const currentQuestion = questions[currentIndex];

    return (
        <div className="page">
            <div className="container container-md">
                {/* Progress Bar */}
                <div style={{ marginBottom: '2rem' }}>
                    <div className="flex justify-between items-center mb-sm">
                        <span style={{ color: 'var(--text-muted)' }}>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        {quiz.timerEnabled && (
                            <div className={`timer ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : ''}`}
                                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                {timeLeft}
                            </div>
                        )}
                    </div>
                    <div style={{
                        height: '8px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            style={{
                                height: '100%',
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-full)'
                            }}
                        />
                    </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="card mb-xl">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                {currentQuestion.questionText}
                            </h2>
                        </div>

                        {/* Answer Buttons */}
                        <div className="grid grid-2 gap-md mb-xl">
                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                                const isSelected = selectedAnswer === letter;
                                const isCorrect = currentQuestion.correctAnswer === letter;
                                const showCorrectness = showResult;

                                return (
                                    <button
                                        key={letter}
                                        onClick={() => selectAnswer(letter)}
                                        disabled={showResult}
                                        className={`answer-btn answer-${letter.toLowerCase()} ${isSelected ? 'selected' : ''} ${showCorrectness && isCorrect ? 'correct' : ''
                                            } ${showCorrectness && isSelected && !isCorrect ? 'incorrect' : ''}`}
                                        style={{
                                            opacity: showCorrectness && !isCorrect && !isSelected ? 0.5 : 1,
                                        }}
                                    >
                                        <span style={{
                                            width: '36px',
                                            height: '36px',
                                            background: 'rgba(255,255,255,0.2)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700'
                                        }}>
                                            {letter}
                                        </span>
                                        <span style={{ flex: 1, textAlign: 'left' }}>
                                            {currentQuestion[`option${letter}` as keyof Question]}
                                        </span>
                                        {showCorrectness && isCorrect && <CheckCircle size={24} />}
                                        {showCorrectness && isSelected && !isCorrect && <XCircle size={24} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit / Next Button */}
                        <div className="text-center">
                            {!showResult ? (
                                <button
                                    onClick={() => selectedAnswer && submitAnswer(selectedAnswer)}
                                    disabled={!selectedAnswer}
                                    className="btn btn-primary btn-lg"
                                >
                                    Submit Answer
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        background: selectedAnswer === currentQuestion.correctAnswer
                                            ? 'rgba(0, 255, 136, 0.1)'
                                            : 'rgba(255, 68, 68, 0.1)'
                                    }}>
                                        {selectedAnswer === currentQuestion.correctAnswer ? (
                                            <span style={{ color: 'var(--accent-success)', fontWeight: '600' }}>
                                                ✓ Correct!
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--accent-error)', fontWeight: '600' }}>
                                                ✗ Incorrect. The answer was {currentQuestion.correctAnswer}.
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={nextQuestion} className="btn btn-primary btn-lg">
                                        {currentIndex + 1 >= questions.length ? (
                                            <>
                                                <Trophy size={20} />
                                                See Results
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight size={20} />
                                                Next Question
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
