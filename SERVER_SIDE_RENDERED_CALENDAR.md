# Server-Side Rendered Calendar for SenseCraft HMI

This guide shows you how to create a server-side rendered version of your calendar that works with SenseCraft HMI's screenshot-based Web function.

## Why Server-Side Rendering?

As we discovered, SenseCraft HMI doesn't run JavaScript on the device. Instead, it:
1. Fetches your web page on **their servers**
2. Takes a **screenshot** using a headless browser
3. Converts it to the 6-color e-ink palette
4. Sends the image to your device

This means:
- ❌ Client-side JavaScript (React, fetch, etc.) doesn't work
- ✅ Server-rendered HTML with inline styles works perfectly
- ✅ You can keep using HTML/CSS (familiar workflow)
- ✅ No firmware flashing required

---

## Architecture

```
┌──────────────────────┐
│  SenseCraft Cloud    │
│                      │
│  1. Fetch URL        │
│  2. Render in        │
│     headless browser │
│  3. Screenshot       │
│  4. Convert to       │
│     6-color palette  │
└──────────┬───────────┘
           │
           ↓ (send image)
┌──────────────────────┐
│  reTerminal E1002    │
│  (displays image)    │
└──────────────────────┘
```

Your server generates HTML with today's events **at request time**.

---

## Implementation Steps

### Step 1: Create Server-Side Rendered Route

We'll add a new endpoint that renders a complete HTML page with events.

Create a new file `server/static-calendar.ts`:

```typescript
import express from 'express';
import { getCalendarEvents } from './calendar.js';

export const staticCalendarRouter = express.Router();

function getTodayString(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatTime(isoString: string, allDay: boolean): string {
  if (allDay) return 'All Day';

  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

staticCalendarRouter.get('/static-calendar', async (req, res) => {
  try {
    const date = req.query.date as string || getTodayString();
    const { events } = await getCalendarEvents(date);

    // Generate complete HTML page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=800, height=480">
  <title>Calendar - ${formatDateHeader(date)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 800px;
      height: 480px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      padding: 20px;
      overflow: hidden;
    }

    .header {
      border-bottom: 3px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .title {
      font-size: 28px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 18px;
      color: #475569;
    }

    .events {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 360px;
      overflow: hidden;
    }

    .event {
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      gap: 16px;
    }

    .event-time {
      flex-shrink: 0;
      width: 120px;
    }

    .event-time-main {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
    }

    .event-time-end {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .event-details {
      flex: 1;
    }

    .event-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .event-location {
      font-size: 14px;
      color: #475569;
    }

    .no-events {
      text-align: center;
      padding: 60px 20px;
    }

    .no-events-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .no-events-text {
      font-size: 20px;
      color: #64748b;
      font-weight: 600;
    }

    .footer {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${formatDateHeader(date)}</div>
    <div class="subtitle">Your Schedule</div>
  </div>

  ${events.length === 0 ? `
    <div class="no-events">
      <div class="no-events-icon">✓</div>
      <div class="no-events-text">No events scheduled</div>
    </div>
  ` : `
    <div class="events">
      ${events.map(event => `
        <div class="event">
          <div class="event-time">
            <div class="event-time-main">${formatTime(event.start, event.allDay)}</div>
            ${!event.allDay ? `<div class="event-time-end">to ${formatTime(event.end, false)}</div>` : ''}
          </div>
          <div class="event-details">
            <div class="event-title">${escapeHtml(event.summary)}</div>
            ${event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `}

  <div class="footer">
    ${events.length} event${events.length !== 1 ? 's' : ''} • Generated at ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating static calendar:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Calendar Error</title>
  <style>
    body { font-family: Arial; padding: 40px; text-align: center; }
    h1 { color: #dc2626; }
  </style>
</head>
<body>
  <h1>Error Loading Calendar</h1>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
</body>
</html>
    `);
  }
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Step 2: Register the Route

Update `server/index.ts`:

```typescript
import express from 'express';
import { calendarRouter } from './calendar.js';
import { staticCalendarRouter } from './static-calendar.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// API routes
app.use('/api', calendarRouter);

// Static calendar route for SenseCraft HMI
app.use(staticCalendarRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Step 3: Create Vercel Serverless Function

Create `api/static-calendar.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCalendarEvents } from '../server/calendar';

function getTodayString(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatTime(isoString: string, allDay: boolean): string {
  if (allDay) return 'All Day';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = (req.query.date as string) || getTodayString();
    const { events } = await getCalendarEvents(date);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=800, height=480">
  <title>Calendar - ${formatDateHeader(date)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 800px;
      height: 480px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      padding: 20px;
      overflow: hidden;
    }
    .header {
      border-bottom: 3px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 18px;
      color: #475569;
    }
    .events {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 360px;
      overflow: hidden;
    }
    .event {
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      gap: 16px;
    }
    .event-time {
      flex-shrink: 0;
      width: 120px;
    }
    .event-time-main {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
    }
    .event-time-end {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .event-details {
      flex: 1;
    }
    .event-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .event-location {
      font-size: 14px;
      color: #475569;
    }
    .no-events {
      text-align: center;
      padding: 60px 20px;
    }
    .no-events-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .no-events-text {
      font-size: 20px;
      color: #64748b;
      font-weight: 600;
    }
    .footer {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${formatDateHeader(date)}</div>
    <div class="subtitle">Your Schedule</div>
  </div>

  ${events.length === 0 ? `
    <div class="no-events">
      <div class="no-events-icon">✓</div>
      <div class="no-events-text">No events scheduled</div>
    </div>
  ` : `
    <div class="events">
      ${events.map(event => `
        <div class="event">
          <div class="event-time">
            <div class="event-time-main">${formatTime(event.start, event.allDay)}</div>
            ${!event.allDay ? `<div class="event-time-end">to ${formatTime(event.end, false)}</div>` : ''}
          </div>
          <div class="event-details">
            <div class="event-title">${escapeHtml(event.summary)}</div>
            ${event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `}

  <div class="footer">
    ${events.length} event${events.length !== 1 ? 's' : ''} • Generated ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html><body style="font-family: Arial; padding: 40px; text-align: center;">
        <h1 style="color: #dc2626;">Error Loading Calendar</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </body></html>
    `);
  }
}
```

### Step 4: Test Locally

```bash
# Start the dev server
npm run dev:server

# Visit in browser
open http://localhost:3001/static-calendar
```

You should see a fully rendered calendar page with today's events.

### Step 5: Deploy to Vercel

```bash
git add -A
git commit -m "Add server-side rendered calendar for SenseCraft HMI"
git push
```

Vercel will automatically deploy. The page will be available at:
`https://reterminal.vercel.app/api/static-calendar`

### Step 6: Configure SenseCraft HMI

1. Go to https://sensecraft.seeed.cc/hmi
2. Select your device
3. Choose **Web Function**
4. Enter URL: `https://reterminal.vercel.app/api/static-calendar`
5. Click **Preview** to see how it looks
6. Configure refresh interval (e.g., every 2 hours)
7. Click **Deploy** to send to your device

---

## Customization Options

### Change Date
Add query parameter to show different dates:
```
https://reterminal.vercel.app/api/static-calendar?date=2026-01-27
```

### Adjust for E-Ink Display

The 6-color e-ink palette is:
- Black
- White
- Red
- Yellow
- Blue
- Green
- Orange

Optimize your colors for better display:

```css
/* Use pure colors that map well to e-ink */
.event {
  background: white;  /* Will stay white */
  border: 2px solid #000;  /* Will be black */
}

.event-title {
  color: #000;  /* Black */
}

.important-event {
  border-left: 4px solid #dc2626;  /* Will map to red */
}
```

### Add More Information

You can add weather, tasks, etc. by extending the HTML:

```html
<div class="widgets">
  <div class="weather">
    🌤️ 28°C Partly Cloudy
  </div>
  <div class="tasks">
    ✓ 3/5 tasks complete
  </div>
</div>
```

---

## Advantages vs ESPHome

| Feature | SSR (This Approach) | ESPHome |
|---------|---------------------|---------|
| **Setup complexity** | Easy | Hard |
| **Familiar workflow** | HTML/CSS | ESPHome YAML + C++ |
| **Firmware flashing** | Not needed | Required |
| **Update frequency** | SenseCraft controlled | Device controlled |
| **Button support** | Limited | Full control |
| **Styling flexibility** | Excellent | Limited |
| **Real-time updates** | No (periodic only) | Yes |
| **Dependency** | SenseCraft cloud | None |

---

## Refresh Configuration in SenseCraft HMI

In the SenseCraft HMI interface, you can configure:

1. **Manual refresh**: Click refresh button when needed
2. **Periodic refresh**: Every 1, 2, 4, or 6 hours
3. **Schedule**: Refresh at specific times (e.g., 6 AM, 12 PM, 6 PM)

The device will automatically fetch the latest data at these intervals.

---

## Troubleshooting

### Page looks wrong on device
- Visit the URL in your desktop browser first
- Use browser dev tools to set viewport to 800x480
- Test with SenseCraft's Preview function before deploying

### Events not showing
- Check Vercel logs for errors
- Test the API endpoint directly: `/api/events?date=2026-01-26`
- Verify Google Calendar credentials are set in Vercel environment variables

### Colors look weird on e-ink
- Use only solid colors (avoid gradients)
- Stick to the 6-color palette when possible
- Test with Preview to see actual rendering

### Display doesn't update
- Check SenseCraft HMI refresh settings
- Manually trigger refresh from SenseCraft interface
- Verify device has internet connectivity

---

## Next Steps

1. **Test the static calendar page** - Make sure it renders correctly
2. **Deploy to Vercel** - Push changes and verify deployment
3. **Configure SenseCraft HMI** - Set up the web function
4. **Test on device** - Verify it displays correctly
5. **Adjust styling** - Optimize for the 6-color e-ink display
6. **Set refresh schedule** - Configure automatic updates

---

## Hybrid Approach

You can use BOTH approaches:

1. **SSR calendar with SenseCraft HMI** - Quick to set up, works immediately
2. **ESPHome with full control** - Flash later when you want button control and real-time updates

The SSR version gives you a working solution today while you work on the ESPHome integration.

---

## Comparison with Current Approach

| Your Current App | This SSR Version | ESPHome Version |
|------------------|------------------|-----------------|
| React SPA | Static HTML | Native Display Code |
| Client-side JS | No JS needed | C++/Lambda |
| Won't work with SenseCraft | ✅ Works perfectly | ✅ Works independently |
| Auto-refresh (useless) | Server-side refresh | Device-side refresh |
| Touch UI (unusable) | No interaction | Hardware buttons |

---

This approach gives you a working calendar display with minimal changes to your existing code!
