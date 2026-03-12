/**
 * Transcription helpers for record flow.
 * Default: use Whisper (OpenAI) if OPENAI_API_KEY is set; else Euri if EURI_API_KEY is set.
 * Set RECORD_TRANSCRIPTION_PROVIDER=euri only if you want to force Euri (optional).
 */

export type TranscriptionProvider = 'whisper' | 'euri';

export function getRecordTranscriptionProvider(): TranscriptionProvider {
  const explicit = process.env.RECORD_TRANSCRIPTION_PROVIDER?.toLowerCase();
  if (explicit === 'whisper' || explicit === 'euri') return explicit;
  if (process.env.OPENAI_API_KEY) return 'whisper';
  return 'euri';
}

/**
 * Transcribe audio via OpenAI Whisper. Best quality for Hindi + English.
 * Requires OPENAI_API_KEY in .env.local (same key as for chat/Realtime).
 */
export async function transcribeWithWhisper(file: File | Blob): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const formData = new FormData();
  const blob = file instanceof File ? file : new File([file], 'audio.webm', { type: file.type || 'audio/webm' });
  formData.append('file', blob);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error('[Transcribe] Whisper error:', res.status, err.slice(0, 200));
    return null;
  }

  const text = await res.text();
  return text?.trim() || null;
}

/**
 * Transcribe audio via Euri (Sarvam). Free tier; may have lower quality on some accents.
 */
export async function transcribeWithEuri(
  file: File | Blob,
  languageCode = 'en-IN',
): Promise<string | null> {
  const euriKey = process.env.EURI_API_KEY;
  if (!euriKey) return null;

  const formData = new FormData();
  const blob = file instanceof File ? file : new File([file], 'audio.webm', { type: file.type || 'audio/webm' });
  formData.append('file', blob);
  formData.append('model', 'sarvam-stt');
  formData.append('language_code', languageCode);
  formData.append('mode', 'transcribe');

  const res = await fetch('https://api.euron.one/api/v1/euri/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${euriKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error('[Transcribe] Euri error:', res.status, err.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as { text?: string };
  return typeof data.text === 'string' ? data.text.trim() : null;
}

/**
 * Transcribe for "Keep this record". Uses Whisper when OPENAI_API_KEY is set (default); Euri optional.
 */
export async function transcribeForRecord(file: File | Blob, languageCode = 'en-IN'): Promise<string | null> {
  const provider = getRecordTranscriptionProvider();
  if (provider === 'whisper') return transcribeWithWhisper(file);
  const euriResult = await transcribeWithEuri(file, languageCode);
  if (euriResult !== null) return euriResult;
  if (process.env.OPENAI_API_KEY) return transcribeWithWhisper(file);
  return null;
}
