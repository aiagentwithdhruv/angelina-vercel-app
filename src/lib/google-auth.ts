/**
 * Google Auth Helper
 *
 * Reads Google OAuth tokens from cookies OR file-based store.
 * File-based store enables Telegram + server-side tool calls (no cookies).
 * Used by all tool endpoints (check_email, check_calendar, send_email, etc.)
 */

import { cookies } from 'next/headers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_FILE = join(process.cwd(), 'google-tokens.json');

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}

/** Read tokens from JSON file */
function readStoredTokens(): StoredTokens | null {
  try {
    if (!existsSync(TOKEN_FILE)) return null;
    const data = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
    return data;
  } catch {
    return null;
  }
}

/** Write tokens to JSON file */
export function saveTokensToFile(accessToken: string, refreshToken: string, expiresIn = 3600): void {
  const data: StoredTokens = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  console.log('[Google Auth] Tokens saved to file');
}

/** Refresh access token using refresh token */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google Auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return null;
  }

  console.log('[Google Auth] Refreshing access token...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Google Auth] Token refresh failed:', errorData);
    return null;
  }

  const tokens = await response.json();
  const newAccessToken = tokens.access_token;

  // Persist refreshed tokens to file
  saveTokensToFile(newAccessToken, refreshToken, tokens.expires_in || 3600);

  console.log('[Google Auth] Access token refreshed successfully');
  return newAccessToken;
}

export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    // Strategy 1: Try cookies first (web UI requests)
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    try {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('google_access_token')?.value;
      refreshToken = cookieStore.get('google_refresh_token')?.value;

      if (accessToken) {
        return accessToken;
      }
    } catch {
      // cookies() fails in non-request contexts (e.g., server-to-server calls from Telegram)
      // Fall through to file-based tokens
    }

    // Strategy 2: Try file-based tokens (Telegram + server-side calls)
    const stored = readStoredTokens();
    if (stored) {
      // Check if access token is still valid (with 5 min buffer)
      if (stored.access_token && stored.expires_at > Date.now() + 5 * 60 * 1000) {
        return stored.access_token;
      }

      // Access token expired — refresh using stored refresh token
      if (stored.refresh_token) {
        const newToken = await refreshAccessToken(stored.refresh_token);
        if (newToken) return newToken;
      }
    }

    // Strategy 3: Try refreshing with cookie refresh token
    if (refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        // Also save to cookies
        try {
          const cookieStore = await cookies();
          cookieStore.set('google_access_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
            path: '/',
          });
        } catch {
          // Ignore cookie errors for server-side calls
        }
        return newToken;
      }
    }

    console.error('[Google Auth] No valid tokens found (cookies or file). Connect Google in Settings.');
    return null;
  } catch (error) {
    console.error('[Google Auth] Error getting access token:', error);
    return null;
  }
}
