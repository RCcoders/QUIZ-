import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { TrendDataPoint } from '../../utils/reportUtils';

interface PerformanceTrendsChartProps {
  data: TrendDataPoint[];
  yearLabel: string;
}

export function PerformanceTrendsChart({ data, yearLabel }: PerformanceTrendsChartProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '1.5rem',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
          Performance Trends
        </h2>
        <span
          style={{
            background: '#EEF2FF',
            color: '#6366F1',
            borderRadius: '9999px',
            padding: '0.2rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {yearLabel}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontSize: '0.8rem',
            }}
            formatter={(value) => [`${value}%`, 'Avg Score']}
          />
          <Area
            type="monotone"
            dataKey="average"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
