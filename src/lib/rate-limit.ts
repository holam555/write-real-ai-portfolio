// Simple in-memory rate limiter
// Tracks requests per IP within a sliding window

type RateLimitEntry = {
  count: number
  resetAt: number
}

const stores: Record<string, Map<string, RateLimitEntry>> = {}

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores[name]) {
    stores[name] = new Map()
  }
  return stores[name]
}

/**
 * Check if a request should be rate limited.
 * @param name - Rate limiter name (e.g., "signup", "rewrite")
 * @param key - Unique key (e.g., IP address)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(
  name: string,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const store = getStore(name)
  const now = Date.now()

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    store.forEach((v, k) => {
      if (now > v.resetAt) store.delete(k)
    })
  }

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

/**
 * Get client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  // CF-Connecting-IP is set by Cloudflare and cannot be spoofed by the client
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp
  }
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return "unknown"
}
