/**
 * Consistent API Response Helpers (Rule 35 — API Contracts)
 *
 * All tool routes should return responses through these helpers
 * to enforce a uniform shape across the API surface.
 *
 * Success: { success: true, ...data }
 * Error:   { success: false, error: code, message, details? }
 */

import { NextResponse } from 'next/server';

export function apiSuccess(data: any, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function apiError(code: string, message: string, status = 500, details?: any) {
  const body: Record<string, any> = { success: false, error: code, message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}
