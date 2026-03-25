/**
 * Performance and scalability configuration for the quiz application.
 * Optimized for 75+ concurrent students.
 */

export const PERFORMANCE_CONFIG = {
    // Updated: target architecture supports 1,000 concurrent students
    MAX_CONCURRENT_STUDENTS: 1000,

    // Increased: reduces UI thrash when many participants submit simultaneously
    REALTIME_THROTTLE_MS: 1000,

    // Keep: 50 is a good UX ceiling for participant lists
    MAX_PARTICIPANTS_DISPLAY: 50,

    // Keep: only show top 10 on leaderboard
    LEADERBOARD_TOP_N: 10,

    // Increased: 250ms batching prevents Firestore write storms at 1,000 users
    // (100ms was too aggressive — at 1,000 simultaneous answers it queues 1,000 writes)
    ANSWER_BATCH_DELAY_MS: 250,

    // Keep: 5 seconds is acceptable staleness window
    MAX_REALTIME_STALENESS_MS: 5000,

    // Keep: virtual scroll threshold
    VIRTUALIZATION_THRESHOLD: 30,
} as const;

export const ANTI_CHEAT_CONFIG = {
    // Maximum number of violations before auto-kick
    MAX_VIOLATIONS: 3,

    // Types of violations and their severity (1 = minor, 3 = severe)
    VIOLATION_SEVERITY: {
        tab_switch: 2,
        fullscreen_exit: 2,
        copy_attempt: 1,
        devtools_open: 3,
    } as const,

    // Auto-enter fullscreen when quiz starts - DISABLED to prevent false kicks
    AUTO_FULLSCREEN: false,

    // Enable copy protection
    ENABLE_COPY_PROTECTION: true,

    // Enable tab switch detection - DISABLED to prevent false kicks
    ENABLE_TAB_DETECTION: true,
} as const;

export const SCORING_CONFIG = {
    // Base points for correct answer
    BASE_POINTS: 10,

    // Maximum speed bonus points
    MAX_SPEED_BONUS: 2,

    // Decimal precision for scores
    DECIMAL_PRECISION: 1,
} as const;
