import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'revenue-data.json');

interface RevenueData {
  currentRevenue: number;
  updatedAt: string;
}

function readData(): RevenueData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {}
  return { currentRevenue: 0, updatedAt: new Date().toISOString() };
}

function writeData(data: RevenueData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(readData());
}

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'amount must be a number' }, { status: 400 });
    }
    const data: RevenueData = { currentRevenue: amount, updatedAt: new Date().toISOString() };
    writeData(data);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
