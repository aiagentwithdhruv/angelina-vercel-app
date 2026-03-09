/**
 * Speech-to-Text Tool — Euri API (Sarvam Saaras v3)
 *
 * Transcribes audio files to text. Supports multilingual (hi-IN, en-IN).
 * Free through Euron.
 *
 * Env:
 *   EURI_API_KEY — Euron API key
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

const EURI_BASE_URL = 'https://api.euron.one/api/v1/euri';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const languageCode = (formData.get('language_code') as string) || 'en-IN';
      const withTimestamps = formData.get('with_timestamps') === 'true';

      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'file is required. Upload an audio file (wav, mp3, flac, ogg, m4a). Max 25MB.',
        });
      }

      const euriKey = process.env.EURI_API_KEY;
      if (!euriKey) {
        return NextResponse.json({
          success: false,
          error: 'EURI_API_KEY not configured.',
        });
      }

      console.log(`[Transcribe] Euri STT | lang=${languageCode} | file=${file.name} | size=${file.size}`);

      const euriForm = new FormData();
      euriForm.append('file', file);
      euriForm.append('model', 'sarvam-stt');
      euriForm.append('language_code', languageCode);
      euriForm.append('mode', 'transcribe');
      if (withTimestamps) {
        euriForm.append('with_timestamps', 'true');
      }

      const response = await fetch(`${EURI_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${euriKey}`,
        },
        body: euriForm,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No details');
        console.error(`[Transcribe] Euri returned ${response.status}:`, errorText);
        return NextResponse.json({
          success: false,
          error: `Euri STT returned ${response.status}: ${errorText.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      console.log(`[Transcribe] Success | text length=${data.text?.length || 0}`);

      return NextResponse.json({
        success: true,
        text: data.text,
        language: languageCode,
        provider: 'euri',
        model: 'sarvam-stt',
        ...(data.segments && { segments: data.segments }),
      });
    } catch (error) {
      console.error('[Transcribe] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  }, 'transcribe_audio');
}
