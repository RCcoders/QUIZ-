import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, BookOpen } from 'lucide-react';
import { StudentNavbar } from '../components/StudentNavbar';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../hooks/useNotes';
import { filterNotes } from '../utils/noteFilter';

export function StudentLibrary() {
  const navigate = useNavigate();
  const { notes, loading } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const publishedNotes = useMemo(
    () => notes.filter((n) => n.published),
    [notes]
  );

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(publishedNotes.map((n) => n.subject)));
    return unique.sort();
  }, [publishedNotes]);

  const filteredNotes = useMemo(
    () => filterNotes(publishedNotes, searchQuery, selectedSubject),
    [publishedNotes, searchQuery, selectedSubject]
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <Helmet>
        <title>Student Library — Quizly</title>
        <meta name="description" content="Browse learning materials and notes published by your teachers." />
      </Helmet>
      <StudentNavbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <BookOpen size={24} color="#FF5C1A" />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
              Student Library
            </h1>
          </div>
          <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>
            Browse learning materials published by your teachers.
          </p>
        </div>

        {/* Search input */}
        <div style={{ marginBottom: 20, position: 'relative', maxWidth: 420 }}>
          <Search
            size={16}
            color="#9CA3AF"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search notes"
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              color: '#111827',
              background: '#FFFFFF',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Subject filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {['all', ...subjects].map((subject) => {
            const active = selectedSubject === subject;
            return (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: active ? '2px solid #FF5C1A' : '2px solid #E5E7EB',
                  background: active ? '#FFF3EE' : '#FFFFFF',
                  color: active ? '#FF5C1A' : '#6B7280',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {subject === 'all' ? 'All' : subject}
              </button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 24,
                  padding: 24,
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F1F5F9' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 18, background: '#F1F5F9', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '60%', background: '#F1F5F9', borderRadius: 6 }} />
                  </div>
                </div>
                <div style={{ height: 14, background: '#F1F5F9', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 14, width: '80%', background: '#F1F5F9', borderRadius: 6 }} />
              </div>
            ))}
          </div>
        )}

        {/* Notes grid */}
        {!loading && filteredNotes.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/student/library/${note.id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredNotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
            <BookOpen size={40} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
              No notes found
            </p>
            <p style={{ fontSize: 14, margin: 0 }}>
              {searchQuery || selectedSubject !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'No published notes are available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
