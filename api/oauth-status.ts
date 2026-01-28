import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadTokens, getOAuthCalendarClient } from '../lib/oauth-client';

interface OAuthStatusResponse {
  authenticated: boolean;
  expiresAt?: string;
  expiresInMinutes?: number;
  calendarAccess?: boolean;
  attendeeAccess?: boolean;
  error?: string;
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
    // Check if tokens exist
    const tokens = await loadTokens();

    if (!tokens) {
      const response: OAuthStatusResponse = {
        authenticated: false,
        error: 'OAuth tokens not found. Run setup: npm run oauth:setup',
      };
      return res.status(200).json(response);
    }

    // Calculate expiry
    const expiresAt = new Date(tokens.expiry_date).toISOString();
    const expiresInMinutes = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);

    // Test calendar access
    try {
      const calendar = await getOAuthCalendarClient();
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

      const response = await calendar.events.list({
        calendarId,
        maxResults: 1,
        singleEvents: true,
      });

      const hasAttendees = response.data.items?.[0]?.attendees !== undefined;

      const statusResponse: OAuthStatusResponse = {
        authenticated: true,
        expiresAt,
        expiresInMinutes,
        calendarAccess: true,
        attendeeAccess: hasAttendees,
      };

      return res.status(200).json(statusResponse);
    } catch (calendarError) {
      const statusResponse: OAuthStatusResponse = {
        authenticated: true,
        expiresAt,
        expiresInMinutes,
        calendarAccess: false,
        error: calendarError instanceof Error ? calendarError.message : 'Calendar access failed',
      };

      return res.status(200).json(statusResponse);
    }
  } catch (error) {
    const response: OAuthStatusResponse = {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return res.status(500).json(response);
  }
}
