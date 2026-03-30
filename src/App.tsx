import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentRoute } from './components/StudentRoute';
import { Navbar } from './components/Navbar';
import { Background3D } from './components/Background3D';

// Lazy load all page components
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const QuizEditor = lazy(() => import('./pages/QuizEditor').then(m => ({ default: m.QuizEditor })));
const QuizResults = lazy(() => import('./pages/QuizResults').then(m => ({ default: m.QuizResults })));
const GameHost = lazy(() => import('./pages/GameHost').then(m => ({ default: m.GameHost })));
const StudentBrowse = lazy(() => import('./pages/StudentBrowse').then(m => ({ default: m.StudentBrowse })));
const StudentQuiz = lazy(() => import('./pages/StudentQuiz').then(m => ({ default: m.StudentQuiz })));
const JoinGame = lazy(() => import('./pages/JoinGame').then(m => ({ default: m.JoinGame })));
const PlayGame = lazy(() => import('./pages/PlayGame').then(m => ({ default: m.PlayGame })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentReports = lazy(() => import('./pages/StudentReports').then(m => ({ default: m.StudentReports })));
const MyQuizzes = lazy(() => import('./pages/MyQuizzes').then(m => ({ default: m.MyQuizzes })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const Billing = lazy(() => import('./pages/Billing').then(m => ({ default: m.Billing })));
const StudentLibrary = lazy(() => import('./pages/StudentLibrary').then(m => ({ default: m.StudentLibrary })));
const NoteDetail = lazy(() => import('./pages/NoteDetail').then(m => ({ default: m.NoteDetail })));
const AdaptiveQuiz = lazy(() => import('./pages/AdaptiveQuiz').then(m => ({ default: m.AdaptiveQuiz })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <p className="text-white text-lg font-medium">Loading...</p>
    </div>
  </div>
);

const MainContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const hideNavbar = isLandingPage
    || location.pathname.startsWith('/teacher')
    || location.pathname.startsWith('/play')
    || location.pathname.startsWith('/student')
    || location.pathname === '/library'
    || location.pathname === '/login'
    || location.pathname === '/signup'
    || location.pathname === '/auth'
    || location.pathname === '/join'
    || location.pathname === '/privacy'
    || location.pathname === '/terms';

  return (
    <>
      {/* Background3D only on landing page — 5 infinite animations on every page is wasteful */}
      {isLandingPage && <Background3D />}
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/student" element={<StudentBrowse />} />
          <Route path="/student/quiz/:id" element={<StudentQuiz />} />
          <Route
            path="/student/dashboard"
            element={<StudentRoute><StudentDashboard /></StudentRoute>}
          />
          <Route
            path="/student/reports"
            element={<StudentRoute><StudentReports /></StudentRoute>}
          />
          <Route
            path="/student/library"
            element={<StudentRoute><StudentLibrary /></StudentRoute>}
          />
          <Route
            path="/student/library/:noteId"
            element={<StudentRoute><NoteDetail /></StudentRoute>}
          />
          <Route
            path="/student/adaptive-quiz"
            element={<StudentRoute><AdaptiveQuiz /></StudentRoute>}
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/play/:sessionId" element={<PlayGame />} />

          {/* Protected Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/quiz/new" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/quiz/:id/edit" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/quiz/:id/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          <Route path="/teacher/quiz/:id/host" element={<ProtectedRoute><GameHost /></ProtectedRoute>} />
          <Route path="/teacher/my-quizzes" element={<ProtectedRoute><MyQuizzes /></ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/teacher/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/teacher/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
