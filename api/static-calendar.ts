import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendar_v3 } from 'googleapis';
import { getOAuthCalendarClient } from '../lib/oauth-client';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  allDay: boolean;
  description?: string;
  attendees?: number;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: {
      name?: string;
    };
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
      label?: string;
    }>;
  };
  hangoutLink?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  date: string;
}

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  // Use OAuth 2.0 authentication
  // Tokens are stored in Upstash Redis and automatically refreshed
  return await getOAuthCalendarClient();
}

async function getEventsForDate(dateStr?: string): Promise<CalendarResponse> {
  console.log('[StaticCalendar] getEventsForDate called with dateStr:', dateStr);

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  console.log('[StaticCalendar] Using calendarId:', calendarId);

  const targetDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  console.log('[StaticCalendar] Fetching events from:', startOfDay.toISOString(), 'to:', endOfDay.toISOString());

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  console.log('[StaticCalendar] Raw API response items count:', response.data.items?.length || 0);

  // Debug: Log first event's attendees
  if (response.data.items && response.data.items.length > 0) {
    const firstEvent = response.data.items[0];
    console.log('[StaticCalendar] First event attendees:', firstEvent.attendees?.length || 0);
    console.log('[StaticCalendar] First event has attendees field:', 'attendees' in firstEvent);
    console.log('[StaticCalendar] First event visibility:', firstEvent.visibility);
  }

  const events: CalendarEvent[] = (response.data.items || []).map((event) => {
    const isAllDay = !event.start?.dateTime;
    return {
      id: event.id || '',
      summary: event.summary || 'No Title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      allDay: isAllDay,
      description: event.description || undefined,
      attendees: event.attendees?.length || 0,
      conferenceData: event.conferenceData ? {
        conferenceId: event.conferenceData.conferenceId || undefined,
        conferenceSolution: event.conferenceData.conferenceSolution ? {
          name: event.conferenceData.conferenceSolution.name || undefined,
        } : undefined,
        entryPoints: event.conferenceData.entryPoints?.map(ep => ({
          entryPointType: ep.entryPointType || undefined,
          uri: ep.uri || undefined,
          label: ep.label || undefined,
        })),
      } : undefined,
      hangoutLink: event.hangoutLink || undefined,
    };
  });

  console.log('[StaticCalendar] Processed events count:', events.length);

  return {
    events,
    date: dateStr || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  };
}

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
  const timestamp = new Date().toISOString();
  console.log('=== Static Calendar Request ===');
  console.log(`[${timestamp}] Query params:`, req.query);
  console.log(`[${timestamp}] User Agent:`, req.headers['user-agent']);

  try {
    const date = (req.query.date as string) || getTodayString();
    console.log(`[${timestamp}] Fetching events for date:`, date);

    const { events } = await getEventsForDate(date);
    console.log(`[${timestamp}] Successfully fetched events:`, events.length);

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

    .event-meta {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      font-size: 13px;
      color: #64748b;
    }

    .event-badge {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }

    .event-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 12px;
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
      ${events.map(event => {
        // Extract conference link
        const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;
        const confName = event.conferenceData?.conferenceSolution?.name;

        return `
        <div class="event">
          <div class="event-time">
            <div class="event-time-main">${formatTime(event.start, event.allDay)}</div>
            ${!event.allDay ? `<div class="event-time-end">to ${formatTime(event.end, false)}</div>` : ''}
          </div>
          <div class="event-details">
            <div class="event-title">${escapeHtml(event.summary)}</div>
            <div class="event-meta">
              ${event.location ? `<span>📍 ${escapeHtml(event.location)}</span>` : ''}
              ${event.attendees && event.attendees > 0 ? `<span class="event-badge">👥 ${event.attendees} ${event.attendees === 1 ? 'person' : 'people'}</span>` : ''}
              ${meetLink ? `<span>🎥 ${confName || 'Video call'}</span>` : ''}
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `}

  <div class="footer">
    ${events.length} event${events.length !== 1 ? 's' : ''} • Generated ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
  </div>
</body>
</html>`;

    console.log(`[${timestamp}] Sending HTML response`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('=== Static Calendar ERROR ===');
    console.error(`[${timestamp}] Error:`, error);
    console.error(`[${timestamp}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');

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
    pre { text-align: left; background: #f5f5f5; padding: 10px; overflow: auto; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Error Loading Calendar</h1>
  <div class="error">
    <p><strong>Error message:</strong></p>
    <pre>${error instanceof Error ? escapeHtml(error.message) : 'Unknown error'}</pre>
    ${error instanceof Error && error.stack ? `
      <p><strong>Stack trace:</strong></p>
      <pre>${escapeHtml(error.stack.substring(0, 500))}</pre>
    ` : ''}
  </div>
</body>
</html>
    `);
  }
}
