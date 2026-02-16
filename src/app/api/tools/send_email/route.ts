/**
 * Angelina AI - Send Email Tool
 * Sends emails via Gmail API
 * Uses OAuth tokens from cookies (set via Settings > Google Connect)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken } from '@/lib/google-auth';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject, body',
      });
    }

    // Get access token from cookies (auto-refreshes if needed)
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Google not connected. Please go to Settings and connect your Google account first.',
      });
    }

    // Build RFC 2822 email
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    const encodedEmail = Buffer.from(email).toString('base64url');

    // Send via Gmail API
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[send_email] Gmail API error:', errorData);
      return NextResponse.json({
        success: false,
        error: 'Failed to send email. Token may be expired - try reconnecting Google in Settings.',
      });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: `Email sent successfully to ${to}`,
    });

  } catch (error) {
    console.error('[send_email] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email. Make sure Google is connected in Settings.',
    });
  }
}
