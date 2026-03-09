/**
 * Generate Image Tool — Phase 6 (Content Creation)
 *
 * Generates images using fal.ai's Flux Dev model.
 * Prompt in, image URL out.
 *
 * Env:
 *   FAL_KEY — fal.ai API key (https://fal.ai/dashboard/keys)
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

type ImageSize = 'landscape_16_9' | 'square' | 'portrait_4_3';

const VALID_SIZES: ImageSize[] = ['landscape_16_9', 'square', 'portrait_4_3'];

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

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return NextResponse.json({
          success: false,
          error: 'FAL_KEY not configured. Add your fal.ai API key in environment variables (get one at https://fal.ai/dashboard/keys).',
        });
      }

      const size: ImageSize = VALID_SIZES.includes(image_size) ? image_size : 'landscape_16_9';

      console.log(`[Generate Image] Requesting fal.ai | size=${size} | prompt="${prompt.slice(0, 80)}..."`);

      const response = await fetch('https://queue.fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_size: size,
          num_images: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`[Generate Image] fal.ai returned ${response.status}:`, errorText);
        return NextResponse.json({
          success: false,
          error: `fal.ai returned ${response.status}: ${errorText.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) {
        console.error('[Generate Image] No image URL in response:', JSON.stringify(data).slice(0, 200));
        return NextResponse.json({
          success: false,
          error: 'fal.ai returned a response but no image URL was found.',
        });
      }

      console.log(`[Generate Image] Success | url=${imageUrl.slice(0, 80)}...`);

      return NextResponse.json({
        success: true,
        image_url: imageUrl,
        prompt,
        size,
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
