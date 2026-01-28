#!/usr/bin/env tsx

/**
 * OAuth 2.0 Setup Script
 *
 * This script guides you through the OAuth authorization process:
 * 1. Starts a local server to receive the OAuth callback
 * 2. Opens your browser to Google's authorization page
 * 3. Exchanges the authorization code for tokens
 * 4. Stores tokens in Upstash Redis
 *
 * Run this once to authorize the app to access your calendar.
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables from .env.local (if it exists) and .env
dotenv.config({ path: '.env.local' });
dotenv.config();
import http from 'http';
import { URL } from 'url';
import { storeTokens } from '../lib/oauth-client';
import type { OAuthTokens } from '../lib/types';

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;

// OAuth scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Error: OAuth credentials not found');
    console.error('Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your .env file');
    process.exit(1);
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

async function startServer(oauth2Client: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith('/oauth/callback')) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const url = new URL(req.url, `http://localhost:${PORT}`);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1 style="color: #dc2626;">❌ Authorization Failed</h1>
                <p>Error: ${error}</p>
                <p>Please close this window and try again.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400);
          res.end('Missing authorization code');
          return;
        }

        console.log('\n✅ Authorization code received');
        console.log('🔄 Exchanging code for tokens...');

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
          throw new Error('Invalid tokens received');
        }

        const oauthTokens: OAuthTokens = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token!,
          scope: tokens.scope || SCOPES.join(' '),
          token_type: tokens.token_type || 'Bearer',
          expiry_date: tokens.expiry_date || Date.now() + (3600 * 1000),
        };

        // Store in Redis
        console.log('💾 Storing tokens in Upstash Redis...');
        await storeTokens(oauthTokens);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
              <h1 style="color: #10b981;">✅ Authorization Successful!</h1>
              <p>Tokens have been stored in Upstash Redis.</p>
              <p>You can now close this window and return to your terminal.</p>
              <hr style="margin: 40px 0;">
              <p style="color: #64748b;">Your reTerminal calendar is now configured with OAuth 2.0</p>
            </body>
          </html>
        `);

        console.log('\n✅ Success! OAuth setup complete');
        console.log('📊 Tokens stored in Upstash Redis');
        console.log('\nNext steps:');
        console.log('1. Commit and push your code to GitHub');
        console.log('2. Verify deployment on Vercel');
        console.log('3. Test the API: https://reterminal.vercel.app/api/events');

        server.close();
        resolve();
      } catch (error) {
        console.error('❌ Error during OAuth callback:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">❌ Setup Failed</h1>
              <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
              <p>Please check the terminal for details.</p>
            </body>
          </html>
        `);
        server.close();
        reject(error);
      }
    });

    server.listen(PORT, () => {
      console.log(`\n🚀 Local server started on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      reject(error);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('    OAuth 2.0 Setup for reTerminal Calendar');
  console.log('═══════════════════════════════════════════════\n');

  // Check prerequisites
  console.log('📋 Checking prerequisites...');

  // Check for Redis credentials (support both naming conventions)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('❌ Error: Upstash Redis not configured');
    console.error('\nPlease follow these steps:');
    console.error('1. Go to Vercel dashboard → Your Project → Integrations');
    console.error('2. Add "Upstash Redis" integration');
    console.error('3. Pull environment variables: vercel env pull .env');
    console.error('4. Run this script again');
    process.exit(1);
  }

  console.log('✅ Upstash Redis configured');

  // Create OAuth2 client
  const oauth2Client = getOAuth2Client();
  console.log('✅ OAuth credentials loaded');

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  console.log('\n🌐 Opening browser for authorization...');
  console.log('\nIf the browser doesn\'t open automatically, visit this URL:');
  console.log(`\n${authUrl}\n`);

  // Open browser
  const open = (await import('open')).default;
  await open(authUrl);

  console.log('⏳ Waiting for authorization...');
  console.log('(This window will update after you authorize)\n');

  // Start local server and wait for callback
  try {
    await startServer(oauth2Client);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
