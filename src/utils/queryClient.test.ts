/**
 * Unit tests for QueryClient configuration.
 *
 * Validates: Requirements 9.2, 9.4
 */

import { describe, it, expect } from 'vitest'
import { queryClient } from '../lib/queryClient'

describe('QueryClient configuration', () => {
  it('has a default staleTime of at least 60000 ms', () => {
    const staleTime = queryClient.getDefaultOptions().queries?.staleTime
    expect(typeof staleTime).toBe('number')
    expect(staleTime as number).toBeGreaterThanOrEqual(60_000)
  })

  it('has a default retry count of 2', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry
    expect(retry).toBe(2)
  })
})
