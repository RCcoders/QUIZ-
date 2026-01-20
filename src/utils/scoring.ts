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
