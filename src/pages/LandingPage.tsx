import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Zap, BarChart2, Trophy, CheckCircle2, Quote,
  ArrowRight, Instagram, Twitter, Facebook, Github
} from 'lucide-react';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'QuizMaster',
  url: 'https://quizmaster.app/',
  description: 'Create, host, and play interactive quizzes in real time. AI-powered quiz generation for teachers and students.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, background: '#FF5C1A', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Play size={18} fill="white" color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>QuizMaster</span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>How It Works</a>
            <a href="#pricing" style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>Pricing</a>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: 'transparent', border: '1.5px solid #E5E7EB',
                borderRadius: 8, padding: '8px 18px',
                fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: '#FF5C1A', border: 'none',
                borderRadius: 8, padding: '8px 18px',
                fontSize: 14, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer',
              }}
            >
              Create Quiz
            </button>
          </div>
        </div>
      </header>

      <main>
      {/* ── Hero ── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
        }}>
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ fontSize: 52, fontWeight: 800, color: '#111827', lineHeight: 1.1, marginBottom: 20 }}>
              Create AI Quiz<br />
              <span style={{ color: '#FF5C1A' }}>Instantly.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Transform any text, URL, or topic into an engaging quiz in seconds using advanced AI.
              Save hours of prep time and engage your students like never before.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: '#FF5C1A', color: '#FFFFFF', border: 'none',
                  borderRadius: 10, padding: '14px 28px',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Create AI Quiz <ArrowRight size={18} />
              </button>
              <Link
                to="/join"
                style={{
                  background: 'transparent', color: '#FF5C1A',
                  border: '1.5px solid #FF5C1A',
                  borderRadius: 10, padding: '14px 28px',
                  fontSize: 16, fontWeight: 600, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Join a Quiz
              </Link>
            </div>
          </motion.div>

          {/* Right — orange square illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              width: 380, height: 380,
              background: '#FF5C1A',
              borderRadius: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(255,92,26,0.25)',
            }}>
              <div style={{
                width: 220, height: 220,
                background: '#FFFFFF',
                borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 96, height: 96,
                  background: '#FF5C1A',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={48} color="white" fill="white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 24px', background: '#F5F5F5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              Powerful Features for Modern Educators
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>
              Everything you need to create, share, and analyze quizzes in one platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                icon: <Zap size={28} color="#FF5C1A" />,
                iconBg: '#FFF3EE',
                title: 'AI Generation',
                desc: 'Paste a link or text and get 10 questions in 5 seconds. Magic at your fingertips.',
              },
              {
                icon: <BarChart2 size={28} color="#3B82F6" />,
                iconBg: '#EFF6FF',
                title: 'Real-time Insights',
                desc: 'Track student progress instantly with detailed performance dashboards and analytics.',
              },
              {
                icon: <Trophy size={28} color="#10B981" />,
                iconBg: '#ECFDF5',
                title: 'Live Competition',
                desc: 'Host live quiz sessions with interactive leaderboards to boost classroom engagement.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: 32,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{
                  width: 56, height: 56, background: feature.iconBg,
                  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              How It Works
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>Create your first quiz in three simple steps</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              {
                num: '1',
                title: 'Input Content',
                desc: 'Upload a PDF, paste a YouTube link, or simply type your topic for the AI to process.',
              },
              {
                num: '2',
                title: 'Review & Customize',
                desc: 'Review the AI-generated questions, add your own images, and tweak the difficulty levels.',
              },
              {
                num: '3',
                title: 'Share & Play',
                desc: 'Share a unique code or link with your audience. Watch the live leaderboard as they play!',
              },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56,
                  background: '#FFF3EE',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 22, fontWeight: 800, color: '#FF5C1A',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 24px', background: '#F5F5F5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              Loved by Educators
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>
              Join thousands of teachers already using QuizMaster.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                quote: 'QuizMaster has completely transformed how I assess my students. The AI generation saves me hours every week and the live sessions keep everyone engaged.',
                name: 'Sarah Johnson',
                role: 'High School Biology Teacher',
                initials: 'SJ',
                color: '#FF5C1A',
              },
              {
                quote: 'The real-time leaderboard creates a healthy competitive atmosphere in my classroom. My students actually look forward to quiz days now!',
                name: 'Michael Chen',
                role: 'Middle School Math Teacher',
                initials: 'MC',
                color: '#3B82F6',
              },
              {
                quote: 'I love how easy it is to create quizzes from my existing lesson materials. The analytics help me identify exactly where students need more support.',
                name: 'Emily Rodriguez',
                role: 'University Professor',
                initials: 'ER',
                color: '#10B981',
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: 32,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <Quote size={28} color="#FF5C1A" style={{ opacity: 0.6 }} />
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, flex: 1 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#FFFFFF',
                    flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                highlight: false,
                features: [
                  'Up to 5 quizzes',
                  '30 students per session',
                  'Basic analytics',
                  'Manual quiz creation',
                  'Email support',
                ],
                cta: 'Get Started Free',
              },
              {
                name: 'Pro Teacher',
                price: '$12',
                period: '/month',
                highlight: true,
                features: [
                  'Unlimited quizzes',
                  'Unlimited students',
                  'AI quiz generation',
                  'Advanced analytics',
                  'Priority support',
                  'Custom branding',
                ],
                cta: 'Start Pro Trial',
              },
              {
                name: 'School',
                price: 'Custom',
                period: 'pricing',
                highlight: false,
                features: [
                  'Everything in Pro',
                  'School-wide dashboard',
                  'SSO / LMS integration',
                  'Dedicated account manager',
                  'Custom onboarding',
                  'SLA guarantee',
                ],
                cta: 'Contact Sales',
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: 32,
                  boxShadow: plan.highlight
                    ? '0 8px 32px rgba(255,92,26,0.18)'
                    : '0 1px 4px rgba(0,0,0,0.08)',
                  border: plan.highlight ? '2px solid #FF5C1A' : '1px solid #E5E7EB',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#FF5C1A', color: '#FFFFFF',
                    fontSize: 12, fontWeight: 700, padding: '4px 16px',
                    borderRadius: 20,
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: '#111827' }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: '#6B7280' }}>{plan.period}</span>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                      <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    width: '100%',
                    background: plan.highlight ? '#FF5C1A' : 'transparent',
                    color: plan.highlight ? '#FFFFFF' : '#FF5C1A',
                    border: `1.5px solid #FF5C1A`,
                    borderRadius: 10, padding: '12px 0',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
            Ready to Transform Your Classroom?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7 }}>
            Join over 50,000 educators who use QuizMaster to create engaging, data-driven learning experiences.
          </p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: '#FF5C1A', color: '#FFFFFF', border: 'none',
              borderRadius: 10, padding: '16px 36px',
              fontSize: 17, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            Get Started for Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#0F172A', padding: '64px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, background: '#FF5C1A', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={18} fill="white" color="white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 20, color: '#FFFFFF' }}>QuizMaster</span>
              </div>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, maxWidth: 280 }}>
                The modern quiz platform for educators. Create, share, and analyze quizzes powered by AI.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {[Twitter, Instagram, Facebook, Github].map((Icon, idx) => (
                  <a key={idx} href="#" style={{
                    width: 36, height: 36, background: '#1E293B', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94A3B8', textDecoration: 'none',
                  }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                heading: 'Product',
                links: ['Features', 'How It Works', 'Pricing', 'Changelog'],
              },
              {
                heading: 'Company',
                links: ['About', 'Blog', 'Careers', 'Press'],
              },
              {
                heading: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
              },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {col.heading}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((link, li) => (
                    <li key={li}>
                      <a href="#" style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'none' }}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1E293B',
            paddingTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              © {new Date().getFullYear()} QuizMaster. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
