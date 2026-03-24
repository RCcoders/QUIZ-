import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentRoute } from './components/StudentRoute';
import { Navbar } from './components/Navbar';

// Lazy load all page components
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
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
  const hideNavbar = location.pathname === '/' ||
    location.pathname.startsWith('/teacher') ||
    location.pathname.startsWith('/play') ||
    location.pathname === '/library' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/auth' ||
    location.pathname.startsWith('/student/dashboard');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/student" element={<StudentBrowse />} />
          <Route path="/student/quiz/:id" element={<StudentQuiz />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/reports" element={<StudentReports />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/play/:sessionId" element={<PlayGame />} />

          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/quiz/new" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/quiz/edit/:id" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
          <Route path="/teacher/results/:id" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          <Route path="/teacher/host/:id" element={<ProtectedRoute><GameHost /></ProtectedRoute>} />

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
