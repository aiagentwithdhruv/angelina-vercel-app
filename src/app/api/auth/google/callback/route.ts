/**
 * Google OAuth Callback
 * Exchange code for tokens after Google authorization
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveTokensToFile } from "@/lib/google-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const requestUrl = new URL(request.url);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/$/, '');

  if (error) {
    console.error("[Google Auth] Error from Google:", error);
    return NextResponse.redirect(new URL(`/settings?error=auth_failed&details=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', baseUrl));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("[Google Auth] Missing credentials");
      return NextResponse.redirect(new URL('/settings?error=missing_credentials', baseUrl));
    }

    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    console.log("[Google Auth] Exchanging code for tokens...");
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("[Google Auth] Token exchange failed:", errorData);
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', baseUrl));
    }

    const tokens = await tokenResponse.json();
    console.log("[Google Auth] Got tokens successfully");

    // Store tokens in secure HTTP-only cookies
    const cookieStore = await cookies();
    
    cookieStore.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600, // 30 days
        path: '/',
      });
    }

    // Also persist to file — enables Telegram + server-side tool calls
    if (tokens.refresh_token) {
      saveTokensToFile(tokens.access_token, tokens.refresh_token, tokens.expires_in || 3600);
    }

    console.log("[Google Auth] ✅ Successfully authenticated with Google");
    return NextResponse.redirect(new URL('/settings?success=google_connected', baseUrl));
    
  } catch (error) {
    console.error("[Google Auth] Callback error:", error);
    return NextResponse.redirect(new URL('/settings?error=callback_exception', baseUrl));
  }
}
