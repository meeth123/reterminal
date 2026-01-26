# reTerminal Dashboard Architecture

> **IMPORTANT**: This document is the canonical source of truth for the system architecture.
> Any changes to the architecture must be explicitly approved by the user before implementation.

## Overview

A web dashboard designed for the reTerminal E-Ink display featuring:
- Auto-rotating tab system (configurable interval, default 10 minutes)
- Google Calendar integration via Service Account
- E-Ink optimized UI (no animations/transitions)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js (Node.js) |
| Calendar API | googleapis (Service Account auth) |

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
│                    Backend (Express)                         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ /api/events  →  Calendar Service  →  Google Calendar API ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── .cursor/
│   └── rules/
│       └── architecture.mdc    # Cursor rules
├── ARCHITECTURE.md             # This file
├── server/
│   ├── index.ts                # Express server entry
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

| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_PATH` | Path to service account JSON |
| `GOOGLE_CALENDAR_ID` | Calendar ID (usually email or "primary") |
| `PORT` | Backend server port (default: 3001) |

## Adding New Tabs

1. Create a new widget component in `src/components/Widgets/`
2. Add the widget to `src/config/tabs.tsx`
3. The RotationManager will automatically include it in the rotation
