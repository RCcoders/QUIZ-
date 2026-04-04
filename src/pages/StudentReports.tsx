import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentNavbar } from '../components/StudentNavbar';
import { PerformanceTrendsChart } from '../components/reports/PerformanceTrendsChart';
import { StrategicInsightsPanel } from '../components/reports/StrategicInsightsPanel';
import { SubjectBreakdownSection } from '../components/reports/SubjectBreakdownSection';
import { QuizHistoryTable } from '../components/reports/QuizHistoryTable';
import { useAuth } from '../contexts/AuthContext';
import { useStudentStats } from '../hooks/useStudentStats';
import {
  computeTrendData,
  computeSubjectBreakdown,
  computeInsights,
  generateCSV,
} from '../utils/reportUtils';

function deriveYearLabel(records: { completedAt: string }[]): string {
  if (records.length === 0) {
    const now = new Date();
    return `${now.getFullYear() - 1}–${now.getFullYear()}`;
  }
  const years = records.map((r) => new Date(r.completedAt).getFullYear());
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

function LoadingSkeleton() {
  const skeletonStyle = {
    background: '#E5E7EB',
    borderRadius: '12px',
    animation: 'pulse 1.5s ease-in-out infinite',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' as const }}>
        <div style={{ ...skeletonStyle, flex: 1, minWidth: '280px', height: '280px' }} />
        <div style={{ ...skeletonStyle, width: '260px', height: '280px' }} />
      </div>
      <div style={{ ...skeletonStyle, height: '160px' }} />
      <div style={{ ...skeletonStyle, height: '320px' }} />
    </div>
  );
}

export function StudentReports() {
  const { user } = useAuth();
  const { records, loading } = useStudentStats(user?._id);

  const trendData = computeTrendData(records);
  const subjectBreakdown = computeSubjectBreakdown(records);
  const insights = computeInsights(subjectBreakdown);
  const yearLabel = deriveYearLabel(records);

  const handleDownloadCSV = () => {
    const csv = generateCSV(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-history-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <StudentNavbar activePage="reports" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
            Academic Performance
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>
            Track your progress, identify strengths, and focus your study efforts.
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : records.length === 0 ? (
          /* Empty state */
          <div
            data-testid="empty-state"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#EEF2FF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <BookOpen size={28} color="#6366F1" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
              No quiz history yet
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '0 0 1.5rem' }}>
              Complete your first quiz to start seeing your academic performance data here.
            </p>
            <Link
              to="/student"
              style={{
                display: 'inline-block',
                background: '#6366F1',
                color: '#FFFFFF',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Browse Quizzes
            </Link>
          </div>
        ) : (
          <>
            {/* Trends + Insights row */}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginBottom: '2rem',
                flexWrap: 'wrap',
              }}
            >
              <PerformanceTrendsChart data={trendData} yearLabel={yearLabel} />
              <StrategicInsightsPanel
                coreStrength={insights.coreStrength}
                growthFocus={insights.growthFocus}
              />
            </div>

            {/* Subject breakdown */}
            <SubjectBreakdownSection subjects={subjectBreakdown} />

            {/* Quiz history table */}
            <QuizHistoryTable records={records} onDownloadCSV={handleDownloadCSV} />
          </>
        )}
      </main>
    </div>
  );
}
