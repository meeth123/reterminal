import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendar_v3 } from 'googleapis';
import { getOAuthCalendarClient } from '../lib/oauth-client.js';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  allDay: boolean;
  description?: string;
  attendees?: number;
  status?: string;
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
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const targetDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events: CalendarEvent[] = (response.data.items || []).map((event) => {
    const isAllDay = !event.start?.dateTime;
    return {
      id: event.id || '',
      summary: event.summary || 'No Title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location,
      allDay: isAllDay,
      description: event.description,
      attendees: event.attendees?.length || 0,
      status: event.status,
    };
  });

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

function calculateEventDuration(start: string, end: string, allDay: boolean): number {
  if (allDay) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.round((endTime - startTime) / (1000 * 60)); // minutes
}

function getNextEventInfo(events: CalendarEvent[], currentTime: Date) {
  const now = currentTime.getTime();

  // Find currently happening event
  const currentEvent = events.find(event => {
    if (event.allDay) return false;
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();
    return now >= start && now < end;
  });

  if (currentEvent) {
    const end = new Date(currentEvent.end).getTime();
    const minutesLeft = Math.round((end - now) / (1000 * 60));
    return { type: 'current', event: currentEvent, minutesLeft };
  }

  // Find next upcoming event
  const upcomingEvent = events.find(event => {
    if (event.allDay) return false;
    const start = new Date(event.start).getTime();
    return start > now;
  });

  if (upcomingEvent) {
    const start = new Date(upcomingEvent.start).getTime();
    const minutesUntil = Math.round((start - now) / (1000 * 60));
    return { type: 'upcoming', event: upcomingEvent, minutesUntil };
  }

  return null;
}

function getEventStats(events: CalendarEvent[]) {
  const totalEvents = events.length;
  const allDayEvents = events.filter(e => e.allDay).length;
  const timedEvents = events.filter(e => !e.allDay).length;

  const totalMinutes = events
    .filter(e => !e.allDay)
    .reduce((sum, e) => sum + calculateEventDuration(e.start, e.end, e.allDay), 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const withAttendees = events.filter(e => e.attendees && e.attendees > 0).length;
  const withLocation = events.filter(e => e.location).length;

  return {
    totalEvents,
    allDayEvents,
    timedEvents,
    busyTime: `${hours}h ${minutes}m`,
    withAttendees,
    withLocation,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  console.log('=== Enhanced Static Calendar Request ===');
  console.log(`[${timestamp}] Query params:`, req.query);

  try {
    const date = (req.query.date as string) || getTodayString();
    const { events } = await getEventsForDate(date);

    const currentTime = new Date();
    const nextEventInfo = getNextEventInfo(events, currentTime);
    const stats = getEventStats(events);

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
      padding: 16px;
      overflow: hidden;
    }

    .container {
      display: grid;
      grid-template-columns: 520px 260px;
      gap: 16px;
      height: 100%;
    }

    .main-section {
      display: flex;
      flex-direction: column;
    }

    .header {
      border-bottom: 3px solid #1e293b;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 24px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
    }

    .events {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .event {
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      gap: 12px;
    }

    .event.current {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .event.upcoming {
      border-color: #10b981;
    }

    .event-time {
      flex-shrink: 0;
      width: 90px;
    }

    .event-time-main {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
    }

    .event-time-end {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }

    .event-details {
      flex: 1;
      min-width: 0;
    }

    .event-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-meta {
      font-size: 12px;
      color: #64748b;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .event-badge {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card {
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
    }

    .card-title {
      font-size: 14px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .next-event-card {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      border: none;
    }

    .next-event-card .card-title {
      color: white;
      opacity: 0.9;
    }

    .next-event-time {
      font-size: 24px;
      font-weight: bold;
      margin: 8px 0;
    }

    .next-event-name {
      font-size: 14px;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
    }

    .stat-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }

    .no-events {
      text-align: center;
      padding: 40px 20px;
    }

    .no-events-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .no-events-text {
      font-size: 18px;
      color: #64748b;
      font-weight: 600;
    }

    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Main Section -->
    <div class="main-section">
      <div class="header">
        <div class="title">${formatDateHeader(date)}</div>
        <div class="subtitle">${stats.totalEvents} event${stats.totalEvents !== 1 ? 's' : ''} • ${stats.busyTime} busy</div>
      </div>

      ${events.length === 0 ? `
        <div class="no-events">
          <div class="no-events-icon">✓</div>
          <div class="no-events-text">No events scheduled</div>
        </div>
      ` : `
        <div class="events">
          ${events.slice(0, 6).map((event, idx) => {
            const isCurrent = nextEventInfo?.type === 'current' && nextEventInfo.event.id === event.id;
            const isNext = nextEventInfo?.type === 'upcoming' && nextEventInfo.event.id === event.id;
            const duration = calculateEventDuration(event.start, event.end, event.allDay);

            return `
            <div class="event ${isCurrent ? 'current' : ''} ${isNext && idx === 0 ? 'upcoming' : ''}">
              <div class="event-time">
                <div class="event-time-main">${formatTime(event.start, event.allDay)}</div>
                ${!event.allDay ? `<div class="event-time-end">${duration}min</div>` : ''}
              </div>
              <div class="event-details">
                <div class="event-title">${escapeHtml(event.summary)}</div>
                <div class="event-meta">
                  ${event.location ? `<span>📍 ${escapeHtml(event.location.substring(0, 20))}${event.location.length > 20 ? '...' : ''}</span>` : ''}
                  ${event.attendees && event.attendees > 0 ? `<span class="event-badge">👥 ${event.attendees}</span>` : ''}
                  ${isCurrent ? `<span class="event-badge" style="background: #dbeafe; color: #1e40af;">NOW</span>` : ''}
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      `}

      <div class="footer">
        Generated ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
      </div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar">
      ${nextEventInfo ? `
        <div class="card next-event-card">
          <div class="card-title">
            ${nextEventInfo.type === 'current' ? '🔴 Happening Now' : '⏰ Up Next'}
          </div>
          <div class="next-event-time">
            ${nextEventInfo.type === 'current'
              ? `${nextEventInfo.minutesLeft}min left`
              : nextEventInfo.minutesUntil < 60
                ? `in ${nextEventInfo.minutesUntil}min`
                : `in ${Math.round(nextEventInfo.minutesUntil / 60)}h ${nextEventInfo.minutesUntil % 60}m`
            }
          </div>
          <div class="next-event-name">${escapeHtml(nextEventInfo.event.summary)}</div>
        </div>
      ` : events.length > 0 ? `
        <div class="card">
          <div class="card-title">✅ Day Complete</div>
          <div style="text-align: center; padding: 12px 0; color: #64748b;">
            All events finished
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-title">📊 Today's Overview</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${stats.timedEvents}</div>
            <div class="stat-label">MEETINGS</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.allDayEvents}</div>
            <div class="stat-label">ALL-DAY</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.withAttendees}</div>
            <div class="stat-label">W/ PEOPLE</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.withLocation}</div>
            <div class="stat-label">IN-PERSON</div>
          </div>
        </div>
      </div>

      ${events.length > 6 ? `
        <div class="card" style="text-align: center; padding: 8px;">
          <div style="color: #64748b; font-size: 12px;">
            +${events.length - 6} more event${events.length - 6 !== 1 ? 's' : ''}
          </div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('=== Enhanced Static Calendar ERROR ===');
    console.error(`[${timestamp}] Error:`, error);

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
  </div>
</body>
</html>
    `);
  }
}
