import { NextRequest, NextResponse } from 'next/server';
import { getUsageSummary } from '@/lib/free-tier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || 'default';
  const summary = await getUsageSummary(userId);
  return NextResponse.json(summary);
}
