import { apiFetch } from '../utils/api';
import type { BadgeId, BadgeRecord, ScoreRecord } from '../types/student';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  evaluate: (scores: ScoreRecord[], streak: number) => { earned: boolean; quizId?: string };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_quiz',
    name: 'First Quiz',
    description: 'Completed your first quiz!',
    icon: '🎉',
    evaluate: (scores) => ({ earned: scores.length >= 1 }),
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Studied 3 days in a row!',
    icon: '🔥',
    evaluate: (_scores, streak) => ({ earned: streak >= 3 }),
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Studied 7 days in a row!',
    icon: '⚡',
    evaluate: (_scores, streak) => ({ earned: streak >= 7 }),
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Scored 100% on a quiz!',
    icon: '🌟',
    evaluate: (scores) => {
      const perfect = scores.find((s) => s.percentage === 100);
      return { earned: !!perfect, quizId: perfect?.quizId };
    },
  },
  {
    id: 'high_achiever',
    name: 'High Achiever',
    description: 'Averaged 80%+ across 10 or more quizzes!',
    icon: '🏆',
    evaluate: (scores) => {
      if (scores.length < 10) return { earned: false };
      const avg = scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length;
      return { earned: avg >= 80 };
    },
  },
  {
    id: 'improvement',
    name: 'Most Improved',
    description: 'Improved your score by 20+ points on the same quiz!',
    icon: '📈',
    evaluate: (scores) => {
      // Group scores by quizId
      const byQuiz = new Map<string, ScoreRecord[]>();
      for (const s of scores) {
        const arr = byQuiz.get(s.quizId) ?? [];
        arr.push(s);
        byQuiz.set(s.quizId, arr);
      }
      for (const [quizId, attempts] of byQuiz) {
        if (attempts.length < 2) continue;
        // Sort by completedAt ascending
        const sorted = [...attempts].sort(
          (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
        const earliest = sorted[0].percentage;
        const latest = sorted[sorted.length - 1].percentage;
        if (latest - earliest >= 20) {
          return { earned: true, quizId };
        }
      }
      return { earned: false };
    },
  },
];

/**
 * Pure function: evaluates badge conditions and returns newly earned badges,
 * filtering out any already in existingBadgeIds.
 */
export function evaluateBadgeConditions(
  scores: ScoreRecord[],
  streak: number,
  existingBadgeIds: Set<BadgeId> = new Set()
): BadgeRecord[] {
  const now = new Date().toISOString();
  const newBadges: BadgeRecord[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (existingBadgeIds.has(def.id)) continue;
    const result = def.evaluate(scores, streak);
    if (result.earned) {
      newBadges.push({
        badgeId: def.id,
        awardedAt: now,
        quizId: result.quizId ?? null,
      });
    }
  }

  return newBadges;
}

async function writeWithRetry(
  badge: BadgeRecord
): Promise<void> {
  try {
    await apiFetch('/api/badges', {
      method: 'POST',
      body: badge
    });
  } catch (err) {
    console.error(`[badgeEngine] Failed to award badge "${badge.badgeId}":`, err);
  }
}

/**
 * Reads existing badges for the user, evaluates conditions, writes new badges,
 * and returns newly awarded badges.
 */
export async function evaluateBadges(
  userId: string,
  scores: ScoreRecord[],
  streak: number
): Promise<BadgeRecord[]> {
  try {
    // Read existing badges from backend
    const existingBadges = await apiFetch('/api/badges');
    const existingBadgeIds = new Set<BadgeId>(
      existingBadges.map((b: any) => b.badgeId as BadgeId)
    );

    const newBadges = evaluateBadgeConditions(scores, streak, existingBadgeIds);

    // Write new badges
    await Promise.all(newBadges.map((badge) => writeWithRetry(badge)));

    return newBadges;
  } catch (err) {
    console.error('[badgeEngine] Error in evaluateBadges:', err);
    return [];
  }
}

/**
 * Validates a display name: trimmed length must be between 1 and 50 characters.
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Display name cannot be empty.' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be 50 characters or fewer.' };
  }
  return { valid: true };
}
