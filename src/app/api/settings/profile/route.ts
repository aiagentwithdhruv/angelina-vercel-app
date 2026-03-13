import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase/server';
import { getPgPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ profile: null });

  try {
    const pool = getPgPool();
    const { rows } = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [user.id],
    );
    return NextResponse.json({ profile: rows[0] || { id: user.id, email: user.email, display_name: user.displayName } });
  } catch {
    return NextResponse.json({ profile: { id: user.id, email: user.email, display_name: user.displayName } });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSupabaseUser();
  const body = await request.json();
  const { displayName, timezone, useCases, onboardingComplete } = body;

  if (user) {
    try {
      const pool = getPgPool();
      await pool.query(
        `INSERT INTO profiles (id, email, display_name, timezone, use_cases, onboarding_complete, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           display_name = COALESCE($3, profiles.display_name),
           timezone = COALESCE($4, profiles.timezone),
           use_cases = COALESCE($5, profiles.use_cases),
           onboarding_complete = COALESCE($6, profiles.onboarding_complete),
           updated_at = NOW()`,
        [user.id, user.email, displayName, timezone, JSON.stringify(useCases), onboardingComplete],
      );
      return NextResponse.json({ success: true });
    } catch (err) {
      // DB might not have the extra columns yet — that's OK
      console.warn('[Profile] Save failed (migration may be pending):', (err as Error).message);
    }
  }

  // Fallback: just acknowledge (profile stored in localStorage on client)
  return NextResponse.json({ success: true, fallback: true });
}
