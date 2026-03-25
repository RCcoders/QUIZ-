import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — QuizMaster</title>
        <meta name="description" content="Read how QuizMaster collects, uses, and protects your personal data." />
      </Helmet>

      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none' }}>
            QuizMaster
          </Link>
        </header>

        {/* Content */}
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Last updated: March 25, 2026</p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Introduction</h2>
            <p>QuizMaster ("we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard information when you use our platform.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Data We Collect</h2>
            <p>We collect information you provide directly, such as your email address and display name when you create an account. We also collect usage data including quiz activity, scores, and session participation to power the platform's features.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>How We Use Data</h2>
            <p>We use your data to operate and improve QuizMaster, provide quiz results and analytics to teachers, and communicate important service updates. We do not sell your personal data to third parties.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Quiz session data is retained for up to 12 months. You may request deletion of your data at any time by contacting us.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Third-Party Services</h2>
            <p>QuizMaster uses Firebase (Google) for authentication and data storage, and Google Gemini for AI quiz generation. These services have their own privacy policies. We encourage you to review them.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing. To exercise these rights, contact us at the address below.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Contact</h2>
            <p>For privacy-related questions, email us at <strong>privacy@quizmaster.app</strong>.</p>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid #1e293b', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', marginRight: '1rem' }}>Home</Link>
          <Link to="/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms of Service</Link>
        </footer>
      </div>
    </>
  );
}
