# OAuth 2.0 Setup Guide

This guide walks you through setting up OAuth 2.0 authentication for the reTerminal Calendar to access full attendee information.

## Why OAuth 2.0?

Service Account authentication was blocked by your IT admin from accessing attendees outside your organization. OAuth 2.0 uses YOUR Google account credentials, giving you access to everything you can see in Google Calendar, including:
- ✅ Full attendee lists
- ✅ Conference links (Meet/Zoom)
- ✅ Room information
- ✅ External guests

---

## Prerequisites

- Node.js and npm installed
- Access to Google Cloud Console
- Access to Vercel dashboard
- Your Google account (meeth@quizizz.com)

---

## Step 1: Setup Upstash Redis in Vercel

OAuth tokens need persistent storage. Upstash Redis is Vercel's official solution.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `reterminal` project
3. Click **Integrations** tab
4. Search for **"Upstash Redis"**
5. Click **Add Integration**
6. Create a new database:
   - Name: `reterminal-oauth-tokens`
   - Region: Choose closest to your location
7. Connect to `reterminal` project
8. Vercel automatically adds these environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

✅ **Done!** Redis is now configured.

---

## Step 2: Create OAuth 2.0 Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click project dropdown → **New Project**
   - Name: `reTerminal Calendar`
   - Click **Create**
   - Select the new project

3. **Enable Calendar API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google Calendar API"
   - Click **Enable**

4. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - User Type: **Internal** (since meeth@quizizz.com is Google Workspace)
   - Click **Create**

   Fill in the form:
   - App name: `reTerminal Calendar`
   - User support email: `meeth@quizizz.com`
   - Developer contact: `meeth@quizizz.com`

   Click **Save and Continue**

   Add Scopes:
   - Click **Add or Remove Scopes**
   - Search for: `https://www.googleapis.com/auth/calendar.events`
   - Check the box
   - Click **Update** → **Save and Continue**

   Test Users:
   - Add `meeth@quizizz.com`
   - Click **Save and Continue**

   Click **Back to Dashboard**

5. **Create OAuth Client ID**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `reTerminal OAuth Client`
   - Authorized redirect URIs:
     - Click **Add URI**
     - Enter: `http://localhost:3000/oauth/callback`
   - Click **Create**

6. **Download Credentials**
   - A popup shows your client ID and secret
   - Click **Download JSON** (optional - for backup)
   - Copy the **Client ID** and **Client Secret**

✅ **Done!** OAuth credentials created.

---

## Step 3: Add Credentials to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `reterminal` project
3. Click **Settings** → **Environment Variables**
4. Add these variables (one at a time):

   | Name | Value |
   |------|-------|
   | `GOOGLE_OAUTH_CLIENT_ID` | Paste your client ID |
   | `GOOGLE_OAUTH_CLIENT_SECRET` | Paste your client secret |
   | `GOOGLE_CALENDAR_ID` | `meeth@quizizz.com` |

5. Click **Save** for each

✅ **Done!** Credentials added to Vercel.

---

## Step 4: Add Credentials Locally

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add these lines:

```bash
# Google Calendar OAuth
GOOGLE_CALENDAR_ID=meeth@quizizz.com
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

# Upstash Redis (copy from Vercel dashboard)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Local dev
PORT=3002
```

Get the Redis credentials from Vercel:
- Go to Vercel → Settings → Environment Variables
- Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

✅ **Done!** Local environment configured.

---

## Step 5: Run OAuth Setup

This is a **one-time** process that authorizes your Google account.

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run the OAuth setup script**:
   ```bash
   npm run oauth:setup
   ```

3. **What happens**:
   - Script starts a local server on port 3000
   - Opens your browser automatically
   - Google asks you to authorize "reTerminal Calendar"
   - You'll see which permissions it's requesting
   - Click **Allow**
   - Browser shows "Authorization successful!"
   - Script stores tokens in Upstash Redis
   - Script exits

4. **If browser doesn't open**:
   - Script prints a URL in the terminal
   - Copy and paste it into your browser manually

✅ **Done!** OAuth tokens stored in Redis.

---

## Step 6: Verify OAuth Setup

Run the verification script to ensure everything works:

```bash
npm run oauth:verify
```

**Expected output:**
```
═══════════════════════════════════════════════
     OAuth Token Verification
═══════════════════════════════════════════════

1️⃣  Checking Redis connection...
   ✅ Redis credentials configured

2️⃣  Checking if tokens exist...
   ✅ Tokens found in Redis
   📝 Access token: ya29.a0AXooCgs...
   🔄 Refresh token: 1//0gFZ9K8N...
   ⏰ Access token expires in 58 minutes

3️⃣  Testing Calendar API access...
   📅 Fetching events from calendar: meeth@quizizz.com
   ✅ Calendar API access working
   📊 Found 1 upcoming event(s)

4️⃣  Testing attendee data access...
   ✅ Attendee data accessible!
   📊 Found event: "Team Sync"
   👥 Attendees: 10 people
      - john@quizizz.com: accepted
      - sarah@quizizz.com: accepted
      - mike@quizizz.com: needsAction
      ... and 7 more

═══════════════════════════════════════════════
✅ All checks passed!

Your OAuth setup is working correctly.
Attendee data will now be accessible in your calendar.
═══════════════════════════════════════════════
```

✅ **Done!** OAuth is working!

---

## Step 7: Deploy to Vercel

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Add OAuth 2.0 authentication for Calendar API"
   git push
   ```

2. **Vercel auto-deploys** (if connected to GitHub)

3. **Check OAuth status** in production:
   - Visit: `https://reterminal.vercel.app/api/oauth-status`
   - Should show:
     ```json
     {
       "authenticated": true,
       "expiresAt": "2026-01-28T12:00:00Z",
       "expiresInMinutes": 58,
       "calendarAccess": true,
       "attendeeAccess": true
     }
     ```

4. **Test calendar endpoint**:
   - Visit: `https://reterminal.vercel.app/api/events`
   - Events should now show `"attendees": 10` (not 0!)

✅ **Done!** OAuth working in production!

---

## Troubleshooting

### Issue: "OAuth tokens not found"
**Solution:** Run `npm run oauth:setup` again

### Issue: "Redis credentials not found"
**Solution:** Check Vercel environment variables include `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Issue: "Calendar access failed"
**Solution:**
1. Check `GOOGLE_CALENDAR_ID` is correct
2. Ensure you authorized the correct Google account
3. Run `npm run oauth:setup` again

### Issue: "Attendee data still shows 0"
**Solution:**
1. Verify OAuth setup: `npm run oauth:verify`
2. Check the event actually has attendees in Google Calendar
3. Ensure scope includes `calendar.events` (not just `calendar.readonly`)

### Issue: Browser shows "Access blocked"
**Solution:**
1. Make sure OAuth consent screen is configured
2. Add your email as a test user
3. For Internal apps, ensure you're using your Google Workspace account

### Issue: "Failed to refresh tokens"
**Solution:** Tokens may have been revoked. Run `npm run oauth:setup` again.

---

## Token Management

### Token Lifecycle
- **Access Token**: Expires after ~1 hour
- **Refresh Token**: Never expires (unless revoked)
- **Auto-Refresh**: Happens automatically when access token expires
- **Manual Refresh**: Not needed, handled by `lib/oauth-client.ts`

### Re-authorization
Only needed if:
- You revoke access in Google Account settings
- You change OAuth scopes
- Refresh token is invalidated

To re-authorize: `npm run oauth:setup`

### Check Token Status
Anytime: `npm run oauth:verify`

---

## Security Notes

1. **Client Secret**: Stored in Vercel environment variables (encrypted)
2. **Tokens**: Stored in Upstash Redis (encrypted at rest)
3. **Scope**: Read-only access to calendar events
4. **No Write Access**: OAuth only grants read permissions
5. **Single User**: Tokens tied to your Google account only
6. **Revocation**: You can revoke access anytime in Google Account settings

---

## Summary

✅ **What we accomplished:**
1. Replaced Service Account with OAuth 2.0
2. Tokens stored in Upstash Redis
3. Automatic token refresh
4. Full attendee access (no IT admin restrictions)
5. One-time setup process
6. Production-ready deployment

✅ **What you gained:**
- See attendee counts (previously showed 0)
- Access conference links (Meet, Zoom)
- View external guests (outside org)
- No IT admin approval needed

---

## Need Help?

- **OAuth Status**: `https://reterminal.vercel.app/api/oauth-status`
- **Verify Tokens**: `npm run oauth:verify`
- **Debug Calendar**: `https://reterminal.vercel.app/api/calendar-debug`
- **Re-authorize**: `npm run oauth:setup`
