import type { BadgeRecord } from '../types/student';
import { BADGE_DEFINITIONS } from '../lib/badgeEngine';

interface BadgeListProps {
  badges: BadgeRecord[];
  loading?: boolean;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function BadgeList({ badges, loading = false }: BadgeListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard key="skeleton-1" />
        <SkeletonCard key="skeleton-2" />
        <SkeletonCard key="skeleton-3" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">🏅</span>
        <p className="text-slate-500 font-medium">Complete quizzes to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge, index) => {
        const def = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);
        if (!def) return null;
        return (
          <div
            key={`${badge.badgeId}-${index}`}
            className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100 hover:border-[#FF5C1A] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                {def.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{def.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {formatDate(badge.awardedAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
