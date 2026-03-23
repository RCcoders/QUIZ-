import { scoreBadgeColor } from '../../utils/reportUtils';

interface ScoreBadgeProps {
  percentage: number;
}

export function ScoreBadge({ percentage }: ScoreBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        background: scoreBadgeColor(percentage),
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: '0.8rem',
      }}
    >
      {percentage}%
    </span>
  );
}
