import { useState } from 'react';
import { ScoreBadge } from './ScoreBadge';
import { formatDate, formatDuration, sortRecordsDescending } from '../../utils/reportUtils';
import type { ScoreRecord } from '../../types/student';

const PAGE_SIZE = 10;

interface QuizHistoryTableProps {
  records: ScoreRecord[];
  onDownloadCSV: () => void;
}

export function QuizHistoryTable({ records, onDownloadCSV }: QuizHistoryTableProps) {
  const [page, setPage] = useState(0);

  const sorted = sortRecordsDescending(records);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRecords = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section style={{ marginBottom: '2rem' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
          Recent Quiz History
        </h2>
        <button
          onClick={onDownloadCSV}
          disabled={records.length === 0}
          style={{
            background: records.length === 0 ? '#E5E7EB' : '#6366F1',
            color: records.length === 0 ? '#9CA3AF' : '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: records.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Quiz Name', 'Date', 'Score', 'Time Taken', 'Action'].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6B7280',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '0.9rem',
                  }}
                >
                  No quiz history yet. Complete a quiz to see your results here.
                </td>
              </tr>
            ) : (
              pageRecords.map((record, idx) => (
                <tr
                  key={record.id}
                  style={{
                    borderBottom: idx < pageRecords.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>
                    {record.quizTitle}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    {formatDate(record.completedAt)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <ScoreBadge percentage={record.percentage} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    {formatDuration(record.timeTakenMs)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <a
                      href={`/quiz-results/${record.quizId}`}
                      style={{
                        color: '#6366F1',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        letterSpacing: '0.03em',
                      }}
                    >
                      VIEW DETAILS
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderTop: '1px solid #F3F4F6',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#6B7280', marginRight: '0.5rem' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={paginationBtnStyle(page === 0)}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={paginationBtnStyle(page === totalPages - 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#F3F4F6' : '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: disabled ? '#9CA3AF' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
