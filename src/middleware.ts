/**
 * Auth Middleware — Protects all routes except login, telegram webhook, and digest cron.
 *
 * Uses Web Crypto API (Edge-compatible, no Node.js crypto import).
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that don't need auth
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',           // All auth routes (login, logout, google oauth)
  '/api/telegram',
  '/api/worker/digest',
];

// Internal API key for server-to-server calls (Telegram bot → /api/chat)
function hasInternalAuth(request: NextRequest): boolean {
  const internalKey = request.headers.get('x-internal-key');
  const secret = process.env.AUTH_PASSWORD;
  return Boolean(internalKey && secret && internalKey === secret);
}

const SKIP_PREFIXES = [
  '/_next/',
  '/icons/',
  '/manifest.json',
  '/sw.js',
  '/favicon',
];

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length < 3) return false;

    const signature = parts.pop()!;
    const payload = parts.join(':');

    // Use Web Crypto API (Edge-compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expected;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // If auth not configured, allow everything (dev mode)
  const authEmail = process.env.AUTH_EMAIL;
  const authPassword = process.env.AUTH_PASSWORD;
  if (!authEmail || !authPassword) {
    return NextResponse.next();
  }

  // Allow internal server-to-server calls (Telegram bot, digest cron)
  if (hasInternalAuth(request)) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('angelina_session')?.value;
  const secret = process.env.AUTH_SECRET || authPassword;

  if (!sessionCookie || !(await verifyToken(sessionCookie, secret))) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login at /login' },
        { status: 401 },
      );
    }

    // Pages → redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
