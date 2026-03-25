/**
 * Property-based tests for TanStack Query retry behaviour.
 *
 * Property 7: TanStack Query retries failing queries exactly 2 times
 * Validates: Requirements 9.4
 *
 * For any failing Firestore query, TanStack Query should retry the request
 * exactly 2 times before surfacing an error to the component — meaning the
 * fetchFn is called exactly 3 times total (1 initial + 2 retries).
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';

/** Create a fresh QueryClient with retry: 2 and retryDelay: 0 for fast tests. */
function createRetryQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: 0,
        gcTime: Infinity,
      },
    },
  });
}

describe('queryRetry — Property 7: TanStack Query retries failing queries exactly 2 times', () => {
  /**
   * Property 7: For any query key (arbitrary string), a fetchFn that always
   * rejects should be called exactly 3 times (1 initial + 2 retries) before
   * the query enters error state.
   *
   * Validates: Requirements 9.4
   */
  it('Property 7: fetchFn is called exactly 3 times (1 initial + 2 retries) before error state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (key) => {
          const queryClient = createRetryQueryClient();
          const queryKey = [key];
          const error = new Error('fetch failed');
          const fetchFn = vi.fn().mockRejectedValue(error);

          let caughtError: unknown = null;
          try {
            await queryClient.fetchQuery({ queryKey, queryFn: fetchFn });
          } catch (e) {
            caughtError = e;
          }

          const callCount = fetchFn.mock.calls.length;

          // Verify the query is in error state
          const queryState = queryClient.getQueryState(queryKey);

          queryClient.clear();

          return (
            callCount === 3 &&
            caughtError !== null &&
            queryState?.status === 'error'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Concrete example: a fetchFn that always rejects is called exactly 3 times.
   */
  it('concrete example: always-failing fetchFn is called exactly 3 times', async () => {
    const queryClient = createRetryQueryClient();
    const fetchFn = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(
      queryClient.fetchQuery({ queryKey: ['quizzes', 'teacher-1'], queryFn: fetchFn })
    ).rejects.toThrow('network error');

    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  /**
   * Concrete example: query enters error state after exhausting retries.
   */
  it('concrete example: query state is error after all retries are exhausted', async () => {
    const queryClient = createRetryQueryClient();
    const fetchFn = vi.fn().mockRejectedValue(new Error('firestore unavailable'));

    try {
      await queryClient.fetchQuery({ queryKey: ['sessions'], queryFn: fetchFn });
    } catch {
      // expected
    }

    const state = queryClient.getQueryState(['sessions']);
    expect(state?.status).toBe('error');
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
});
