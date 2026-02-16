/**
 * Save API Key
 * Stores API keys securely (in cookies for now, can be moved to encrypted storage)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { keyId, value } = await request.json();

    if (!keyId || !value) {
      return NextResponse.json({ error: "keyId and value required" }, { status: 400 });
    }

    // Store in HTTP-only cookie (secure storage)
    const cookieStore = await cookies();
    
    cookieStore.set(`api_key_${keyId}`, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 3600, // 1 year
      path: '/',
    });

    console.log(`[Settings] Saved API key for: ${keyId}`);

    return NextResponse.json({ success: true, keyId });
  } catch (error) {
    console.error("[Settings] Save key error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 }
    );
  }
}
