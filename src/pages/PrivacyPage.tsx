// src/pages/PrivacyPage.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — Quizly';
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
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Privacy Policy</span>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 48 }}>
          Last updated: March 1, 2026
        </p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Information We Collect</h2>
          <p style={pStyle}>
            Quizly collects information you provide when creating an account, including your
            name, email address, and role (teacher or student). We also collect quiz performance
            data, including scores, completion times, and answer history, to power your
            personal dashboard and analytics.
          </p>
          <p style={pStyle}>
            When you join a live game session, we collect your display name and the answers
            you submit during the session.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. How We Use Your Information</h2>
          <p style={pStyle}>
            We use your information to provide and improve the Quizly service, including
            authenticating your account, displaying your performance history, calculating
            streaks and scores, and generating personalised quiz recommendations.
          </p>
          <p style={pStyle}>
            We do not sell your personal data to third parties. We do not use your data
            for advertising purposes.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Data Storage</h2>
          <p style={pStyle}>
            Your data is stored securely using Google Firebase (Firestore and Firebase Authentication),
            which is hosted on Google Cloud infrastructure. Firebase complies with GDPR, SOC 2,
            and ISO 27001 standards.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Children's Privacy</h2>
          <p style={pStyle}>
            Quizly is designed for use in educational settings, including by students under 13.
            Teachers are responsible for obtaining appropriate parental consent before having
            students create accounts. Students can participate in live game sessions without
            creating an account — only a display name is required.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Cookies</h2>
          <p style={{ ...pStyle }} id="cookies">
            Quizly uses essential cookies for authentication (Firebase Auth session tokens).
            We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Your Rights (GDPR)</h2>
          <p style={{ ...pStyle }} id="gdpr">
            If you are located in the European Economic Area, you have the right to access,
            correct, or delete your personal data. To exercise these rights, contact us at
            privacy@quizly.app. We will respond within 30 days.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Contact</h2>
          <p style={pStyle}>
            For privacy-related questions, contact us at{' '}
            <a href="mailto:privacy@quizly.app" style={{ color: '#FF5C1A' }}>privacy@quizly.app</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
