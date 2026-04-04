import { describe, it, expect } from 'vitest';
import { buildCacheKey } from './cacheKey.js';

describe('buildCacheKey', () => {
  it('returns exactly the same hash for same inputs in different key orders', () => {
    const params1 = { topic: 'Math', difficulty: 'easy', count: 5 };
    const params2 = { count: 5, topic: 'Math', difficulty: 'easy' };

    const key1 = buildCacheKey(params1);
    const key2 = buildCacheKey(params2);

    expect(key1).toBe(key2);
  });

  it('returns different hash for different inputs', () => {
    const params1 = { topic: 'Math', difficulty: 'easy', count: 5 };
    const params2 = { topic: 'Science', difficulty: 'easy', count: 5 };

    const key1 = buildCacheKey(params1);
    const key2 = buildCacheKey(params2);

    expect(key1).not.toBe(key2);
  });
});
