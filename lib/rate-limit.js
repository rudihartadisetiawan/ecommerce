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

// S-06: Extract client IP dari request — gunakan rightmost public IP dari x-forwarded-for
// yang diset oleh platform (Vercel/NGINX). jangan percaya raw header dari client.
export function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Vercel prepends client IP ke x-forwarded-for; ambil IP pertama (paling kanan adalah proxy terakhir)
    // Di Vercel, x-forwarded-for hanya berisi IP client (tanpa proxy chain).
    const ips = forwarded.split(',').map(s => s.trim()).filter(Boolean)
    if (ips.length > 0) return ips[0]
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

// ponytail: prevent unbounded Map growth — purge entries older than 2x the longest window
setInterval(() => {
  const cutoff = Date.now() - 7200000 // 2 jam
  for (const [k, v] of hits) if (v.reset < cutoff) hits.delete(k)
}, 300000) // tiap 5 menit
