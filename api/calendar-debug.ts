import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Service account not configured' });
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Fetch one event with ALL fields
    const response = await calendar.events.list({
      calendarId,
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const event = response.data.items?.[0];

    if (!event) {
      return res.json({ message: 'No events found' });
    }

    // Return EVERYTHING about the first event
    res.json({
      message: 'First event details',
      eventId: event.id,
      summary: event.summary,
      hasAttendees: !!event.attendees,
      attendeesCount: event.attendees?.length || 0,
      attendeesField: event.attendees ? 'present' : 'missing',
      visibility: event.visibility,
      guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
      guestsCanInviteOthers: event.guestsCanInviteOthers,
      guestsCanModify: event.guestsCanModify,
      hasConferenceData: !!event.conferenceData,
      hasHangoutLink: !!event.hangoutLink,
      hasLocation: !!event.location,
      hasDescription: !!event.description,
      organizer: event.organizer?.email,
      creator: event.creator?.email,
      // Raw attendees (will show if they exist)
      rawAttendees: event.attendees || null,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch calendar',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
