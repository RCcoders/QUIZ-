// src/pages/AboutPage.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Users, BarChart2, BookOpen } from 'lucide-react';

export function AboutPage() {
  useEffect(() => {
    document.title = 'About Quizly — AI Quiz Platform for Classrooms';
    document.querySelector('meta[name="description"]')
      ?.setAttribute('content', "Quizly is a free AI-powered quiz platform built for teachers and students. Create live classroom games, generate questions with AI, and track every student's progress.");
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
      <header style={{
        background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#6B7280', textDecoration: 'none', fontSize: 14, fontWeight: 500,
        }}>
          <ArrowLeft size={16} />
          Back to Quizly
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
          About Quizly
        </h1>
        <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.8, marginBottom: 48, maxWidth: 600 }}>
          Quizly is a free AI-powered quiz platform designed to make classroom assessment
          engaging, fast, and insightful for teachers and students alike.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 60 }}>
          {[
            { icon: Zap, title: 'AI Generation', desc: 'Turn any text or topic into a full quiz in seconds using Gemini AI.', color: '#FF5C1A', bg: '#FFF3EE' },
            { icon: Users, title: 'Live Games', desc: 'Host real-time classroom games with game codes and QR joining.', color: '#6366F1', bg: '#EEF2FF' },
            { icon: BarChart2, title: 'Analytics', desc: "Track every student's scores, streaks, and progress over time.", color: '#10B981', bg: '#ECFDF5' },
            { icon: BookOpen, title: 'Quiz Library', desc: 'Browse and use quizzes created by teachers across every subject.', color: '#F59E0B', bg: '#FFFBEB' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} style={{
              background: '#FFFFFF', borderRadius: 14, padding: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FF5C1A', color: '#FFFFFF',
            padding: '14px 32px', borderRadius: 10,
            fontWeight: 700, fontSize: 16, textDecoration: 'none',
          }}>
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
}
