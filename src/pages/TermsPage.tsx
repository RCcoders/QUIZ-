// src/pages/TermsPage.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — Quizly';
    window.scrollTo(0, 0);
  }, []);

  const sectionStyle = { marginBottom: 40 };
  const h2Style = { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 };
  const pStyle = { fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 12 };

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
        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Terms of Service</span>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 48 }}>
          Last updated: March 1, 2026
        </p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p style={pStyle}>
            By accessing or using Quizly, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, do not use Quizly.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Use of the Service</h2>
          <p style={pStyle}>
            Quizly is an educational quiz platform for teachers and students. You agree to use
            Quizly only for lawful, educational purposes. You must not use Quizly to distribute
            harmful, abusive, or inappropriate content.
          </p>
          <p style={pStyle}>
            Teachers are responsible for the content of quizzes they create and the conduct
            of game sessions they host.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Accounts</h2>
          <p style={pStyle}>
            You are responsible for maintaining the security of your account credentials.
            You must not share your account with others or allow unauthorized access.
            Notify us immediately at support@quizly.app if you suspect unauthorized use.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Intellectual Property</h2>
          <p style={pStyle}>
            Quiz content you create remains yours. By creating content on Quizly, you grant
            Quizly a limited licence to store and display that content to deliver the service.
            Quizly's platform code, design, and branding are proprietary and may not be copied.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Limitation of Liability</h2>
          <p style={pStyle}>
            Quizly is provided "as is" without warranties of any kind. Quizly is not liable
            for any indirect, incidental, or consequential damages arising from your use of
            the service.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Termination</h2>
          <p style={pStyle}>
            We may suspend or terminate accounts that violate these terms. You may delete
            your account at any time from your account settings.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Contact</h2>
          <p style={pStyle}>
            For questions about these terms, contact{' '}
            <a href="mailto:legal@quizly.app" style={{ color: '#FF5C1A' }}>legal@quizly.app</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
