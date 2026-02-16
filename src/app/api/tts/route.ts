/**
 * Angelina AI - Text-to-Speech API
 * Converts text to spoken audio using Deepgram
 */

import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'aura-asteria-en' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Call Deepgram TTS API
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error(`Deepgram TTS failed: ${response.statusText}`);
    }

    // Return audio as blob
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Text-to-speech failed' },
      { status: 500 }
    );
  }
}
