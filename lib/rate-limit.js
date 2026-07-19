// ponytail: in-memory rate limiter, single-instance only.
// Upgrade ke Redis-based kalau deploy multi-instance atau traffic naik.
const hits = new Map()

// ponytail: bypass rate limit in test/dev — set NODE_ENV=test or pass SKIP_RATE_LIMIT=1
const skip = process.env.SKIP_RATE_LIMIT === '1' || process.env.NODE_ENV === 'test'

export function rateLimit(key, max = 5, windowMs = 60000) {
  if (skip) return true
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now - entry.reset > windowMs) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// ponytail: prevent unbounded Map growth — purge entries older than 2x the longest window
setInterval(() => {
  const cutoff = Date.now() - 7200000 // 2 jam
  for (const [k, v] of hits) if (v.reset < cutoff) hits.delete(k)
}, 300000) // tiap 5 menit
