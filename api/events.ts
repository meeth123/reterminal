import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google, calendar_v3 } from 'googleapis';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  allDay: boolean;
}

interface CalendarResponse {
  events: CalendarEvent[];
  date: string;
}

let calendarClient: calendar_v3.Calendar | null = null;

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  if (calendarClient) {
    return calendarClient;
  }

  // Vercel stores secrets as environment variables
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
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

  const events: CalendarEvent[] = (response.data.items || []).map((event) => {
    const isAllDay = !event.start?.dateTime;
    return {
      id: event.id || '',
      summary: event.summary || 'No Title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location,
      allDay: isAllDay,
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const date = req.query.date as string | undefined;
    const data = await getEventsForDate(date);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
