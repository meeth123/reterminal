# OAuth Token Refresh Troubleshooting

## Why Token Refresh Fails

OAuth 2.0 token refresh can fail for several reasons:

### 1. **Refresh Token Expiration**
Google refresh tokens can expire when:
- Not used for 6 months (automatic expiration)
- User revokes app access manually
- Security events (password change, suspicious activity)
- Exceeded 50 refresh token limit per user per client (older tokens get invalidated)

### 2. **Network Issues**
- Temporary network failures between Vercel and Google APIs
- API rate limiting (rare but possible)
- Timeout issues

### 3. **Implementation Issues**
- Not handling new refresh tokens returned by Google
- Missing proper error handling and retries

## Current Improvements

We've implemented several improvements to handle these issues:

### 1. **Retry Logic with Exponential Backoff**
```typescript
MAX_REFRESH_RETRIES = 3
RETRY_DELAY_MS = 1000

// Retries: 1s, 2s, 4s delays
```

### 2. **Better Error Detection**
- Detects `invalid_grant` errors (permanent failures)
- Provides clear error messages for re-authorization
- Logs detailed error information

### 3. **Token Update Handling**
- Now captures new refresh tokens when Google provides them
- Updates stored tokens after successful refresh

### 4. **Enhanced Logging**
- Shows token expiry time on load
- Logs each retry attempt
- Provides detailed error context

## Workarounds for Frequent Failures

### Option 1: Increase Token Buffer (Current: 5 minutes)
If refreshes are happening too late:

```typescript
// In lib/oauth-client.ts, line ~104
const bufferMs = 10 * 60 * 1000; // Increase to 10 minutes
```

**Trade-off**: More frequent refreshes, but less chance of using expired tokens.

### Option 2: Proactive Token Refresh
Add a scheduled task to refresh tokens before they expire:

```typescript
// Create api/cron/refresh-tokens.ts
export default async function handler(req, res) {
  const tokens = await loadTokens();
  if (tokens) {
    await refreshTokensIfNeeded(tokens);
  }
  res.status(200).json({ ok: true });
}
```

Then add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/refresh-tokens",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

**Trade-off**: Requires Vercel Pro plan for cron jobs.

### Option 3: Fallback to Cached Data
When refresh fails, serve stale cached data:

```typescript
// In api/static-calendar-enhanced.ts
try {
  const calendar = await getCalendarClient();
  // ... fetch events
} catch (error) {
  // Try to get cached data even if expired
  const staleCache = await getCachedCalendar(cacheKey, { ignoreExpiry: true });
  if (staleCache) {
    console.log('[Calendar] Using stale cache due to OAuth error');
    return staleCache;
  }
  throw error;
}
```

**Trade-off**: May show outdated data during OAuth issues.

### Option 4: Manual Re-authorization Script
Create a simple re-auth endpoint (secured):

```typescript
// api/reauth.ts
export default async function handler(req, res) {
  const secret = req.query.secret;
  if (secret !== process.env.REAUTH_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Redirect to OAuth flow
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  });

  res.redirect(authUrl);
}
```

**Trade-off**: Requires manual intervention, but quick fix.

## Best Practices

### 1. **Monitor Token Health**
Add logging to track:
- Token expiry times
- Refresh success/failure rates
- Time between refreshes

### 2. **Set Up Alerts**
Use Vercel monitoring or external service to alert when:
- Multiple refresh failures occur
- Calendar API returns errors
- No successful API calls in X hours

### 3. **Graceful Degradation**
- Show cached data when OAuth fails
- Display user-friendly error messages
- Provide re-authorization link in error UI

### 4. **Regular Re-authorization**
For production apps:
- Re-authorize every 3-6 months proactively
- Set calendar reminder to run oauth:setup
- Document the process for team members

## Quick Fix: Re-authorize Now

If tokens are failing frequently right now:

```bash
npm run oauth:setup
```

This will:
1. Open browser for Google authorization
2. Get fresh access + refresh tokens
3. Store in Redis
4. Resolve immediate issues

## Long-term Solution

Consider implementing **Option 2** (Proactive Token Refresh) + **Option 3** (Fallback to Cache) for production reliability:

1. Refresh tokens hourly via cron (prevents expiration)
2. Serve stale cache if refresh fails (maintains uptime)
3. Alert on failures (enables quick response)

This combination provides 99.9% uptime even with occasional OAuth issues.

## Need Help?

If issues persist after implementing these improvements:
1. Check Vercel logs for detailed error messages
2. Verify Google Cloud Console OAuth consent screen status
3. Ensure OAuth credentials haven't been rotated
4. Contact for support with logs
