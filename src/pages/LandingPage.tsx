import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Brain, Trophy, Play, BookOpen } from 'lucide-react';

export function LandingPage() {
    return (
        <div className="page relative overflow-hidden">
            {/* Background Animations */}
            <div className="bg-shape" style={{ top: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-primary)', borderRadius: '50%' }} />
            <div className="bg-shape" style={{ bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-secondary)', borderRadius: '50%' }} />

            {/* Hero Section */}
            <section className="container text-center section-padding relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="hero-title">
                        <span className="text-gradient-primary">
                            Classroom Quiz Master
                        </span>
                    </h1>
                    <p className="hero-subtitle">
                        Engage your students with live, interactive quizzes. AI-powered question generation,
                        real-time leaderboards, and gamified learning experiences.
                    </p>

                    <div className="flex justify-center gap-lg flex-wrap">
                        <Link to="/auth" className="btn btn-primary btn-lg">
                            <Zap size={20} />
                            Teacher Login
                        </Link>
                        <Link to="/join" className="btn btn-secondary btn-lg">
                            <Play size={20} />
                            Join Live Game
                        </Link>
                        <Link to="/student" className="btn btn-secondary btn-lg">
                            <BookOpen size={20} />
                            Browse Quizzes
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="container" style={{ paddingBottom: '4rem' }}>
                <div className="grid grid-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card text-center hover:translate-y-[-4px] transition-all"
                    >
                        <div className="icon-circle bg-gradient-primary">
                            <Brain size={32} color="white" />
                        </div>
                        <h3 className="mb-sm">AI-Powered</h3>
                        <p style={{ fontSize: '0.95rem' }}>
                            Generate quiz questions instantly from any syllabus or educational content using AI.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card text-center"
                    >
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--answer-red), var(--answer-blue))' }}>
                            <Users size={32} color="white" />
                        </div>
                        <h3 className="mb-sm">Live Games</h3>
                        <p style={{ fontSize: '0.95rem' }}>
                            Host real-time quiz games with QR code joining, live answer tracking, and synchronized gameplay.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card text-center"
                    >
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--answer-yellow), var(--answer-green))' }}>
                            <Trophy size={32} color="white" />
                        </div>
                        <h3 className="mb-sm">Gamification</h3>
                        <p style={{ fontSize: '0.95rem' }}>
                            Speed bonuses, leaderboards, and podium celebrations make learning fun and competitive.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="container text-center" style={{ paddingBottom: '4rem' }}>
                <h2 className="mb-xl">How It Works</h2>
                <div className="grid grid-4">
                    {[
                        { step: '1', title: 'Create Quiz', desc: 'Build or AI-generate questions' },
                        { step: '2', title: 'Share Code', desc: 'Students scan QR or enter code' },
                        { step: '3', title: 'Play Live', desc: 'Control the pace, see answers' },
                        { step: '4', title: 'View Results', desc: 'Analyze performance data' },
                    ].map((item, i) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="text-center"
                        >
                            <div className="icon-circle-sm bg-elevated border-primary text-primary-accent">
                                {item.step}
                            </div>
                            <h4 className="mb-xs">{item.title}</h4>
                            <p style={{ fontSize: '0.9rem' }}>{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                padding: '2rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                color: 'var(--text-muted)'
            }}>
                <p>Classroom Quiz Master © 2026 • Built with ❤️ for educators</p>
            </footer>
        </div>
    );
}

