/**
 * Google OAuth - Initiate
 * Redirects to Google for full Workspace authorization
 * Includes: Gmail, Calendar, Drive, Sheets, Docs
 */

import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-services";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const authUrl = getGoogleAuthUrl(baseUrl);
    console.log("[Google Auth] Redirecting to Google OAuth...");
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google Auth] Error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/settings?error=auth_config_error', baseUrl));
  }
}
