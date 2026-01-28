/**
 * OAuth 2.0 Client for Google Calendar API
 * Handles token storage, refresh, and authentication
 */

import { google, calendar_v3 } from 'googleapis';
import { Redis } from '@upstash/redis';
import type { OAuthTokens, TokenStorageData } from './types.js';

const REDIS_KEY = 'google_oauth_tokens';

// Initialize Redis client
function getRedisClient(): Redis | null {
  // Support both Upstash naming conventions:
  // - New: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  // - Vercel KV: KV_REST_API_URL and KV_REST_API_TOKEN
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn('[OAuth] Redis credentials not found - OAuth unavailable');
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

// Get OAuth2 client configuration
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('OAuth credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/oauth/callback' // Used during setup script
  );
}

// Load tokens from Redis
export async function loadTokens(): Promise<OAuthTokens | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const data = await redis.get<TokenStorageData>(REDIS_KEY);
    if (!data || !data.tokens) {
      console.log('[OAuth] No tokens found in Redis');
      return null;
    }

    console.log('[OAuth] Tokens loaded from Redis');
    return data.tokens;
  } catch (error) {
    console.error('[OAuth] Error loading tokens:', error);
    return null;
  }
}

// Store tokens in Redis
export async function storeTokens(tokens: OAuthTokens): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis not configured');
  }

  const data: TokenStorageData = {
    tokens,
    updatedAt: new Date().toISOString(),
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  };

  try {
    await redis.set(REDIS_KEY, data);
    console.log('[OAuth] Tokens stored in Redis');
  } catch (error) {
    console.error('[OAuth] Error storing tokens:', error);
    throw error;
  }
}

// Check if tokens are expired
function isTokenExpired(tokens: OAuthTokens): boolean {
  if (!tokens.expiry_date) {
    return true;
  }

  // Add 5-minute buffer to avoid using tokens about to expire
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= (tokens.expiry_date - bufferMs);
}

// Refresh tokens if needed
async function refreshTokensIfNeeded(tokens: OAuthTokens): Promise<OAuthTokens> {
  if (!isTokenExpired(tokens)) {
    console.log('[OAuth] Tokens still valid');
    return tokens;
  }

  console.log('[OAuth] Tokens expired, refreshing...');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    const refreshedTokens: OAuthTokens = {
      access_token: credentials.access_token!,
      refresh_token: tokens.refresh_token, // Preserve original refresh token
      scope: credentials.scope || tokens.scope,
      token_type: credentials.token_type || 'Bearer',
      expiry_date: credentials.expiry_date || Date.now() + (3600 * 1000),
    };

    // Store refreshed tokens
    await storeTokens(refreshedTokens);

    console.log('[OAuth] Tokens refreshed successfully');
    return refreshedTokens;
  } catch (error) {
    console.error('[OAuth] Error refreshing tokens:', error);
    throw new Error('Failed to refresh OAuth tokens. Re-authorization may be required.');
  }
}

// Get authenticated Google Calendar client
export async function getOAuthCalendarClient(): Promise<calendar_v3.Calendar> {
  // Load tokens from Redis
  let tokens = await loadTokens();

  if (!tokens) {
    throw new Error('OAuth tokens not found. Run the setup script: npm run oauth:setup');
  }

  // Refresh if needed
  tokens = await refreshTokensIfNeeded(tokens);

  // Create OAuth2 client with tokens
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
  });

  // Return authenticated Calendar client
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Check if OAuth is configured and tokens are available
export async function isOAuthConfigured(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return false;
    }

    const tokens = await loadTokens();
    return !!tokens;
  } catch {
    return false;
  }
}
