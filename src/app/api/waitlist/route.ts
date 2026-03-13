import { NextRequest, NextResponse } from 'next/server';
import { getPgPool } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WAITLIST_FILE = path.join(process.cwd(), 'waitlist.json');

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const entry = { email: email.toLowerCase().trim(), timestamp: new Date().toISOString() };

    // Try Postgres first
    try {
      const pool = getPgPool();
      await pool.query(
        `CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`,
      );
      await pool.query(
        `INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
        [entry.email],
      );
      return NextResponse.json({ success: true, message: 'Added to waitlist' });
    } catch {
      // Fallback to file
    }

    // File fallback
    let entries: any[] = [];
    try {
      entries = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf-8'));
    } catch { /* empty */ }
    if (!entries.some((e: any) => e.email === entry.email)) {
      entries.push(entry);
      fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2));
    }

    return NextResponse.json({ success: true, message: 'Added to waitlist' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}

export async function GET() {
  try {
    try {
      const pool = getPgPool();
      const result = await pool.query('SELECT email, created_at FROM waitlist ORDER BY created_at DESC');
      return NextResponse.json({ count: result.rows.length, entries: result.rows });
    } catch { /* fallback */ }

    let entries: any[] = [];
    try {
      entries = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf-8'));
    } catch { /* empty */ }
    return NextResponse.json({ count: entries.length, entries });
  } catch {
    return NextResponse.json({ count: 0, entries: [] });
  }
}
