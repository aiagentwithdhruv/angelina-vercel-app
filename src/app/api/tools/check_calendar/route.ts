/**
 * Angelina AI - Calendar Tool
 * Connects to Google Calendar API to check events
 * Uses OAuth tokens from cookies (set via Settings > Google Connect)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken } from '@/lib/google-auth';

export async function POST(request: NextRequest) {
  try {
    const { days = 7 } = await request.json();

    console.log('[check_calendar] Checking calendar for next', days, 'days');

    // Get access token from cookies (auto-refreshes if needed)
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      console.error('[check_calendar] No access token available');
      return NextResponse.json({
        success: false,
        error: 'Google not connected. Please go to Settings and connect your Google account first.',
        events: [],
      });
    }

    console.log('[check_calendar] Got access token, fetching events...');

    // Calculate time range
    const now = new Date();
    const timeMin = now.toISOString();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const timeMax = futureDate.toISOString();

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=20&singleEvents=true&orderBy=startTime`;

    // Fetch events from Google Calendar API
    const response = await fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('[check_calendar] Calendar API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[check_calendar] Calendar API error:', response.status, errorData);

      // Check if Calendar API is not enabled
      if (errorData.includes('Calendar API has not been used') || errorData.includes('accessNotConfigured')) {
        return NextResponse.json({
          success: false,
          error: 'Google Calendar API is not enabled. Please enable it at console.cloud.google.com > APIs & Services > Enable Calendar API.',
          events: [],
        });
      }

      return NextResponse.json({
        success: false,
        error: `Calendar API error (${response.status}). Try reconnecting Google in Settings.`,
        details: errorData,
        events: [],
      });
    }

    const data = await response.json();
    const items = data.items || [];

    console.log('[check_calendar] Found', items.length, 'events');

    const events = items.map((event: {
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      location?: string;
      description?: string;
      hangoutLink?: string;
    }) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || '',
      description: event.description || '',
      meetLink: event.hangoutLink || '',
    }));

    return NextResponse.json({
      success: true,
      count: events.length,
      days,
      events,
    });

  } catch (error) {
    console.error('[check_calendar] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check calendar. Make sure Google is connected in Settings.',
      events: [],
    });
  }
}
