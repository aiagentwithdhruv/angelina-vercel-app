/**
 * YouTube Analytics API Route
 * GET: Return cached data (zero API calls)
 * POST: Refresh from YouTube API or configure
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getYouTubeData, updateYouTubeData, isCacheValid, getCacheAge } from '@/lib/youtube-store';
import { fetchAllYouTubeData } from '@/lib/youtube-api';

async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('google_access_token')?.value;
    if (token) return token;

    // Try refreshing if we have a refresh token
    const refreshToken = cookieStore.get('google_refresh_token')?.value;
    if (!refreshToken) return null;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();

    // Update the access token cookie
    cookieStore.set('google_access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return data.access_token;
  } catch {
    return null;
  }
}

function getChannelId(): string | null {
  return process.env.YOUTUBE_CHANNEL_ID || null;
}

// GET: Return cached data (always instant, zero API calls)
export async function GET() {
  const data = getYouTubeData();
  return NextResponse.json({
    ...data,
    cacheValid: isCacheValid(),
    cacheAge: getCacheAge(),
  });
}

// POST: Refresh data from YouTube API
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, channelId: bodyChannelId } = body;

    if (action === 'refresh') {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Google not connected. Please connect Google in Settings first.' },
          { status: 401 },
        );
      }

      const channelId = bodyChannelId || getChannelId() || undefined;

      console.log('[YouTube] Fetching data...', channelId ? `channel: ${channelId}` : 'own channel');
      const { channel, videos } = await fetchAllYouTubeData(accessToken, channelId);
      const store = updateYouTubeData(channel, videos);

      console.log(`[YouTube] Fetched ${videos.length} videos for ${channel.title}`);

      return NextResponse.json({
        ...store,
        cacheValid: true,
        cacheAge: 'just now',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[YouTube] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch YouTube data' },
      { status: 500 },
    );
  }
}
