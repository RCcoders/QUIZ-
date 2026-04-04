import { describe, it, expect } from 'vitest';
import { PERFORMANCE_CONFIG, ANTI_CHEAT_CONFIG, SCORING_CONFIG } from './performance';

describe('PERFORMANCE_CONFIG', () => {
  it('MAX_CONCURRENT_STUDENTS is 1000', () => {
    expect(PERFORMANCE_CONFIG.MAX_CONCURRENT_STUDENTS).toBe(1000);
  });

  it('retains all other original values', () => {
    expect(PERFORMANCE_CONFIG.REALTIME_THROTTLE_MS).toBe(1000);
    expect(PERFORMANCE_CONFIG.MAX_PARTICIPANTS_DISPLAY).toBe(50);
    expect(PERFORMANCE_CONFIG.LEADERBOARD_TOP_N).toBe(10);
    expect(PERFORMANCE_CONFIG.ANSWER_BATCH_DELAY_MS).toBe(250);
    expect(PERFORMANCE_CONFIG.MAX_REALTIME_STALENESS_MS).toBe(5000);
    expect(PERFORMANCE_CONFIG.VIRTUALIZATION_THRESHOLD).toBe(30);
  });
});

describe('ANTI_CHEAT_CONFIG', () => {
  it('retains all original values', () => {
    expect(ANTI_CHEAT_CONFIG.MAX_VIOLATIONS).toBe(3);
    expect(ANTI_CHEAT_CONFIG.VIOLATION_SEVERITY.tab_switch).toBe(2);
    expect(ANTI_CHEAT_CONFIG.VIOLATION_SEVERITY.fullscreen_exit).toBe(2);
    expect(ANTI_CHEAT_CONFIG.VIOLATION_SEVERITY.copy_attempt).toBe(1);
    expect(ANTI_CHEAT_CONFIG.VIOLATION_SEVERITY.devtools_open).toBe(3);
    expect(ANTI_CHEAT_CONFIG.AUTO_FULLSCREEN).toBe(false);
    expect(ANTI_CHEAT_CONFIG.ENABLE_COPY_PROTECTION).toBe(true);
    expect(ANTI_CHEAT_CONFIG.ENABLE_TAB_DETECTION).toBe(true);
  });
});

describe('SCORING_CONFIG', () => {
  it('retains all original values', () => {
    expect(SCORING_CONFIG.BASE_POINTS).toBe(10);
    expect(SCORING_CONFIG.MAX_SPEED_BONUS).toBe(2);
    expect(SCORING_CONFIG.DECIMAL_PRECISION).toBe(1);
  });
});
