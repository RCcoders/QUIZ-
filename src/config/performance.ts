/**
 * Performance and scalability configuration for the quiz application.
 * Optimized for 75+ concurrent students.
 */

export const PERFORMANCE_CONFIG = {
    // Maximum concurrent students the system is designed to handle
    MAX_CONCURRENT_STUDENTS: 100,

    // Real-time update throttling (milliseconds)
    // Prevents UI thrashing with many simultaneous updates
    REALTIME_THROTTLE_MS: 500,

    // Maximum participants to display in lists without pagination
    MAX_PARTICIPANTS_DISPLAY: 50,

    // Number of top students to show in leaderboard
    LEADERBOARD_TOP_N: 10,

    // Delay before batching answer submissions (milliseconds)
    // Helps prevent database overload when many students answer simultaneously
    ANSWER_BATCH_DELAY_MS: 100,

    // Maximum time to wait for real-time updates before manual refresh
    MAX_REALTIME_STALENESS_MS: 5000,

    // Virtualization threshold - when to start using virtual scrolling
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
    ENABLE_TAB_DETECTION: false,
} as const;

export const SCORING_CONFIG = {
    // Base points for correct answer
    BASE_POINTS: 10,

    // Maximum speed bonus points
    MAX_SPEED_BONUS: 2,

    // Decimal precision for scores
    DECIMAL_PRECISION: 1,
} as const;
