import type { SubjectInsight } from '../../utils/reportUtils';

interface StrategicInsightsPanelProps {
  coreStrength: SubjectInsight | null;
  growthFocus: SubjectInsight | null;
}

export function StrategicInsightsPanel({ coreStrength, growthFocus }: StrategicInsightsPanelProps) {
  return (
    <div
      style={{
        background: '#312E81',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minWidth: '240px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#C7D2FE' }}>
        Strategic Insights
      </h2>

      {/* Core Strength */}
      <div>
        <p
          style={{
            margin: '0 0 0.35rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#A5B4FC',
          }}
        >
          CORE STRENGTH
        </p>
        {coreStrength ? (
          <>
            <p style={{ margin: '0 0 0.15rem', fontWeight: 600, fontSize: '1rem' }}>
              {coreStrength.subject}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#C7D2FE' }}>
              {coreStrength.letterGrade} · {coreStrength.averagePercentage}%
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A5B4FC' }}>No data yet</p>
        )}
      </div>

      {/* Growth Focus */}
      <div>
        <p
          style={{
            margin: '0 0 0.35rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#A5B4FC',
          }}
        >
          GROWTH FOCUS
        </p>
        {growthFocus ? (
          <>
            <p style={{ margin: '0 0 0.15rem', fontWeight: 600, fontSize: '1rem' }}>
              {growthFocus.subject}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#C7D2FE' }}>
              {growthFocus.letterGrade} · {growthFocus.averagePercentage}%
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A5B4FC' }}>
            No comparison data yet
          </p>
        )}
      </div>

      {/* View Full Analysis link */}
      <a
        href="#subject-breakdown"
        style={{
          marginTop: 'auto',
          color: '#A5B4FC',
          fontSize: '0.8rem',
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.04em',
        }}
      >
        VIEW FULL ANALYSIS →
      </a>
    </div>
  );
}
