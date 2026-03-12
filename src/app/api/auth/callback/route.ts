/**
 * Supabase Auth callback — OAuth (e.g. Google) redirect.
 * Exchanges code for session and redirects to app.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';
  const origin = request.headers.get('origin') || new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[Supabase Auth] exchangeCodeForSession:', error.message);
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
