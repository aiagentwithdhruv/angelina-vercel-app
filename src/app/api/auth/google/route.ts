/**
 * Google OAuth - Initiate
 * Redirects to Google for full Workspace authorization
 * Includes: Gmail, Calendar, Drive, Sheets, Docs
 */

import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-services";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const authUrl = getGoogleAuthUrl(baseUrl);
    console.log("[Google Auth] Redirecting to Google OAuth...");
    return NextResponse.redirect(authUrl);
  } catch (error) {
    const digest = (error as { digest?: string } | undefined)?.digest;
    if (digest !== 'DYNAMIC_SERVER_USAGE') {
      console.error("[Google Auth] Error:", error);
    }
    const details = error instanceof Error ? error.message : 'unknown_error';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL(`/settings?error=auth_config_error&details=${encodeURIComponent(details)}`, baseUrl),
    );
  }
}
