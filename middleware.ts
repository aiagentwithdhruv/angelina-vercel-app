/**
 * Auth Middleware — Protects all routes except login, telegram webhook, and digest cron.
 *
 * How it works:
 * 1. Checks for `angelina_session` cookie
 * 2. If missing/invalid → redirect to /login (pages) or return 401 (API)
 * 3. Public routes bypass auth: /login, /api/auth/login, /api/telegram, /api/worker/digest
 *
 * If AUTH_EMAIL + AUTH_PASSWORD are NOT set, auth is disabled (dev mode).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 3) return false;

    const signature = parts.pop()!;
    const payload = parts.join(':');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Routes that don't need auth
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/telegram',        // Telegram webhook (has its own auth)
  '/api/worker/digest',   // Vercel cron (has its own auth)
];

// Static assets and Next.js internals
const SKIP_PREFIXES = [
  '/_next/',
  '/icons/',
  '/manifest.json',
  '/sw.js',
  '/favicon',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (SKIP_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // If auth not configured, allow everything (dev mode)
  const authEmail = process.env.AUTH_EMAIL;
  const authPassword = process.env.AUTH_PASSWORD;
  if (!authEmail || !authPassword) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('angelina_session')?.value;
  const secret = process.env.AUTH_SECRET || authPassword;

  if (!sessionCookie || !verifyToken(sessionCookie, secret)) {
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
  matcher: [
    // Match all pages and API routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
