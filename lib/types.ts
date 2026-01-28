/**
 * OAuth 2.0 Token Types
 * For Google Calendar API authentication
 */

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number; // Unix timestamp in milliseconds
}

export interface TokenStorageData {
  tokens: OAuthTokens;
  updatedAt: string; // ISO timestamp
  calendarId: string;
}

export interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
