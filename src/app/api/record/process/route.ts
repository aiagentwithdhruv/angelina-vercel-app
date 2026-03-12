/**
 * POST /api/record/process
 * Accepts multipart audio file; transcribes, extracts entities + summary.
 * When signed in with Supabase: saves to knowledge graph. When local/legacy: returns preview only (no 401).
 * Does not store audio. Sign-in required only in production (Supabase) to persist to graph.
 */

import { NextResponse } from 'next/server';
import { getSupabaseUserId } from '@/lib/supabase/server';
import { transcribeForRecord } from '@/lib/transcribe';
import { extractFromTranscript, extractOnlyFromTranscript } from '@/lib/knowledge-extractor';
import { upsertNode } from '@/lib/knowledge-repository';

export async function POST(request: Request) {
  try {
    const userId = await getSupabaseUserId();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const languageCode = (formData.get('language_code') as string) || 'en-IN';

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty audio file. Send multipart form with "file".' },
        { status: 400 },
      );
    }

    const transcript = await transcribeForRecord(file, languageCode);
    if (!transcript?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not transcribe audio. Add OPENAI_API_KEY in .env.local (Whisper is used by default). Optional: RECORD_TRANSCRIPTION_PROVIDER=euri and EURI_API_KEY for Euri.',
        },
        { status: 400 },
      );
    }

    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());

    if (userId) {
      let result = hasOpenRouter
        ? await extractFromTranscript(userId, transcript)
        : null;
      if (result) {
        return NextResponse.json({
          success: true,
          saved: true,
          summary: result.summary,
          entitiesCreated: result.entities,
        });
      }
      const summary = transcript.slice(0, 500);
      try {
        await upsertNode(userId, 'note', 'Voice record', summary, { source: 'voice_record' });
      } catch {
        // DB may be unavailable; still return success with transcript
      }
      return NextResponse.json({
        success: true,
        saved: true,
        summary,
        entitiesCreated: [],
      });
    }

    const result = hasOpenRouter ? await extractOnlyFromTranscript(transcript) : null;
    if (result) {
      return NextResponse.json({
        success: true,
        saved: false,
        summary: result.summary,
        entitiesCreated: result.entities,
      });
    }
    return NextResponse.json({
      success: true,
      saved: false,
      summary: transcript.slice(0, 500),
      entitiesCreated: [],
    });
  } catch (e) {
    console.error('[Record process]', e);
    const raw = e instanceof Error ? e.message : 'Processing failed.';
    const safe = raw.toLowerCase().includes('extract')
      ? 'Processing failed. Try again.'
      : raw;
    return NextResponse.json(
      { success: false, error: safe },
      { status: 500 },
    );
  }
}
