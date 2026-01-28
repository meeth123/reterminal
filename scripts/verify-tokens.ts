#!/usr/bin/env tsx

/**
 * Token Verification Script
 *
 * Verifies that OAuth tokens are properly stored and working.
 * Tests:
 * 1. Redis connection
 * 2. Tokens exist
 * 3. Tokens can be loaded
 * 4. Calendar API access works
 * 5. Attendee data is accessible
 */

import dotenv from 'dotenv';
import { loadTokens, getOAuthCalendarClient } from '../lib/oauth-client';

// Load environment variables from .env.local (if it exists) and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function verifyRedisConnection() {
  console.log('\n1️⃣  Checking Redis connection...');

  // Check for Redis credentials (support both naming conventions)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('   ❌ Redis credentials not found');
    return false;
  }

  console.log('   ✅ Redis credentials configured');
  return true;
}

async function verifyTokensExist() {
  console.log('\n2️⃣  Checking if tokens exist...');

  try {
    const tokens = await loadTokens();

    if (!tokens) {
      console.error('   ❌ No tokens found in Redis');
      console.error('   Run: npm run oauth:setup');
      return false;
    }

    console.log('   ✅ Tokens found in Redis');
    console.log(`   📝 Access token: ${tokens.access_token.substring(0, 20)}...`);
    console.log(`   🔄 Refresh token: ${tokens.refresh_token.substring(0, 20)}...`);

    // Check expiry
    const expiresIn = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);
    if (expiresIn < 0) {
      console.log(`   ⚠️  Access token expired ${Math.abs(expiresIn)} minutes ago`);
      console.log('   (Will be auto-refreshed on next use)');
    } else {
      console.log(`   ⏰ Access token expires in ${expiresIn} minutes`);
    }

    return true;
  } catch (error) {
    console.error('   ❌ Error loading tokens:', error);
    return false;
  }
}

async function verifyCalendarAccess() {
  console.log('\n3️⃣  Testing Calendar API access...');

  try {
    const calendar = await getOAuthCalendarClient();
    console.log('   ✅ OAuth client created successfully');

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log(`   📅 Fetching events from calendar: ${calendarId}`);

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 1,
      singleEvents: true,
    });

    console.log(`   ✅ Calendar API access working`);
    console.log(`   📊 Found ${response.data.items?.length || 0} upcoming event(s)`);

    return true;
  } catch (error) {
    console.error('   ❌ Calendar API access failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

async function verifyAttendeeAccess() {
  console.log('\n4️⃣  Testing attendee data access...');

  try {
    const calendar = await getOAuthCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Get events from the past week to find one with attendees
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const response = await calendar.events.list({
      calendarId,
      timeMin: oneWeekAgo.toISOString(),
      maxResults: 10,
      singleEvents: true,
    });

    const events = response.data.items || [];
    const eventsWithAttendees = events.filter(e => e.attendees && e.attendees.length > 0);

    if (eventsWithAttendees.length === 0) {
      console.log('   ⚠️  No events with attendees found in the past week');
      console.log('   (This is normal if you have no meetings with others)');
      return true;
    }

    const firstEvent = eventsWithAttendees[0];
    console.log('   ✅ Attendee data accessible!');
    console.log(`   📊 Found event: "${firstEvent.summary}"`);
    console.log(`   👥 Attendees: ${firstEvent.attendees!.length} people`);

    // Show first few attendees
    const attendeeList = firstEvent.attendees!.slice(0, 3);
    attendeeList.forEach(attendee => {
      const status = attendee.responseStatus || 'no-response';
      const optional = attendee.optional ? ' (optional)' : '';
      console.log(`      - ${attendee.email}: ${status}${optional}`);
    });

    if (firstEvent.attendees!.length > 3) {
      console.log(`      ... and ${firstEvent.attendees!.length - 3} more`);
    }

    return true;
  } catch (error) {
    console.error('   ❌ Attendee data access failed:', error);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('     OAuth Token Verification');
  console.log('═══════════════════════════════════════════════');

  const results = [
    await verifyRedisConnection(),
    await verifyTokensExist(),
    await verifyCalendarAccess(),
    await verifyAttendeeAccess(),
  ];

  const allPassed = results.every(r => r);

  console.log('\n═══════════════════════════════════════════════');
  if (allPassed) {
    console.log('✅ All checks passed!');
    console.log('\nYour OAuth setup is working correctly.');
    console.log('Attendee data will now be accessible in your calendar.');
  } else {
    console.log('❌ Some checks failed');
    console.log('\nPlease review the errors above and:');
    console.log('1. Ensure Upstash Redis is configured in Vercel');
    console.log('2. Run: npm run oauth:setup');
    console.log('3. Check OAuth credentials in .env');
  }
  console.log('═══════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
