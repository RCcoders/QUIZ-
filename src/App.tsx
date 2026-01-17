import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { QuizEditor } from './pages/QuizEditor';
import { QuizResults } from './pages/QuizResults';
import { GameHost } from './pages/GameHost';
import { StudentBrowse } from './pages/StudentBrowse';
import { StudentQuiz } from './pages/StudentQuiz';
import { JoinGame } from './pages/JoinGame';
import { PlayGame } from './pages/PlayGame';
import { Background3D } from './components/Background3D';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Background3D />
        <Navbar />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
