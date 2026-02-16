/**
 * Call Dhruv Tool - Two modes:
 * 1. "remind" (default) → Twilio direct TTS call (cheap, one-way, just speaks & hangs up)
 * 2. "talk" → Vapi AI call (2-way conversation with Angelina)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getCred(envKey: string, cookieId: string): Promise<string | undefined> {
  const envVal = process.env[envKey];
  if (envVal) return envVal;
  try {
    const cookieStore = await cookies();
    return cookieStore.get(`api_key_${cookieId}`)?.value;
  } catch {
    return undefined;
  }
}

// Twilio direct call — just speaks the message and hangs up
async function callViaTwilio(message: string, type: string) {
  const accountSid = await getCred('TWILIO_ACCOUNT_SID', 'twilio_sid');
  const authToken = await getCred('TWILIO_AUTH_TOKEN', 'twilio_token');
  const twilioNumber = await getCred('TWILIO_PHONE_NUMBER', 'twilio_phone');
  const dhruvPhone = await getCred('DHRUV_PHONE_NUMBER', 'dhruv_phone');

  if (!accountSid || !authToken || !twilioNumber || !dhruvPhone) {
    throw new Error('Twilio credentials not configured. Add them in Settings → Automation & Tools.');
  }

  // TwiML: Speak the message in a nice voice, then hang up
  const twiml = `<Response><Say voice="Polly.Joanna" language="en-US">${escapeXml(message)}</Say><Pause length="1"/><Say voice="Polly.Joanna">Talk soon Dhruv!</Say></Response>`;

  const params = new URLSearchParams({
    To: dhruvPhone,
    From: twilioNumber,
    Twiml: twiml,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
      body: params.toString(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.more_info || 'Twilio call failed');
  }

  return {
    success: true,
    message: `Reminder call initiated to Dhruv via Twilio! Type: ${type}`,
    callSid: data.sid,
    status: data.status,
    mode: 'twilio',
    phoneNumber: dhruvPhone,
  };
}

// Vapi AI call — 2-way conversation with Angelina
async function callViaVapi(message: string, type: string) {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const dhruvPhone = process.env.DHRUV_PHONE_NUMBER;

  if (!apiKey) {
    throw new Error('VAPI_API_KEY not configured in .env.local');
  }

  const callSystemPrompt = `You are Angelina, Dhruv's personal AI companion from Agentic AI Hub. You are making a quick ${type} call. Rules:
1) Deliver the message naturally and warmly in under 15 seconds.
2) If Dhruv responds with ok, thanks, or bye — say "Talk soon Dhruv!" and end the call.
3) Be warm, energetic, and encouraging.
4) Do NOT ask open-ended questions or start new topics.
5) If Dhruv asks a question, give a brief answer and wrap up.
6) Your goal is a quick ${type} nudge, not a long conversation.
7) End every call positively.`;

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customers: [{ number: dhruvPhone }],
      assistantOverrides: {
        firstMessage: message,
        maxDurationSeconds: 60,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: callSystemPrompt }],
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Vapi call failed');
  }

  return {
    success: true,
    message: `AI call initiated to Dhruv via Vapi! Type: ${type}`,
    callId: data.id,
    status: data.status,
    mode: 'vapi',
    phoneNumber: dhruvPhone,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(request: Request) {
  try {
    const { message, call_type, mode } = await request.json();

    const callMessage = message || "Hey Dhruv! Quick check-in from Angelina. Stay focused on your top priorities today. You're doing great, keep pushing!";
    const type = call_type || 'reminder';
    // mode: "talk" for Vapi 2-way, anything else → Twilio direct
    const callMode = mode || 'remind';

    let result;
    if (callMode === 'talk') {
      console.log(`[Call Dhruv] Vapi mode - ${type}`);
      result = await callViaVapi(callMessage, type);
    } else {
      console.log(`[Call Dhruv] Twilio mode - ${type}`);
      result = await callViaTwilio(callMessage, type);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Call Dhruv] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
