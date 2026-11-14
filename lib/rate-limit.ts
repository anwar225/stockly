/**
 * Rate limiting utility for API endpoints
 * Uses Upstash Redis for distributed rate limiting in production
 * Falls back to secure rejection if Redis is unavailable in production
 */

import { isIP } from 'node:net'

// Try to import Upstash dependencies (must be installed separately)
let Ratelimit: any = null
let Redis: any = null
let redis: any = null
let ratelimit: any = null

let isUpstashAvailable = false
let upstashLoadError: Error | null = null

try {
  const upstashModule = require('@upstash/ratelimit')
  const redisModule = require('@upstash/redis')
  
  Ratelimit = upstashModule.Ratelimit
  Redis = redisModule.Redis
  
  // Initialize Redis client if environment variables are present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    // Initialize rate limiter
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
      analytics: true,
    })
    
    isUpstashAvailable = true
  }
} catch (error) {
  upstashLoadError = error instanceof Error ? error : new Error(String(error))
  console.warn('Upstash dependencies not available:', upstashLoadError.message)
}

// In-memory store for development fallback (must be persistent across calls)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const inMemoryStore = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address)
 * @param limit - Maximum number of requests allowed
 * @param window - Time window in milliseconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  window: number = 3600000 // 1 hour default
): Promise<RateLimitResult> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Production: Require Upstash Redis
  if (isProduction) {
    if (!isUpstashAvailable) {
      console.error('Production environment requires Upstash Redis for rate limiting')
      throw new Error('RATE_LIMITING_UNAVAILABLE')
    }
    
    if (!ratelimit) {
      console.error('Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
      throw new Error('RATE_LIMITING_UNCONFIGURED')
    }
    
    try {
      const { success, limit: upstashLimit, remaining, reset } = await ratelimit.limit(identifier)
      
      return {
        success,
        limit: upstashLimit,
        remaining,
        reset: reset ?? Date.now() + window,
      }
    } catch (error) {
      console.error('Redis rate limiting error:', error)
      // In production, reject requests if rate limiting fails
      throw new Error('RATE_LIMITING_ERROR')
    }
  }
  
  // Development: Use in-memory fallback (not suitable for production)
  const now = Date.now()
  const resetTime = now + window
  
  // Clean up expired entries before checking (lazy cleanup)
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetTime < now) {
      inMemoryStore.delete(key)
    }
  }
  
  let entry = inMemoryStore.get(identifier)
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime,
    }
    inMemoryStore.set(identifier, entry)
  }
  
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    }
  }
  
  entry.count++
  inMemoryStore.set(identifier, entry)
  
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  }
}

/**
 * Get client IP address from request headers
 * Follows Vercel's documented behavior with strict validation:
 * - x-forwarded-for contains the client's public IP address
 * - Vercel overwrites this header to prevent spoofing
 * - x-real-ip is identical to x-forwarded-for
 * - Headers are set by Vercel, not client-controllable
 * 
 * Strict rules:
 * - If both headers present: both must be non-empty, valid, and identical
 * - If only x-real-ip present: must be non-empty and valid
 * - If only x-forwarded-for present: must be non-empty and valid
 * - If neither present: reject
 * - Never extract from comma-separated values
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  const hasForwardedFor = forwardedFor !== null
  const hasRealIp = realIp !== null

  // Case 1: Both headers present (even if empty)
  if (hasForwardedFor && hasRealIp) {
    const trimmedForwarded = forwardedFor!.trim()
    const trimmedReal = realIp!.trim()

    // Both must be non-empty
    if (!trimmedForwarded || !trimmedReal) {
      return 'reject'
    }

    // Both must be valid IPs
    if (isIP(trimmedForwarded) === 0 || isIP(trimmedReal) === 0) {
      return 'reject'
    }

    // Both must be identical
    if (trimmedForwarded !== trimmedReal) {
      return 'reject'
    }

    return trimmedReal
  }

  // Case 2: Only x-real-ip present
  if (hasRealIp) {
    const trimmed = realIp!.trim()

    // Must be non-empty and valid
    if (!trimmed || isIP(trimmed) === 0) {
      return 'reject'
    }

    return trimmed
  }

  // Case 3: Only x-forwarded-for present
  if (hasForwardedFor) {
    const trimmed = forwardedFor!.trim()

    // Must be non-empty and valid
    if (!trimmed || isIP(trimmed) === 0) {
      return 'reject'
    }

    return trimmed
  }

  // Case 4: Neither header present
  return 'reject'
}
export function isRateLimitingAvailable(): boolean {
  return isUpstashAvailable && ratelimit !== null
}

/**
 * Get Upstash configuration status
 */
export function getRateLimitingStatus(): {
  available: boolean
  configured: boolean
  error: string | null
} {
  return {
    available: isUpstashAvailable,
    configured: ratelimit !== null,
    error: upstashLoadError ? upstashLoadError.message : null,
  }
}
