/**
 * Generate Image Tool — Phase 6 (Content Creation)
 *
 * Generates images using Euri API (gemini-3-pro-image-preview).
 * Free 1L tokens / 50 images through Euron.
 *
 * Env:
 *   EURI_API_KEY — Euron API key (https://euron.one)
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

const EURI_BASE_URL = 'https://api.euron.one/api/v1/euri';
const EURI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { prompt, image_size } = await request.json();

      if (!prompt) {
        return NextResponse.json({
          success: false,
          error: 'prompt is required. Describe the image you want to generate.',
        });
      }

      const euriKey = process.env.EURI_API_KEY;
      if (!euriKey) {
        return NextResponse.json({
          success: false,
          error: 'EURI_API_KEY not configured. Add your Euron API key in environment variables (get one at https://euron.one).',
        });
      }

      // Map sizes to pixel dimensions for OpenAI-compatible API
      const sizeMap: Record<string, string> = {
        landscape_16_9: '1792x1024',
        square: '1024x1024',
        portrait_4_3: '1024x1792',
      };
      const size = sizeMap[image_size] || '1024x1024';

      console.log(`[Generate Image] Euri (${EURI_IMAGE_MODEL}) | size=${size} | prompt="${prompt.slice(0, 80)}..."`);

      const response = await fetch(`${EURI_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${euriKey}`,
        },
        body: JSON.stringify({
          model: EURI_IMAGE_MODEL,
          prompt,
          n: 1,
          size,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`[Generate Image] Euri returned ${response.status}:`, errorText);
        return NextResponse.json({
          success: false,
          error: `Euri returned ${response.status}: ${errorText.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      // Euri returns OpenAI-compatible format: { data: [{ url } | { b64_json }] }
      const imageData = data.data?.[0];
      let imageUrl: string | undefined;

      if (imageData?.url) {
        imageUrl = imageData.url;
      } else if (imageData?.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      }

      if (!imageUrl) {
        console.error('[Generate Image] No image in Euri response:', JSON.stringify(data).slice(0, 200));
        return NextResponse.json({
          success: false,
          error: 'Euri returned a response but no image was found.',
        });
      }

      console.log(`[Generate Image] Success | provider=euri | model=${EURI_IMAGE_MODEL}`);

      return NextResponse.json({
        success: true,
        image_url: imageUrl,
        prompt,
        size,
        provider: 'euri',
        model: EURI_IMAGE_MODEL,
      });
    } catch (error) {
      console.error('[Generate Image] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
      });
    }
  }, 'generate_image');
}
