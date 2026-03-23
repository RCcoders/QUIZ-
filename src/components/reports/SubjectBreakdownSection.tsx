import type { SubjectSummary } from '../../utils/reportUtils';

// Deterministic color palette for subject avatars
const AVATAR_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

interface SubjectBreakdownSectionProps {
  subjects: SubjectSummary[];
}

export function SubjectBreakdownSection({ subjects }: SubjectBreakdownSectionProps) {
  return (
    <section id="subject-breakdown" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
        Subject-wise Breakdown
      </h2>

      {subjects.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            padding: '2rem',
            textAlign: 'center',
            color: '#6B7280',
          }}
        >
          <p style={{ margin: 0 }}>No subject data yet. Complete some quizzes to see your breakdown.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {subjects.map((s, idx) => (
            <SubjectCard key={s.subject} summary={s} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
          ))}
        </div>
      )}
    </section>
  );
}

interface SubjectCardProps {
  summary: SubjectSummary;
  color: string;
}

function SubjectCard({ summary, color }: SubjectCardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '1.25rem',
        minWidth: '180px',
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Avatar + grade row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {summary.subject.charAt(0).toUpperCase()}
        </div>
        <span
          style={{
            background: '#EEF2FF',
            color: '#6366F1',
            borderRadius: '6px',
            padding: '0.2rem 0.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          {summary.letterGrade}
        </span>
      </div>

      {/* Subject name */}
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
        {summary.subject}
      </p>

      {/* Average percentage */}
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
        {summary.averagePercentage}% avg
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: '6px',
          borderRadius: '9999px',
          background: '#E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${summary.averagePercentage}%`,
            background: '#6366F1',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  );
}
