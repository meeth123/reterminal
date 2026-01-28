# reTerminal Dashboard Architecture

> **IMPORTANT**: This document is the canonical source of truth for the system architecture.
> Any changes to the architecture must be explicitly approved by the user before implementation.

## Overview

A web dashboard designed for the reTerminal E-Ink display featuring:
- Auto-rotating tab system (configurable interval, default 10 minutes)
- Google Calendar integration via OAuth 2.0
- Full attendee access (OAuth bypasses organization restrictions)
- E-Ink optimized UI (no animations/transitions)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js (Node.js) |
| Calendar API | googleapis (OAuth 2.0 auth) |
| Token Storage | Upstash Redis (via Vercel integration) |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    RotationManager                       ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    ││
│  │  │ Tab 1   │  │ Tab 2   │  │ Tab 3   │  │ ...     │    ││
│  │  │Calendar │  │ Future  │  │ Future  │  │         │    ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (fetch)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Vercel Functions)                   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ /api/events  →  OAuth Client  →  Google Calendar API     ││
│  │                      ↓ ↑                                  ││
│  │                 Upstash Redis                             ││
│  │              (OAuth token storage)                        ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

One-Time Setup (Local):
┌─────────────────────────────────────────────────────────────┐
│  oauth-setup.ts  →  Browser Auth  →  Tokens  →  Upstash     │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── .cursor/
│   └── rules/
│       └── architecture.mdc    # Cursor rules
├── ARCHITECTURE.md             # This file
├── api/                        # Vercel serverless functions
│   ├── events.ts               # Calendar events API
│   ├── static-calendar.ts      # Static HTML calendar
│   ├── static-calendar-enhanced.ts  # Enhanced calendar view
│   ├── calendar-debug.ts       # Debug endpoint
│   └── oauth-status.ts         # OAuth status check
├── lib/                        # Shared utilities
│   ├── oauth-client.ts         # OAuth authentication
│   └── types.ts                # TypeScript interfaces
├── scripts/                    # CLI scripts
│   ├── oauth-setup.ts          # One-time OAuth setup
│   └── verify-tokens.ts        # Token verification
├── server/
│   ├── index.ts                # Express server entry (local dev)
│   └── calendar.ts             # Google Calendar service
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Shell.tsx       # Main page shell
│   │   ├── Rotation/
│   │   │   └── RotationManager.tsx
│   │   └── Widgets/
│   │       └── CalendarWidget.tsx
│   ├── config/
│   │   └── tabs.tsx            # Tab configuration
│   ├── hooks/
│   │   └── useRotation.ts      # Rotation timer hook
│   └── App.tsx
├── package.json
└── .env                        # Environment variables (not committed)
```

## Key Components

### RotationManager
- Manages which tab/widget is currently visible
- Configurable rotation interval (default: 600 seconds / 10 minutes)
- Reads tab configuration from `src/config/tabs.tsx`

### Tab Configuration
Located in `src/config/tabs.tsx`:
```typescript
export const tabs = [
  { id: 'calendar', component: CalendarWidget, label: 'Calendar' },
  // Future tabs added here
];
```

### CalendarWidget
- Fetches events from `/api/events`
- Displays today's events with time and title
- Refreshes data on each tab rotation

## E-Ink Constraints

To ensure optimal display on E-Ink screens:
1. **No CSS transitions** - All transitions disabled globally
2. **No animations** - All animations disabled globally
3. **No smooth scrolling** - Instant scroll behavior
4. **High contrast** - Clear, readable typography
5. **Static refresh** - Content updates on tab rotation or manual refresh

## API Endpoints

### GET /api/events
Returns today's calendar events.

Response:
```json
{
  "events": [
    {
      "id": "string",
      "summary": "Event Title",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z",
      "location": "optional"
    }
  ],
  "date": "2024-01-15"
}
```

## Environment Variables

### Production (Vercel)
| Variable | Description |
|----------|-------------|
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_CALENDAR_ID` | Calendar ID (usually email or "primary") |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (auto-added by integration) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (auto-added by integration) |

### Local Development (Optional)
| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_PATH` | Path to service account JSON (optional fallback) |
| `PORT` | Backend server port (default: 3002) |

## OAuth 2.0 Authentication

### Token Flow
1. **One-time Setup**: Run `npm run oauth:setup` locally
   - Opens browser for Google authorization
   - Exchanges authorization code for tokens
   - Stores tokens in Upstash Redis
2. **Runtime**: API endpoints use `getOAuthCalendarClient()`
   - Loads tokens from Upstash Redis
   - Checks expiry (with 5-minute buffer)
   - Auto-refreshes if expired
   - Returns authenticated Calendar client

### Token Storage
- **Storage**: Upstash Redis (Vercel integration)
- **Key**: `google_oauth_tokens`
- **Data**: Access token, refresh token, expiry, scope
- **Security**: Refresh token never expires unless revoked
- **Refresh**: Automatic when access token expires

### Why OAuth over Service Account?
- **Attendee Access**: OAuth uses YOUR Google account permissions
- **Bypasses Restrictions**: No IT admin approval needed
- **Full Data**: Access to attendees, conference links, etc.
- **Organization Limits**: Service Accounts can't access external invites

## Adding New Tabs

1. Create a new widget component in `src/components/Widgets/`
2. Add the widget to `src/config/tabs.tsx`
3. The RotationManager will automatically include it in the rotation
