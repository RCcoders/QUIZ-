import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ArrowLeft, Brain, ClipboardList, Sparkles, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { StudentNavbar } from '../components/StudentNavbar';
import type { Note } from '../types/student';

export function NoteDetail() {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // AI notes state (legacy plain-text)
  const [aiNotes, setAiNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);

  // Generate Notes (structured agent) state
  interface AgentNotes {
    summary: string;
    keyConcepts: string[];
    importantQuestions: string[];
  }
  const [agentNotes, setAgentNotes] = useState<AgentNotes | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState('');
  const [agentExpanded, setAgentExpanded] = useState(false);

  useEffect(() => {
    if (!noteId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchNote = async () => {
      try {
        const data = await apiFetch(`/api/notes/${noteId}`);
        setNote(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  const generateAiNotes = async () => {
    // Disabled (Coming Soon)
    return;
  };

  const generateAgentNotes = async () => {
    // Disabled (Coming Soon)
    return;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <Helmet>
        <title>{note ? `${note.title} — Quizly` : 'Note — Quizly'}</title>
      </Helmet>
      <StudentNavbar />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        {/* Breadcrumb */}
        <Link
          to="/student/library"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#6B7280',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 28,
          }}
        >
          <ArrowLeft size={15} />
          Back to Library
        </Link>

        {/* Loading state */}
        {loading && (
          <div
            className="animate-pulse"
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ height: 28, width: '60%', background: '#F1F5F9', borderRadius: 8, marginBottom: 16 }} />
            <div style={{ height: 16, width: '30%', background: '#F1F5F9', borderRadius: 6, marginBottom: 24 }} />
            <div style={{ height: 14, background: '#F1F5F9', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 14, background: '#F1F5F9', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 14, width: '80%', background: '#F1F5F9', borderRadius: 6 }} />
          </div>
        )}

        {/* Not found state */}
        {!loading && notFound && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 48,
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <BookOpen size={40} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>
              Note not found
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
              This note may have been removed or is no longer available.
            </p>
            <Link
              to="/student/library"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#FF5C1A',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} />
              Back to Library
            </Link>
          </div>
        )}

        {/* Note content */}
        {!loading && note && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {/* Subject chip */}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 20,
                background: '#FFF3EE',
                color: '#FF5C1A',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'capitalize',
                marginBottom: 12,
              }}
            >
              {note.subject}
            </span>

            {/* Title */}
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
              {note.title}
            </h1>

            {/* Date */}
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 28px' }}>
              {formatDate(note.createdAt)}
            </p>

            {/* Content */}
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                marginBottom: 36,
              }}
            >
              {note.content}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {note.linkedQuizId ? (
                <Link
                  to={`/student/quiz/${note.linkedQuizId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #FF5C1A, #FF8C42)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(255,92,26,0.35)',
                  }}
                >
                  <ClipboardList size={16} />
                  Practice Quiz
                </Link>
              ) : (
                <Link
                  to={`/student/adaptive-quiz?noteId=${noteId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                  }}
                >
                  <Brain size={16} />
                  Adaptive Practice
                </Link>
              )}

              {/* AI Notes button */}
              <button
                onClick={() => { }}
                disabled={true}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                }}
              >
                <Sparkles size={16} />
                AI Study Notes (Coming Soon)
              </button>

              {/* Generate Notes button (structured agent) */}
              <button
                onClick={() => { }}
                disabled={true}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                }}
              >
                <Sparkles size={16} />
                Generate Notes (Coming Soon)
              </button>
            </div>

            {/* AI Notes panel */}
            {aiError && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
                {aiError}
              </div>
            )}
            {aiNotes && (
              <div style={{ marginTop: 20, borderRadius: 14, border: '1px solid #DDD6FE', overflow: 'hidden' }}>
                <button
                  onClick={() => setAiExpanded(v => !v)}
                  style={{
                    width: '100%', padding: '12px 16px', background: '#F5F3FF',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>
                    <Sparkles size={15} /> AI Study Notes
                  </span>
                  {aiExpanded ? <ChevronUp size={16} color="#7C3AED" /> : <ChevronDown size={16} color="#7C3AED" />}
                </button>
                {aiExpanded && (
                  <div style={{ padding: '16px', background: '#FAFAFA', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.75, color: '#374151' }}>
                    {aiNotes}
                  </div>
                )}
              </div>
            )}

            {/* Generate Notes (agent) error */}
            {agentError && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>
                {agentError}
              </div>
            )}

            {/* Generate Notes (agent) structured panel */}
            {agentNotes && (
              <div style={{ marginTop: 20, borderRadius: 14, border: '1px solid #A7F3D0', overflow: 'hidden' }}>
                <button
                  onClick={() => setAgentExpanded(v => !v)}
                  style={{
                    width: '100%', padding: '12px 16px', background: '#ECFDF5',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 8,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#059669' }}>
                    <Sparkles size={15} /> Generated Notes
                  </span>
                  {agentExpanded ? <ChevronUp size={16} color="#059669" /> : <ChevronDown size={16} color="#059669" />}
                </button>
                {agentExpanded && (
                  <div style={{ padding: '16px', background: '#FAFAFA', fontSize: 14, lineHeight: 1.75, color: '#374151' }}>
                    {/* Summary */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
                      <p style={{ margin: 0 }}>{agentNotes.summary}</p>
                    </div>
                    {/* Key Concepts */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Concepts</div>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {agentNotes.keyConcepts.map((concept, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{concept}</li>
                        ))}
                      </ul>
                    </div>
                    {/* Important Questions */}
                    <div>
                      <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Important Questions</div>
                      <ol style={{ margin: 0, paddingLeft: 20 }}>
                        {agentNotes.importantQuestions.map((q, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{q}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
