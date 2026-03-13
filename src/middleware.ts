/**
 * Auth Middleware — Protects all routes except login and public APIs.
 * Supports: Supabase Auth (multi-user) or legacy AUTH_EMAIL/AUTH_PASSWORD (single user).
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = [
  '/login',
  '/welcome',
  '/api/auth',
  '/api/health',
  '/api/telegram',
  '/api/waitlist',
  '/api/worker/digest',
  '/api/worker/tick',
  '/api/worker/reflect',
  '/api/worker/morning-brief',
];

const SKIP_PREFIXES = ['/_next/', '/icons/', '/manifest.json', '/sw.js', '/favicon'];

function hasInternalAuth(request: NextRequest): boolean {
  const key = request.headers.get('x-internal-key');
  return Boolean(key && process.env.AUTH_PASSWORD && key === process.env.AUTH_PASSWORD);
}

async function verifyLegacyToken(token: string, secret: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length < 3) return false;
    const signature = parts.pop()!;
    const payload = parts.join(':');
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return signature === expected;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (hasInternalAuth(request)) return NextResponse.next();

  const useSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));

  if (useSupabase) {
    const { response, user } = await updateSession(request);
    if (!user) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const welcomeUrl = new URL('/welcome', request.url);
      welcomeUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(welcomeUrl);
    }
    return response;
  }

  const authEmail = process.env.AUTH_EMAIL;
  const authPassword = process.env.AUTH_PASSWORD;
  if (!authEmail || !authPassword) return NextResponse.next();

  const sessionCookie = request.cookies.get('angelina_session')?.value;
  const secret = process.env.AUTH_SECRET || authPassword;
  if (!sessionCookie || !(await verifyLegacyToken(sessionCookie, secret))) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
