/**
 * Angelina AI - Email Tool
 * Connects to Gmail API to check emails
 * Uses OAuth tokens from cookies (set via Settings > Google Connect)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken } from '@/lib/google-auth';
import { withToolRetry } from '@/lib/tool-retry';

export async function POST(request: NextRequest) {
  return withToolRetry(async () => {
    try {
    const { count = 5, filter = 'unread' } = await request.json();

    // Get access token from cookies (auto-refreshes if needed)
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Google not connected. Please go to Settings and connect your Google account first.',
        emails: [],
      });
    }

    // Build query based on filter
    let query = '';
    if (filter === 'unread') query = 'is:unread';
    else if (filter === 'important') query = 'is:important';

    // Fetch emails from Gmail API
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${count}&q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      const errorData = await listResponse.text();
      console.error('[check_email] Gmail API error:', errorData);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch emails. Token may be expired - try reconnecting Google in Settings.',
        emails: [],
      });
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    if (messageIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        emails: [],
        message: 'No emails found matching the filter.',
      });
    }

    // Fetch full details for each email
    const emails = await Promise.all(
      messageIds.slice(0, count).map(async (msg: { id: string }) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!msgResponse.ok) return null;

        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        return {
          id: msg.id,
          subject: headers.find((h: { name: string }) => h.name === 'Subject')?.value || 'No Subject',
          from: headers.find((h: { name: string }) => h.name === 'From')?.value || 'Unknown',
          date: headers.find((h: { name: string }) => h.name === 'Date')?.value || '',
          snippet: msgData.snippet || '',
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: emails.filter(Boolean).length,
      emails: emails.filter(Boolean),
    });

  } catch (error) {
    console.error('[check_email] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check emails. Make sure Google is connected in Settings.',
      emails: [],
    });
  }
  }, 'check_email');
}
