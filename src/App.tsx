import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Background3D } from './components/Background3D';

// Lazy load all page components for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const QuizEditor = lazy(() => import('./pages/QuizEditor').then(m => ({ default: m.QuizEditor })));
const QuizResults = lazy(() => import('./pages/QuizResults').then(m => ({ default: m.QuizResults })));
const GameHost = lazy(() => import('./pages/GameHost').then(m => ({ default: m.GameHost })));
const StudentBrowse = lazy(() => import('./pages/StudentBrowse').then(m => ({ default: m.StudentBrowse })));
const StudentQuiz = lazy(() => import('./pages/StudentQuiz').then(m => ({ default: m.StudentQuiz })));
const JoinGame = lazy(() => import('./pages/JoinGame').then(m => ({ default: m.JoinGame })));
const PlayGame = lazy(() => import('./pages/PlayGame').then(m => ({ default: m.PlayGame })));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
      <p className="text-white text-lg font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Background3D />
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/student" element={<StudentBrowse />} />
            <Route path="/student/quiz/:id" element={<StudentQuiz />} />
            <Route path="/join" element={<JoinGame />} />
            <Route path="/join/:code" element={<JoinGame />} />
            <Route path="/play/:sessionId" element={<PlayGame />} />

            {/* Protected Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/new"
              element={
                <ProtectedRoute>
                  <QuizEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:id/edit"
              element={
                <ProtectedRoute>
                  <QuizEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:id/results"
              element={
                <ProtectedRoute>
                  <QuizResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:id/host"
              element={
                <ProtectedRoute>
                  <GameHost />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
