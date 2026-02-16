/**
 * Sync Google tokens from cookies to file
 * Call this once from the browser to persist tokens for Telegram/server-side use
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveTokensToFile } from '@/lib/google-auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;
    const refreshToken = cookieStore.get('google_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No Google refresh token in cookies. Please reconnect Google first.' },
        { status: 400 }
      );
    }

    saveTokensToFile(accessToken || '', refreshToken, 3600);

    return NextResponse.json({
      success: true,
      message: 'Google tokens synced to file. Telegram can now access Google services.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync tokens' },
      { status: 500 }
    );
  }
}
