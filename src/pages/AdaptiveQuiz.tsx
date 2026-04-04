import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Brain, RefreshCw, ArrowLeft, CheckCircle, XCircle, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import { useStudentStats } from '../hooks/useStudentStats';
import { useNotes } from '../hooks/useNotes';
import { StudentNavbar } from '../components/StudentNavbar';
import { apiFetch } from '../utils/api';
import { saveScoreRecord } from '../utils/scoring';
import { evaluateBadges } from '../lib/badgeEngine';
import { db } from '../lib/firebase';
import type { GeneratedQuestion } from '../lib/gemini';
import type { Note } from '../types/student';

type PageState = 'idle' | 'loading' | 'error' | 'quiz' | 'results';

interface QuizAnswer {
  questionIndex: number;
  selected: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export function AdaptiveQuiz() {
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const subjectParam = searchParams.get('subject');

  const { user, userProfile } = useAuth();
  const { records, streak } = useStudentStats(user?._id);
  const { notes } = useNotes();

  const [pageState, setPageState] = useState<PageState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [smartQuizLoading, setSmartQuizLoading] = useState(false);
  const [smartQuizError, setSmartQuizError] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [subject, setSubject] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Quiz progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);

  const generateQuiz = useCallback(async (resolvedSubject: string, resolvedContent: string) => {
    setPageState('loading');
    setErrorMessage('');
    setSmartQuizError('');
    setSmartQuizLoading(true);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);

    try {
      const data = await apiFetch('/api/ai/agent/adaptive/quiz', {
        method: 'POST',
        body: {
          subject: resolvedSubject,
          count: 10
        },
        signal: AbortSignal.timeout(30000),
      });

      const mappedQuestions = data.questions.map((q: any) => ({
        question_text: q.questionText || q.question_text,
        option_a: q.options ? q.options[0] : q.option_a,
        option_b: q.options ? q.options[1] : q.option_b,
        option_c: q.options ? q.options[2] : q.option_c,
        option_d: q.options ? q.options[3] : q.option_d,
        correct_answer: q.correctAnswer || q.correct_answer,
        difficulty: q.difficulty,
        explanation: q.explanation,
      }));

      setQuestions(mappedQuestions);
      setPageState('quiz');
    } catch (err: any) {
      if (err.status === 429) {
        setSmartQuizError("You've reached the AI limit. Try again in a minute.");
        setErrorMessage("You've reached the AI limit. Try again in a minute.");
      } else {
        setSmartQuizError(err.message || 'Failed to generate questions. Please try again.');
        setErrorMessage(err.message || 'Failed to generate questions. Please try again.');
      }
      setPageState('error');
    } finally {
      setSmartQuizLoading(false);
    }
  }, []);

  // Initial load: resolve noteId → subject + content, then set idle state
  useEffect(() => {
    const init = async () => {
      let resolvedSubject = subjectParam ?? '';
      let resolvedContent = '';

      if (noteId) {
        try {
          const noteRef = doc(db, 'notes', noteId);
          const noteSnap = await getDoc(noteRef);
          if (noteSnap.exists()) {
            const noteData = noteSnap.data();
            resolvedSubject = noteData.subject || resolvedSubject;
            resolvedContent = noteData.content || '';
          }
        } catch {
          // fall through with empty content
        }
      }

      if (!resolvedSubject) {
        resolvedSubject = 'General';
      }

      setSubject(resolvedSubject);
      setNoteContent(resolvedContent);
      setPageState('idle');
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, subjectParam]);

  const handleRetry = () => {
    generateQuiz(subject, noteContent);
  };

  const selectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;
    const q = questions[currentIndex];
    const isCorrect = selectedAnswer === q.correct_answer;
    setAnswers((prev) => [...prev, { questionIndex: currentIndex, selected: selectedAnswer, isCorrect }]);
    setShowResult(true);
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Complete — save score (answers already includes the last answer from submitAnswer)
      const finalAnswers = answers;
      const total = questions.length;
      const finalScore = finalAnswers.filter((a) => a.isCorrect).length;
      const percentage = Math.round((finalScore / total) * 100);

      if (user) {
        try {
          await saveScoreRecord({
            quizId: `adaptive-${subject}-${Date.now()}`,
            quizTitle: `Adaptive Quiz: ${subject}`,
            score: finalScore,
            total,
            percentage,
            completedAt: new Date().toISOString(),
            subject,
          });
          await evaluateBadges(user._id, records, streak);
        } catch (err) {
          console.error('Failed to save score or evaluate badges:', err);
        }
      }

      setPageState('results');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  // ── Results helpers ──────────────────────────────────────────────────────────

  const totalScore = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // Top 2 incorrect topics (question text of wrong answers)
  const incorrectTopics = answers
    .filter((a) => !a.isCorrect)
    .map((a) => questions[a.questionIndex]?.question_text ?? '')
    .filter(Boolean);

  const top2Topics = incorrectTopics.slice(0, 2);

  // Find matching note for a topic (by subject match)
  const findNoteForTopic = (_topic: string): Note | undefined => {
    const publishedNotes = notes.filter((n) => n.published);
    return publishedNotes.find(
      (n) => n.subject.toLowerCase() === subject.toLowerCase()
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    border: '1px solid #F1F5F9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <Helmet>
        <title>Adaptive Quiz — Quizly</title>
        <meta name="description" content="AI-powered adaptive quiz tailored to your performance." />
      </Helmet>
      <StudentNavbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        {/* Breadcrumb */}
        <Link
          to="/student/library"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#6B7280', textDecoration: 'none', fontSize: 14,
            fontWeight: 500, marginBottom: 28,
          }}
        >
          <ArrowLeft size={15} />
          Back to Library
        </Link>

        {/* ── Idle — Practice Smart Quiz button ── */}
        {pageState === 'idle' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 32px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Brain size={28} color="#6366F1" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              Ready to practice?
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
              Get a personalised quiz based on your performance history{subject ? ` for ${subject}` : ''}.
            </p>
            <button
              onClick={() => generateQuiz(subject, noteContent)}
              disabled={smartQuizLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: smartQuizLoading ? '#E2E8F0' : 'linear-gradient(135deg, #6366F1, #818CF8)',
                color: smartQuizLoading ? '#94A3B8' : 'white',
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: smartQuizLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {smartQuizLoading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid #CBD5E1', borderTopColor: '#6366F1',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Generating…
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Practice Smart Quiz
                </>
              )}
            </button>
            {smartQuizError && (
              <p style={{ fontSize: 13, color: '#EF4444', margin: '16px 0 0', fontWeight: 500 }}>
                {smartQuizError}
              </p>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Loading ── */}
        {pageState === 'loading' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 32px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '4px solid #F1F5F9', borderTopColor: '#FF5C1A',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
            }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              Generating your adaptive quiz…
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              Analysing your performance and crafting personalised questions.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Error ── */}
        {pageState === 'error' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 32px' }}>
            <XCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
              {errorMessage}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleRetry}
                disabled={smartQuizLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                  background: smartQuizLoading ? '#E2E8F0' : 'linear-gradient(135deg, #FF5C1A, #FF8C42)',
                  color: smartQuizLoading ? '#94A3B8' : 'white',
                  border: 'none', fontSize: 14,
                  fontWeight: 700, cursor: smartQuizLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {smartQuizLoading ? (
                  <>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid #CBD5E1', borderTopColor: '#FF5C1A',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Try Again
                  </>
                )}
              </button>
              <Link
                to="/student"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                  background: '#F3F4F6', color: '#374151',
                  textDecoration: 'none', fontSize: 14, fontWeight: 600,
                }}
              >
                Browse Standard Quizzes
              </Link>
            </div>
            {smartQuizError && (
              <p style={{ fontSize: 13, color: '#EF4444', margin: '16px 0 0', fontWeight: 500 }}>
                {smartQuizError}
              </p>
            )}
          </div>
        )}

        {/* ── Quiz in progress ── */}
        {pageState === 'quiz' && questions.length > 0 && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid #F1F5F9',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04)',
            marginBottom: '2.5rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Brain size={20} color="#6366F1" />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI-Powered Adaptive Quiz
                </span>
                <h4 style={{ margin: 0, fontSize: 16, color: '#1E293B' }}>{subject}</h4>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 10, marginBottom: 32 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                style={{
                  height: '100%', borderRadius: 10,
                  background: 'var(--gradient-primary)',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>

            {/* Difficulty & Question */}
            <div style={{ marginBottom: 32 }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 8,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 16,
                background: questions[currentIndex].difficulty === 'easy' ? '#DCFCE7' :
                  questions[currentIndex].difficulty === 'medium' ? '#FEF9C3' : '#FEE2E2',
                color: questions[currentIndex].difficulty === 'easy' ? '#16A34A' :
                  questions[currentIndex].difficulty === 'medium' ? '#CA8A04' : '#DC2626',
              }}>
                {questions[currentIndex].difficulty} Level
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.4, margin: 0 }}>
                {questions[currentIndex].question_text}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-2 gap-md" style={{ marginBottom: 32 }}>
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const optionKey = `option_${letter.toLowerCase()}` as keyof GeneratedQuestion;
                const optionText = questions[currentIndex][optionKey] as string;
                const isSelected = selectedAnswer === letter;
                const isCorrect = questions[currentIndex].correct_answer === letter;
                const showCorrectness = showResult;

                return (
                  <motion.button
                    key={letter}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => selectAnswer(letter)}
                    disabled={showResult}
                    className={`answer-btn answer-${letter.toLowerCase()} ${isSelected ? 'selected' : ''} ${showCorrectness && isCorrect ? 'correct' : ''
                      } ${showCorrectness && isSelected && !isCorrect ? 'incorrect' : ''}`}
                    style={{
                      opacity: showCorrectness && !isCorrect && !isSelected ? 0.4 : 1,
                      pointerEvents: showResult ? 'none' : 'auto',
                      minHeight: '70px',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      boxShadow: isSelected ? '0 0 0 3px rgba(99, 102, 241, 0.4)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px',
                      background: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', fontWeight: 800, marginRight: '1rem', flexShrink: 0
                    }}>
                      {letter}
                    </div>
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>
                      {optionText}
                    </span>
                    {showCorrectness && isCorrect && <CheckCircle size={20} />}
                    {showCorrectness && isSelected && !isCorrect && <XCircle size={20} />}
                  </motion.button>
                );
              })}
            </div>

            {/* Submit / Next */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer}
                  className="btn btn-primary btn-lg"
                  style={{
                    minWidth: '220px',
                    background: selectedAnswer ? 'var(--gradient-primary)' : '#E2E8F0',
                    boxShadow: selectedAnswer ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={nextQuestion}
                  className="btn btn-primary btn-lg"
                  style={{ minWidth: '220px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {currentIndex + 1 >= questions.length ? (
                      <><Trophy size={18} /> Finish Quiz</>
                    ) : (
                      <>Next Question <ArrowRight size={18} /></>
                    )}
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        )}


        {/* ── Results ── */}
        {pageState === 'results' && (
          <ResultsSummary
            questions={questions}
            answers={answers}
            totalScore={totalScore}
            totalQuestions={totalQuestions}
            percentage={percentage}
            subject={subject}
            top2Topics={top2Topics}
            findNoteForTopic={findNoteForTopic}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}

// ── ResultsSummary sub-component ─────────────────────────────────────────────

interface ResultsSummaryProps {
  questions: GeneratedQuestion[];
  answers: QuizAnswer[];
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  subject: string;
  top2Topics: string[];
  findNoteForTopic: (topic: string) => Note | undefined;
  onRetry: () => void;
}

function ResultsSummary({
  questions,
  answers,
  totalScore,
  totalQuestions,
  percentage,
  subject,
  top2Topics,
  findNoteForTopic,
  onRetry,
}: ResultsSummaryProps) {
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    border: '1px solid #F1F5F9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: 20,
  };

  const scoreColor = percentage >= 80 ? '#16A34A' : percentage >= 60 ? '#CA8A04' : '#DC2626';

  return (
    <>
      {/* Score card */}
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <Brain size={22} color="#6366F1" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#6366F1' }}>
            Adaptive Quiz Complete — {subject}
          </span>
        </div>

        <div style={{
          fontSize: 64, fontWeight: 900, color: scoreColor,
          lineHeight: 1, marginBottom: 8,
        }}>
          {percentage}%
        </div>
        <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 4px' }}>
          {totalScore} / {totalQuestions} correct
        </p>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>
          {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good effort!' : 'Keep going!'}
        </p>
      </div>

      {/* Motivational message + Retry for < 60% */}
      {percentage < 60 && (
        <div style={{
          ...cardStyle,
          background: '#FFF7ED',
          border: '1px solid #FED7AA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>
              Keep going! Practice makes perfect.
            </p>
            <p style={{ fontSize: 13, color: '#B45309', margin: 0 }}>
              Try again to strengthen your understanding of {subject}.
            </p>
          </div>
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #FF5C1A, #FF8C42)',
              color: 'white', border: 'none', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* Study topics */}
      {top2Topics.length > 0 && (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 14px' }}>
            Topics to review:
          </p>
          {top2Topics.map((topic, i) => {
            const matchingNote = findNoteForTopic(topic);
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 12, padding: '10px 14px', borderRadius: 10,
                  background: '#F9FAFB', border: '1px solid #E5E7EB',
                  marginBottom: 10, flexWrap: 'wrap',
                }}
              >
                <p style={{ fontSize: 13, color: '#374151', margin: 0, flex: 1 }}>
                  {topic}
                </p>
                {matchingNote && (
                  <Link
                    to={`/student/library/${matchingNote.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, color: '#6366F1',
                      textDecoration: 'none', flexShrink: 0,
                    }}
                  >
                    <BookOpen size={13} />
                    Study this topic
                  </Link>
                )}
                {!matchingNote && (
                  <Link
                    to={`/student/library?subject=${encodeURIComponent(subject)}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, color: '#6366F1',
                      textDecoration: 'none', flexShrink: 0,
                    }}
                  >
                    <BookOpen size={13} />
                    Study this topic
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Per-question breakdown */}
      <div style={cardStyle}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>
          Question breakdown
        </p>
        {questions.map((q, i) => {
          const answer = answers[i];
          const isCorrect = answer?.isCorrect ?? false;
          const selectedKey = answer
            ? (`option_${answer.selected.toLowerCase()}` as keyof GeneratedQuestion)
            : null;
          const correctKey = `option_${q.correct_answer.toLowerCase()}` as keyof GeneratedQuestion;

          return (
            <div
              key={i}
              style={{
                padding: '14px 16px', borderRadius: 12,
                border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECACA'}`,
                background: isCorrect ? '#F0FDF4' : '#FFF5F5',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {isCorrect
                  ? <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <XCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
                    Q{i + 1}: {q.question_text}
                  </p>
                  {!isCorrect && answer && (
                    <>
                      <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 2px' }}>
                        Your answer: {answer.selected}. {selectedKey ? String(q[selectedKey]) : ''}
                      </p>
                      <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>
                        Correct answer: {q.correct_answer}. {String(q[correctKey])}
                      </p>
                    </>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 8,
                  background: q.difficulty === 'easy' ? '#DCFCE7' :
                    q.difficulty === 'medium' ? '#FEF9C3' : '#FEE2E2',
                  color: q.difficulty === 'easy' ? '#16A34A' :
                    q.difficulty === 'medium' ? '#CA8A04' : '#DC2626',
                  flexShrink: 0,
                }}>
                  {q.difficulty}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/student/library"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: '#F3F4F6', color: '#374151',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}
        >
          <ArrowLeft size={15} />
          Back to Library
        </Link>
        <Link
          to="/student/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </>
  );
}
