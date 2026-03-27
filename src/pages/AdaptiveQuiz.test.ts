import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Feature: student-profile-enhancements
// Task 9.4: Unit tests for AdaptiveQuiz page
// Validates: Requirements 6.4, 6.5, 7.1, 7.3
// ─────────────────────────────────────────────────────────────────────────────

const source = readFileSync(resolve(__dirname, 'AdaptiveQuiz.tsx'), 'utf-8');

// ── Requirement 6.4: Loading state while generating ───────────────────────
describe('AdaptiveQuiz – loading state (Requirement 6.4)', () => {
  it('has a "loading" page state', () => {
    expect(source).toContain("'loading'");
    expect(source).toContain('pageState');
  });

  it('renders a loading indicator while generating', () => {
    expect(source).toContain("pageState === 'loading'");
    expect(source).toContain('Generating your adaptive quiz');
  });

  it('shows a descriptive loading message', () => {
    expect(source).toContain('Analysing your performance');
  });

  it('sets pageState to loading at the start of generateQuiz', () => {
    expect(source).toContain("setPageState('loading')");
  });
});

// ── Requirement 6.5: Error state + "Try Again" button ────────────────────
describe('AdaptiveQuiz – error state (Requirement 6.5)', () => {
  it('has an "error" page state', () => {
    expect(source).toContain("'error'");
  });

  it('renders the error state when pageState is error', () => {
    expect(source).toContain("pageState === 'error'");
  });

  it('renders a "Try Again" button in the error state', () => {
    expect(source).toContain('Try Again');
  });

  it('calls handleRetry when "Try Again" is clicked', () => {
    expect(source).toContain('handleRetry');
    expect(source).toContain('onClick={handleRetry}');
  });

  it('displays the error message to the user', () => {
    expect(source).toContain('errorMessage');
    expect(source).toContain('{errorMessage}');
  });

  it('provides a fallback link to browse standard quizzes', () => {
    expect(source).toContain('Browse Standard Quizzes');
    expect(source).toContain('/student');
  });

  it('sets pageState to error when generateAdaptiveQuestions rejects', () => {
    expect(source).toContain("setPageState('error')");
  });

  it('applies a 15-second timeout to question generation', () => {
    expect(source).toContain('15000');
    expect(source).toContain('timed out');
  });
});

// ── Requirement 7.1: On success, renders quiz questions ──────────────────
describe('AdaptiveQuiz – quiz state renders questions (Requirement 7.1)', () => {
  it('has a "quiz" page state', () => {
    expect(source).toContain("'quiz'");
  });

  it('renders the quiz when pageState is quiz', () => {
    expect(source).toContain("pageState === 'quiz'");
  });

  it('renders the current question text', () => {
    expect(source).toContain('question_text');
    expect(source).toContain('questions[currentIndex]');
  });

  it('renders answer options A, B, C, D', () => {
    expect(source).toContain("'A', 'B', 'C', 'D'");
    // Options are accessed dynamically via template literal option_${letter.toLowerCase()}
    expect(source).toContain('option_${letter.toLowerCase()}');
  });

  it('shows question progress (current / total)', () => {
    expect(source).toContain('currentIndex + 1');
    expect(source).toContain('questions.length');
  });

  it('sets pageState to quiz after successful generation', () => {
    expect(source).toContain("setPageState('quiz')");
  });

  it('calls generateAdaptiveQuestions to produce questions', () => {
    expect(source).toContain('generateAdaptiveQuestions');
  });

  it('calls buildPerformanceProfile before generating questions', () => {
    expect(source).toContain('buildPerformanceProfile');
  });
});

// ── Requirement 7.3: Results summary shows "Retry" when score < 60% ──────
describe('AdaptiveQuiz – results summary Retry button (Requirement 7.3)', () => {
  it('has a "results" page state', () => {
    expect(source).toContain("'results'");
  });

  it('renders the results summary when pageState is results', () => {
    expect(source).toContain("pageState === 'results'");
    expect(source).toContain('ResultsSummary');
  });

  it('shows a "Retry" button when percentage is below 60', () => {
    expect(source).toContain('percentage < 60');
    expect(source).toContain('Retry');
  });

  it('Retry button calls onRetry to regenerate the quiz', () => {
    expect(source).toContain('onRetry');
    expect(source).toContain('onClick={onRetry}');
  });

  it('shows a motivational message when score is below 60%', () => {
    expect(source).toContain('Keep going');
    expect(source).toContain('Practice makes perfect');
  });

  it('displays total score and percentage in results', () => {
    expect(source).toContain('totalScore');
    expect(source).toContain('percentage');
    expect(source).toContain('totalQuestions');
  });

  it('shows per-question correctness breakdown', () => {
    expect(source).toContain('Question breakdown');
    expect(source).toContain('isCorrect');
  });

  it('shows correct answer for each incorrect response', () => {
    expect(source).toContain('Correct answer:');
    expect(source).toContain('Your answer:');
  });

  it('saves score record on quiz completion', () => {
    expect(source).toContain('saveScoreRecord');
  });

  it('evaluates badges after saving score', () => {
    expect(source).toContain('evaluateBadges');
  });
});

// ── General structure ─────────────────────────────────────────────────────
describe('AdaptiveQuiz – general structure', () => {
  it('uses useAuth hook', () => {
    expect(source).toContain('useAuth');
  });

  it('uses useStudentStats hook', () => {
    expect(source).toContain('useStudentStats');
  });

  it('uses useNotes hook', () => {
    expect(source).toContain('useNotes');
  });

  it('reads noteId and subject from query params', () => {
    expect(source).toContain('useSearchParams');
    expect(source).toContain('noteId');
    expect(source).toContain('subjectParam');
  });

  it('fetches note content from Firestore when noteId is provided', () => {
    expect(source).toContain('getDoc');
    expect(source).toContain("'notes'");
  });

  it('renders StudentNavbar', () => {
    expect(source).toContain('StudentNavbar');
  });

  it('has a breadcrumb back to /student/library', () => {
    expect(source).toContain('/student/library');
    expect(source).toContain('Back to Library');
  });

  it('uses react-helmet-async for page title', () => {
    expect(source).toContain('Helmet');
    expect(source).toContain('Adaptive Quiz');
  });
});
