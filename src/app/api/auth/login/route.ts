/**
 * Login API — validates email/password against env vars.
 * Sets a signed session cookie on success.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function createSessionToken(email: string): string {
  const secret = process.env.AUTH_SECRET || process.env.AUTH_PASSWORD || 'angelina-default-secret';
  const payload = `${email}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const validEmail = process.env.AUTH_EMAIL;
    const validPassword = process.env.AUTH_PASSWORD;

    // If auth is not configured, allow access (dev mode)
    if (!validEmail || !validPassword) {
      const token = createSessionToken(email || 'dev');
      const cookieStore = await cookies();
      cookieStore.set('angelina_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600,
        path: '/',
      });
      return NextResponse.json({ success: true });
    }

    // Validate credentials
    if (email !== validEmail || password !== validPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Create session
    const token = createSessionToken(email);
    const cookieStore = await cookies();
    cookieStore.set('angelina_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600,
      path: '/',
    });

    console.log(`[Auth] Login successful: ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 },
    );
  }
}
