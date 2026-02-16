import { NextResponse } from 'next/server';
import { getUsageStats, logUsage } from '@/lib/usage-store';
import { calculateRealtimeCost } from '@/lib/pricing';

export async function GET() {
  try {
    const stats = await getUsageStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Usage API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve usage data' },
      { status: 500 }
    );
  }
}

// POST: Log voice/realtime usage from client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, usage } = body;

    if (!usage) {
      return NextResponse.json({ error: 'Usage data required' }, { status: 400 });
    }

    const audioInputTokens = usage.input_token_details?.audio_tokens || 0;
    const audioOutputTokens = usage.output_token_details?.audio_tokens || 0;
    const textInputTokens = usage.input_token_details?.text_tokens || 0;
    const textOutputTokens = usage.output_token_details?.text_tokens || 0;
    const totalInput = usage.input_tokens || (audioInputTokens + textInputTokens);
    const totalOutput = usage.output_tokens || (audioOutputTokens + textOutputTokens);

    const cost = calculateRealtimeCost(
      model || 'gpt-4o-realtime',
      audioInputTokens,
      audioOutputTokens,
      textInputTokens,
      textOutputTokens
    );

    const entry = await logUsage({
      timestamp: new Date().toISOString(),
      model: model || 'gpt-4o-realtime',
      provider: 'openai',
      inputTokens: totalInput,
      outputTokens: totalOutput,
      totalTokens: usage.total_tokens || (totalInput + totalOutput),
      cost,
      success: true,
      endpoint: '/realtime',
    });

    console.log(`[Usage] Voice logged: model=${model}, cost=$${cost.toFixed(6)}, audio_in=${audioInputTokens}, audio_out=${audioOutputTokens}`);

    return NextResponse.json({ success: true, id: entry.id, cost });
  } catch (error: any) {
    console.error('[Usage API] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log usage' },
      { status: 500 }
    );
  }
}
