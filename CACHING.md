# Calendar API Caching

## Overview

To reduce Google Calendar API quota usage and improve response times, we've implemented a Redis-based caching layer.

## How It Works

### Cache Configuration
- **Storage**: Upstash Redis (same as OAuth tokens)
- **TTL**: 5 minutes (300 seconds)
- **Key Format**: `calendar_cache:{calendarId}:{date}`

### Cache Flow

```
Request → Check Redis Cache → Found? Return Cached Data
                            ↓
                         Not Found
                            ↓
                   Fetch from Google API
                            ↓
                    Store in Redis Cache
                            ↓
                      Return Fresh Data
```

## Benefits

### Before Caching
- Every page load = 1 API call
- Quota: 60 requests/minute
- Page refreshes quickly exhaust quota

### After Caching
- First request = 1 API call (cached for 5 minutes)
- Subsequent requests = 0 API calls (served from cache)
- **~95% reduction in API calls** for typical usage
- Calendar updates every 5 minutes (reasonable for most use cases)

## Implementation

### Files
- [`lib/calendar-cache.ts`](lib/calendar-cache.ts) - Cache utilities
- [`api/events.ts`](api/events.ts) - Events API with caching
- [`api/static-calendar-enhanced.ts`](api/static-calendar-enhanced.ts) - Enhanced calendar with caching

### Usage

```typescript
import { getCachedCalendar, setCachedCalendar, generateCacheKey } from '../lib/calendar-cache.js';

// Generate cache key
const cacheKey = generateCacheKey(calendarId, date);

// Try to get from cache
const cached = await getCachedCalendar<CalendarResponse>(cacheKey);
if (cached) {
  return cached; // Return cached data
}

// Fetch fresh data from API
const freshData = await fetchFromGoogleAPI();

// Store in cache for future requests
await setCachedCalendar(cacheKey, freshData);

return freshData;
```

## Cache Invalidation

### Automatic
- Cache entries expire after 5 minutes
- Fresh data is fetched automatically after expiry

### Manual (if needed)
To clear cache for a specific date:
```bash
# Via Redis CLI (if you have access)
redis-cli DEL calendar_cache:meeth@quizizz.com:2026-01-28
```

## Monitoring

### Cache Hit Rate
Check logs for these messages:
- `[Cache] HIT for key: {key}` - Data served from cache
- `[Cache] MISS for key: {key}` - Data fetched from API

### Expected Hit Rate
- **First 5 minutes**: Low (0-20%)
- **After 5 minutes**: High (80-95%)
- **Overall**: 90-95% for typical usage

## Tuning

### Adjust TTL
Edit `CACHE_TTL_SECONDS` in [`lib/calendar-cache.ts`](lib/calendar-cache.ts:7):

```typescript
const CACHE_TTL_SECONDS = 300; // Default: 5 minutes

// Options:
// - 60: 1 minute (more frequent updates, higher API usage)
// - 300: 5 minutes (balanced - recommended)
// - 600: 10 minutes (less API usage, less frequent updates)
// - 3600: 1 hour (minimal API usage, rare updates)
```

### Disable Caching (for debugging)
If Redis is unavailable, caching automatically falls back to direct API calls:
- Remove `UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL` from environment
- Cache functions return `null` and API is called directly

## Cost Impact

### Without Caching
- Typical usage: ~500 requests/day
- Quota: 10,000 requests/day (if increased)
- Utilization: 5%

### With Caching (5-min TTL)
- Typical usage: ~25-50 requests/day (95% reduction)
- Quota: 10,000 requests/day
- Utilization: 0.25-0.5%

**Result**: Near-zero chance of hitting quota limits

## Troubleshooting

### Issue: Seeing stale data
**Cause**: Cache TTL not expired yet
**Solution**: Wait up to 5 minutes, or increase refresh frequency by reducing TTL

### Issue: High API usage despite caching
**Cause**: Different `date` parameters generating different cache keys
**Solution**: Normal behavior - each unique date has its own cache entry

### Issue: Cache not working
**Check**:
1. Redis credentials are set in environment variables
2. Check logs for `[Cache]` messages
3. Verify Upstash Redis integration is active in Vercel

## Future Enhancements

1. **Smart Cache Warming**: Pre-cache tomorrow's events overnight
2. **Longer TTL for past dates**: Historical data doesn't change
3. **Cache tags**: Invalidate cache when user makes changes (if we add write operations)
4. **Compression**: Store gzipped responses to save Redis storage
