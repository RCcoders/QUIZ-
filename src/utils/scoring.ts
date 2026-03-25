/**
 * Centralized scoring utilities for the quiz application.
 * Ensures consistent score calculations across student and teacher views.
 */

export interface ScoreConfig {
    basePoints: number;
    maxBonus: number;
    timerEnabled: boolean;
    timerSeconds: number;
}

export interface ScoreResult {
    points: number;
    breakdown: {
        base: number;
        speedBonus: number;
    };
}

/**
 * Validates and clamps time taken to reasonable bounds.
 * @param timeTakenMs - Raw time taken in milliseconds
 * @param timerSeconds - Maximum allowed time in seconds
 * @returns Validated time in milliseconds
 */
export function validateTimeTaken(timeTakenMs: number, timerSeconds: number): number {
    // Ensure non-negative
    if (timeTakenMs < 0) {
        console.warn('Negative time taken detected, clamping to 0:', timeTakenMs);
        return 0;
    }

    const maxTimeMs = timerSeconds * 1000;

    // Check for unreasonably large values (likely timestamp instead of duration)
    if (timeTakenMs > 3600000) { // 1 hour
        console.warn('Unreasonably large time taken detected, resetting to max:', timeTakenMs);
        return maxTimeMs;
    }

    // Clamp to maximum allowed time
    return Math.min(timeTakenMs, maxTimeMs);
}

/**
 * Calculates score with speed bonus using consistent rounding.
 * @param isCorrect - Whether the answer was correct
 * @param timeTakenMs - Time taken to answer in milliseconds
 * @param config - Scoring configuration
 * @returns Score result with breakdown
 */
export function calculateScore(
    isCorrect: boolean,
    timeTakenMs: number,
    config: ScoreConfig
): ScoreResult {
    const result: ScoreResult = {
        points: 0,
        breakdown: {
            base: 0,
            speedBonus: 0,
        },
    };

    // No points for incorrect answers
    if (!isCorrect) {
        return result;
    }

    // Base points
    result.breakdown.base = config.basePoints;
    result.points = config.basePoints;

    // Calculate speed bonus if timer is enabled
    if (config.timerEnabled && config.timerSeconds > 0) {
        const validatedTime = validateTimeTaken(timeTakenMs, config.timerSeconds);
        const totalTimeMs = config.timerSeconds * 1000;

        // Linear decay: Full bonus at 0s, 0 bonus at timerSeconds
        // Formula: MaxBonus * (1 - (timeTaken / totalTime))
        const bonusRatio = 1 - (validatedTime / totalTimeMs);
        const rawBonus = config.maxBonus * Math.max(0, bonusRatio);

        // Round to 1 decimal place for consistency
        result.breakdown.speedBonus = parseFloat(rawBonus.toFixed(1));
        result.points = parseFloat((result.breakdown.base + result.breakdown.speedBonus).toFixed(1));
    }

    return result;
}

/**
 * Formats score for display with consistent decimal places.
 * @param score - Score to format
 * @returns Formatted score string
 */
export function formatScore(score: number): string {
    return score.toFixed(1);
}

/**
 * Calculates percentage score.
 * @param earnedPoints - Points earned
 * @param totalPossiblePoints - Maximum possible points
 * @returns Percentage (0-100)
 */
export function calculatePercentage(earnedPoints: number, totalPossiblePoints: number): number {
    if (totalPossiblePoints === 0) return 0;
    return Math.round((earnedPoints / totalPossiblePoints) * 100);
}

/**
 * Returns the redirect path for a given user role after login/signup.
 * Defaults to '/student/dashboard' for unknown or missing roles.
 * @param role - The user's role string
 * @returns The redirect path
 */
export function getRedirectPath(role: string): string {
    if (role === 'teacher') return '/teacher';
    return '/student/dashboard';
}

/**
 * Derives a 1-2 character initials string from a display name or email.
 * E.g. "Jane Smith" → "JS", "jane@email.com" → "JA", "" → "S"
 */
export function getInitials(displayName: string, fallback = 'S'): string {
    const parts = displayName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return fallback;
    return parts.map(w => w[0]).join('').toUpperCase().slice(0, 2) || fallback;
}

// ─── Student scoring utilities ────────────────────────────────────────────────

import type { ScoreRecord } from '../types/student';
import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
} from 'firebase/firestore';

/**
 * Returns a human-readable performance label for a given percentage score.
 * - ≥ 80 → 'Excellent'
 * - ≥ 60 → 'Good'
 * - < 60 → 'Keep Practicing'
 */
export function getPerformanceLabel(percentage: number): 'Excellent' | 'Good' | 'Keep Practicing' {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    return 'Keep Practicing';
}

/**
 * Computes the average percentage score across an array of ScoreRecords.
 * Returns 0 for an empty array.
 */
export function computeAverageScore(records: ScoreRecord[]): number {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + r.percentage, 0);
    return Math.round(sum / records.length);
}

/**
 * Computes the current streak (consecutive days with at least one completed quiz)
 * based on the completedAt timestamps in the records.
 * Counts backwards from today.
 */
export function computeStreak(records: ScoreRecord[]): number {
    if (records.length === 0) return 0;

    // Collect unique active dates (YYYY-MM-DD) from records
    const activeDates = new Set(
        records.map(r => r.completedAt.slice(0, 10))
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; ; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (activeDates.has(dateStr)) {
            streak++;
        } else {
            // Allow missing today (streak still counts from yesterday)
            if (i === 0) continue;
            break;
        }
    }

    return streak;
}

/**
 * Persists a score record to Firestore under `users/{uid}/scores`.
 */
export async function saveScoreRecord(
    uid: string,
    record: Omit<ScoreRecord, 'id'>
): Promise<void> {
    const scoresRef = collection(db, 'users', uid, 'scores');
    await addDoc(scoresRef, record);
}

/**
 * Returns the last N score records sorted by completedAt descending.
 * Used for the "Continue Learning" section on the Student Dashboard.
 * @param records - Array of ScoreRecords (any order)
 * @param count - Number of records to return (default 3)
 */
export function getContinueLearning(records: ScoreRecord[], count = 3): ScoreRecord[] {
    return [...records]
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
        .slice(0, count);
}

/**
 * Retrieves all score records for a user from Firestore,
 * ordered by completedAt descending (most recent first).
 */
export async function getScoreRecords(uid: string): Promise<ScoreRecord[]> {
    const scoresRef = collection(db, 'users', uid, 'scores');
    const q = query(scoresRef, orderBy('completedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ScoreRecord, 'id'>),
    }));
}
