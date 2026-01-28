import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calendar_v3 } from 'googleapis';
import { getOAuthCalendarClient, isOAuthConfigured } from '../lib/oauth-client';

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
  console.log('[Calendar] getEventsForDate called with dateStr:', dateStr);

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  console.log('[Calendar] Using calendarId:', calendarId);

  // Use provided date or default to today
  const targetDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  console.log('[Calendar] Fetching events from:', startOfDay.toISOString(), 'to:', endOfDay.toISOString());

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  console.log('[Calendar] Raw API response items count:', response.data.items?.length || 0);

  // Debug: Log first event's attendees
  if (response.data.items && response.data.items.length > 0) {
    const firstEvent = response.data.items[0];
    console.log('[Calendar] First event attendees:', firstEvent.attendees?.length || 0);
    console.log('[Calendar] First event raw attendees:', JSON.stringify(firstEvent.attendees));
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

  console.log('[Calendar] Processed events count:', events.length);

  return {
    events,
    // Return the date in India timezone (IST) for proper display
    date: dateStr || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log incoming request details for debugging
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();

  console.log('=== API Request Start ===');
  console.log(`[${timestamp}] Method: ${req.method}`);
  console.log(`[${timestamp}] Client IP: ${clientIp}`);
  console.log(`[${timestamp}] User Agent: ${userAgent}`);
  console.log(`[${timestamp}] Query params:`, req.query);
  console.log('========================');

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}] OPTIONS request - responding with CORS headers`);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log(`[${timestamp}] ERROR: Method not allowed - ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const date = req.query.date as string | undefined;
    console.log(`[${timestamp}] Fetching events for date: ${date || 'today'}`);

    const startTime = Date.now();
    const data = await getEventsForDate(date);
    const duration = Date.now() - startTime;

    console.log(`[${timestamp}] SUCCESS: Fetched ${data.events.length} events in ${duration}ms`);
    console.log(`[${timestamp}] Response date: ${data.date}`);
    console.log('=== API Request End ===');

    res.status(200).json(data);
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error(`[${timestamp}] Error fetching calendar events:`, error);
    console.error(`[${timestamp}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error('=================');

    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    });
  }
}
