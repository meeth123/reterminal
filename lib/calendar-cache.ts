/**
 * Calendar Cache Layer
 * Reduces API calls by caching calendar responses in Redis
 */

import { Redis } from '@upstash/redis';

const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_KEY_PREFIX = 'calendar_cache:';

// Initialize Redis client
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn('[Cache] Redis credentials not found - caching disabled');
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Get cached calendar data
 */
export async function getCachedCalendar<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get<T>(`${CACHE_KEY_PREFIX}${cacheKey}`);
    if (cached) {
      console.log(`[Cache] HIT for key: ${cacheKey}`);
      return cached;
    }
    console.log(`[Cache] MISS for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store calendar data in cache
 */
export async function setCachedCalendar<T>(cacheKey: string, data: T): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.setex(`${CACHE_KEY_PREFIX}${cacheKey}`, CACHE_TTL_SECONDS, data);
    console.log(`[Cache] SET for key: ${cacheKey} (TTL: ${CACHE_TTL_SECONDS}s)`);
  } catch (error) {
    console.error('[Cache] Error writing cache:', error);
  }
}

/**
 * Generate cache key for calendar requests
 */
export function generateCacheKey(calendarId: string, date: string): string {
  return `${calendarId}:${date}`;
}
