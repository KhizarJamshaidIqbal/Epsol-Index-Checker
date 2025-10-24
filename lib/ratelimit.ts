/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider Redis-backed solution
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number // Max requests per window
  windowMs: number // Time window in milliseconds
  burst?: number // Burst allowance (optional)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for a given identifier (e.g., user ID or IP)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    burst: 10,
  }
): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  let entry = store.get(key)

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    store.set(key, entry)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: entry.resetAt,
    }
  }

  // Check if within limit
  const maxAllowed = config.burst ? config.maxRequests + config.burst : config.maxRequests

  if (entry.count >= maxAllowed) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetAt,
    }
  }

  // Increment and allow
  entry.count++

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    reset: entry.resetAt,
  }
}

/**
 * Middleware helper to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from session (will implement after NextAuth setup)
  // For now, use IP from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

/**
 * Rate limit response helper
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}
