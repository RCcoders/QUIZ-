/**
 * Property-based tests for TanStack Query caching behaviour.
 *
 * Property 6: TanStack Query caches results within stale time
 * Validates: Requirements 9.2, 9.3
 *
 * For any query key, if the same query is issued twice within the stale time
 * window, the fetchFn should be called exactly once — the second call is
 * served from cache.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';

/** Create a fresh QueryClient with a 60-second stale time for each test run. */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false, // disable retries so failures surface immediately
        gcTime: Infinity, // keep cache entries alive for the duration of the test
      },
    },

  });
}

describe('queryCache — Property 6: TanStack Query caches results within stale time', () => {
  /**
   * Property 6: For any query key (arbitrary string), fetching the same key
   * twice within the stale time window calls the fetchFn exactly once.
   *
   * Validates: Requirements 9.2, 9.3
   */
  it('Property 6: fetchFn is called exactly once for repeated fetches within stale time', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary query keys: either a plain string or an array of strings
        fc.oneof(
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 })
        ),
        async (rawKey) => {
          const queryClient = createTestQueryClient();
          const queryKey = Array.isArray(rawKey) ? rawKey : [rawKey];

          const fetchFn = vi.fn().mockResolvedValue({ data: 'test-result' });

          // First fetch — should call fetchFn
          await queryClient.fetchQuery({ queryKey, queryFn: fetchFn });

          // Second fetch within stale time — should be served from cache
          await queryClient.fetchQuery({ queryKey, queryFn: fetchFn });

          const callCount = fetchFn.mock.calls.length;

          // Clean up to avoid state leakage between iterations
          queryClient.clear();

          return callCount === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Concrete example: a simple string key fetched twice returns cached result.
   */
  it('concrete example: string key fetched twice calls fetchFn once', async () => {
    const queryClient = createTestQueryClient();
    const fetchFn = vi.fn().mockResolvedValue(['quiz-1', 'quiz-2']);

    await queryClient.fetchQuery({ queryKey: ['quizzes', 'teacher-uid-123'], queryFn: fetchFn });
    await queryClient.fetchQuery({ queryKey: ['quizzes', 'teacher-uid-123'], queryFn: fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  /**
   * Concrete example: different query keys each trigger their own fetch.
   */
  it('concrete example: different keys each call fetchFn independently', async () => {
    const queryClient = createTestQueryClient();
    const fetchFn = vi.fn().mockResolvedValue([]);

    await queryClient.fetchQuery({ queryKey: ['quizzes', 'user-a'], queryFn: fetchFn });
    await queryClient.fetchQuery({ queryKey: ['quizzes', 'user-b'], queryFn: fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  /**
   * Concrete example: cached data is the same object returned on second fetch.
   */
  it('concrete example: second fetch returns the cached data value', async () => {
    const queryClient = createTestQueryClient();
    const result = { quizzes: ['quiz-a'] };
    const fetchFn = vi.fn().mockResolvedValue(result);

    const first = await queryClient.fetchQuery({ queryKey: ['quizzes'], queryFn: fetchFn });
    const second = await queryClient.fetchQuery({ queryKey: ['quizzes'], queryFn: fetchFn });

    expect(first).toEqual(result);
    expect(second).toEqual(result);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
