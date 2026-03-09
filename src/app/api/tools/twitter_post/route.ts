/**
 * Twitter/X Post Tool — via Ghost Browser on VPS
 *
 * Posts content on X (Twitter) through OpenClaw → Ghost Browser.
 * Requires approval unless TWITTER_AUTO_POST=true.
 *
 * Env:
 *   OPENCLAW_VPS_URL — VPS endpoint
 *   TWITTER_AUTO_POST — "true" to skip approval
 */

import { withToolRetry } from '@/lib/tool-retry';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { content, image_url } = await request.json();

      if (!content) {
        return apiError('MISSING_PARAM', 'content is required. Provide the tweet/post text.', 400);
      }

      // Approval gate
      if (process.env.TWITTER_AUTO_POST !== 'true') {
        return apiSuccess({
          needs_approval: true,
          message: 'Twitter/X post ready for approval. Review and confirm.',
          content,
          image_url: image_url || null,
        });
      }

      const vpsUrl = process.env.OPENCLAW_VPS_URL;
      if (!vpsUrl) {
        return apiError('MISSING_CONFIG', 'OPENCLAW_VPS_URL not configured.', 500);
      }

      const instruction = image_url
        ? `Post this on Twitter/X with the image at ${image_url}:\n\n${content}`
        : `Post this on Twitter/X:\n\n${content}`;

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
          return apiError('VPS_ERROR', `VPS ${res.status}: ${text.slice(0, 200)}`, res.status);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'Posted';

        return apiSuccess({
          message: 'Twitter/X post submitted via Ghost Browser',
          response: reply,
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        return apiError('VPS_TIMEOUT', fetchErr instanceof Error ? fetchErr.message : 'VPS call failed');
      }
    } catch (error) {
      return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Twitter post failed');
    }
  }, 'twitter_post');
}
