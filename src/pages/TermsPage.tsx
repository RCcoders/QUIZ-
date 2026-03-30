import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Quizly</title>
        <meta name="description" content="Read the Quizly terms of service and acceptable use policy." />
      </Helmet>

      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none' }}>
            Quizly
          </Link>
        </header>

        {/* Content */}
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Terms of Service</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Last updated: March 25, 2026</p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Acceptance</h2>
            <p>By accessing or using Quizly, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Use of Service</h2>
            <p>Quizly provides an AI-powered quiz creation and hosting platform for educational use. You may use the service for lawful educational purposes in accordance with these terms.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Acceptable Use</h2>
            <p>You agree not to use Quizly to upload harmful, illegal, or offensive content; to attempt to gain unauthorized access to the platform; or to interfere with other users' experience.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Intellectual Property</h2>
            <p>Quizly and its original content, features, and functionality are owned by Quizly and protected by applicable intellectual property laws. Quizzes you create remain your property.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Disclaimer</h2>
            <p>Quizly is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service and disclaim all implied warranties to the fullest extent permitted by law.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Quizly shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes by posting the new terms on this page with an updated date. Continued use constitutes acceptance.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>Contact</h2>
            <p>For questions about these terms, email us at <strong>legal@quizly.app</strong>.</p>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid #1e293b', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', marginRight: '1rem' }}>Home</Link>
          <Link to="/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</Link>
        </footer>
      </div>
    </>
  );
}
