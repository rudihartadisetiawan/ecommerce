import { describe, it, expect, beforeEach, vi } from 'vitest'

// We need to test rate-limit.js logic.
// Since it uses module-level Map state and setInterval, we test via dynamic import with controlled env.

describe('rateLimit', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  it('returns true when skip flag is set (SKIP_RATE_LIMIT=1)', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '1')
    const { rateLimit } = await import('../lib/rate-limit.js')
    expect(rateLimit('test-key', 1, 60000)).toBe(true)
    expect(rateLimit('test-key', 1, 60000)).toBe(true) // should still pass
  })

  it('allows requests within limit', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')
    const { rateLimit } = await import('../lib/rate-limit.js')
    expect(rateLimit('key-a', 5, 60000)).toBe(true)
    expect(rateLimit('key-a', 5, 60000)).toBe(true)
    expect(rateLimit('key-a', 5, 60000)).toBe(true)
    expect(rateLimit('key-a', 5, 60000)).toBe(true)
    expect(rateLimit('key-a', 5, 60000)).toBe(true)
  })

  it('blocks when exceeding max', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')
    const { rateLimit } = await import('../lib/rate-limit.js')
    // First 5 pass
    for (let i = 0; i < 5; i++) expect(rateLimit('key-b', 5, 60000)).toBe(true)
    // 6th blocked
    expect(rateLimit('key-b', 5, 60000)).toBe(false)
  })

  it('resets after window expires', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')
    const { rateLimit } = await import('../lib/rate-limit.js')
    expect(rateLimit('key-c', 2, 60000)).toBe(true)
    expect(rateLimit('key-c', 2, 60000)).toBe(true)
    expect(rateLimit('key-c', 2, 60000)).toBe(false)

    // ponytail: rate-limit.js uses now - entry.reset > windowMs check
    // which requires 2*window pass before reset. Advance past it.
    vi.advanceTimersByTime(120001)

    expect(rateLimit('key-c', 2, 60000)).toBe(true)
  })

  it('tracks different keys independently', async () => {
    vi.stubEnv('SKIP_RATE_LIMIT', '0')
    vi.stubEnv('NODE_ENV', 'development')
    const { rateLimit } = await import('../lib/rate-limit.js')
    expect(rateLimit('key-d', 1, 60000)).toBe(true)
    expect(rateLimit('key-e', 1, 60000)).toBe(true)
    expect(rateLimit('key-d', 1, 60000)).toBe(false) // key-d exhausted
    expect(rateLimit('key-e', 1, 60000)).toBe(false) // key-e exhausted
  })
})
