import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('rateLimit - cleanup interval', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  it('sets up cleanup interval that does not throw', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')

    // Import starts the setInterval
    const { rateLimit } = await import('../lib/rate-limit.js')

    // Use the rate limiter
    expect(rateLimit('cleanup-test', 5, 60000)).toBe(true)

    // Advance time past the cleanup interval (5 min = 300000ms)
    vi.advanceTimersByTime(300000)

    // Should still work
    expect(rateLimit('cleanup-test-2', 5, 60000)).toBe(true)
  })

  it('handles edge case of same-key rapid calls at limit boundary', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')
    const { rateLimit } = await import('../lib/rate-limit.js')

    // Exactly at limit
    for (let i = 0; i < 3; i++) expect(rateLimit('boundary', 3, 60000)).toBe(true)
    expect(rateLimit('boundary', 3, 60000)).toBe(false) // Exceeded
  })
})
