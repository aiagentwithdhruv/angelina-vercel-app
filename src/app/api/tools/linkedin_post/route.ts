/**
 * LinkedIn Post Tool — Phase 3 (Ghost Browser Integration)
 *
 * Routes LinkedIn posting through OpenClaw on VPS -> Ghost Browser.
 * Requires approval unless LINKEDIN_AUTO_POST=true.
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { content, image_url } = await request.json();

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'content is required. Provide the LinkedIn post text.',
      });
    }

    // Approval gate
    if (process.env.LINKEDIN_AUTO_POST !== 'true') {
      return NextResponse.json({
        success: true,
        needs_approval: true,
        message: 'LinkedIn post ready for approval. Review and confirm in Telegram.',
        content,
        image_url: image_url || null,
      });
    }

    const vpsUrl = process.env.OPENCLAW_VPS_URL;
    if (!vpsUrl) {
      return NextResponse.json({
        success: false,
        error: 'OPENCLAW_VPS_URL not configured. Add it in Vercel env vars.',
      });
    }

    const instruction = image_url
      ? `Post this on LinkedIn with the image at ${image_url}:\n\n${content}`
      : `Post this on LinkedIn:\n\n${content}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${vpsUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WORKER_API_KEY ? { 'x-worker-key': process.env.WORKER_API_KEY } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: instruction }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ success: false, error: `VPS ${res.status}: ${text.slice(0, 200)}` });
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Posted';

      return NextResponse.json({ success: true, message: 'LinkedIn post submitted via Ghost Browser', response: reply });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return NextResponse.json({ success: false, error: fetchErr instanceof Error ? fetchErr.message : 'VPS call failed' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'LinkedIn post failed' });
  }
}
