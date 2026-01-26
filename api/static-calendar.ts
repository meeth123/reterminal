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
  console.log('=== Static Calendar Request ===');
  console.log('Query params:', req.query);
  console.log('User Agent:', req.headers['user-agent']);

  try {
    const date = (req.query.date as string) || getTodayString();
    console.log('Fetching events for date:', date);

    const { events } = await getCalendarEvents(date);
    console.log('Successfully fetched events:', events.length);

    const html = `<!DOCTYPE html>
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
    ${events.length} event${events.length !== 1 ? 's' : ''} • Generated ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating static calendar:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=800, height=480">
  <title>Calendar Error</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      text-align: center;
      background: #fee;
    }
    h1 { color: #dc2626; margin-bottom: 20px; }
    .error { background: white; padding: 20px; border-radius: 8px; margin: 20px; }
    pre { text-align: left; background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Error Loading Calendar</h1>
  <div class="error">
    <p><strong>Error message:</strong></p>
    <pre>${error instanceof Error ? escapeHtml(error.message) : 'Unknown error'}</pre>
    ${error instanceof Error && error.stack ? `
      <p><strong>Stack trace:</strong></p>
      <pre>${escapeHtml(error.stack)}</pre>
    ` : ''}
  </div>
</body>
</html>
    `);
  }
}
