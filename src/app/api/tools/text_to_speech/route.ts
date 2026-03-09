/**
 * Text-to-Speech Tool — Euri API (Sarvam Bulbul v3)
 *
 * Converts text to speech audio. Supports multilingual voices.
 * Free through Euron.
 *
 * Env:
 *   EURI_API_KEY — Euron API key
 */

import { withToolRetry } from '@/lib/tool-retry';
import { apiSuccess, apiError } from '@/lib/api-response';

const EURI_BASE_URL = 'https://api.euron.one/api/v1/euri';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { input, speaker, language, pace } = await request.json();

      if (!input) {
        return apiError('MISSING_PARAM', 'input is required. Provide the text to convert to speech.', 400);
      }

      const euriKey = process.env.EURI_API_KEY;
      if (!euriKey) {
        return apiError('MISSING_CONFIG', 'EURI_API_KEY not configured.', 500);
      }

      const targetLang = language || 'en-IN';
      const voiceId = speaker || 'shubh';
      const speechPace = pace || 1;

      console.log(`[TTS] Euri | speaker=${voiceId} | lang=${targetLang} | text="${input.slice(0, 60)}..."`);

      const response = await fetch(`${EURI_BASE_URL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${euriKey}`,
        },
        body: JSON.stringify({
          model: 'sarvam-tts',
          input,
          speaker: voiceId,
          target_language_code: targetLang,
          speech_sample_rate: 24000,
          pace: speechPace,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No details');
        console.error(`[TTS] Euri returned ${response.status}:`, errorText);
        return apiError('PROVIDER_ERROR', `Euri TTS returned ${response.status}`, response.status, errorText.slice(0, 300));
      }

      // Response is audio binary — convert to base64
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      console.log(`[TTS] Success | size=${audioBuffer.byteLength} bytes`);

      return apiSuccess({
        audio_base64: base64Audio,
        content_type: 'audio/wav',
        speaker: voiceId,
        language: targetLang,
        provider: 'euri',
        model: 'sarvam-tts',
      });
    } catch (error) {
      console.error('[TTS] Error:', error);
      return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Text-to-speech failed');
    }
  }, 'text_to_speech');
}
