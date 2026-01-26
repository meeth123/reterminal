import { google, calendar_v3 } from 'googleapis';
import path from 'path';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  allDay: boolean;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  date: string;
}

let calendarClient: calendar_v3.Calendar | null = null;

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  if (calendarClient) {
    return calendarClient;
  }

  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json';
  const absolutePath = path.isAbsolute(serviceAccountPath) 
    ? serviceAccountPath 
    : path.join(process.cwd(), serviceAccountPath);

  const auth = new google.auth.GoogleAuth({
    keyFile: absolutePath,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
}

export async function getEventsForDate(dateStr?: string): Promise<CalendarResponse> {
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
  console.log('[Calendar] Raw API response items:', JSON.stringify(response.data.items, null, 2));

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
