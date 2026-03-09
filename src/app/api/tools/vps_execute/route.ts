/**
 * VPS Execute Tool — Phase 2 (VPS Bridge)
 *
 * Routes commands to OpenClaw on Dhruv's VPS for execution.
 * Architecture: Angelina (Vercel) -> HTTP POST -> OpenClaw Gateway (VPS:18789) -> Execute
 *
 * Agents: arjun, scout, creator, devops
 *
 * Env:
 *   OPENCLAW_VPS_URL — e.g. http://72.61.115.79:18789
 *   WORKER_API_KEY   — shared secret for VPS auth
 */

import { NextResponse } from 'next/server';
import { withToolRetry } from '@/lib/tool-retry';

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { command, agent } = await request.json();

      if (!command) {
        return NextResponse.json({
          success: false,
          error: 'command is required. Provide the instruction to execute on the VPS.',
        });
      }

      const vpsUrl = process.env.OPENCLAW_VPS_URL;
      if (!vpsUrl) {
        return NextResponse.json({
          success: false,
          error: 'OPENCLAW_VPS_URL not configured. Add it in environment variables.',
        });
      }

      const workerKey = process.env.WORKER_API_KEY;
      if (!workerKey) {
        return NextResponse.json({
          success: false,
          error: 'WORKER_API_KEY not configured. Add it in environment variables.',
        });
      }

      // Build the user message, optionally scoping to an agent
      const agentPrefix = agent ? `[Agent: ${agent}] ` : '';
      const userMessage = `${agentPrefix}${command}`;

      const endpoint = `${vpsUrl.replace(/\/$/, '')}/v1/chat/completions`;
      console.log(`[VPS Execute] Sending to ${endpoint} | agent=${agent || 'default'}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${workerKey}`,
          },
          body: JSON.stringify({
            model: agent || 'default',
            messages: [
              { role: 'user', content: userMessage },
            ],
          }),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          return NextResponse.json({
            success: false,
            error: 'VPS request timed out after 30 seconds. The server may be unreachable or the command is taking too long.',
          });
        }
        return NextResponse.json({
          success: false,
          error: `VPS unreachable: ${fetchErr.message || 'Connection failed'}. Check if OpenClaw is running at ${vpsUrl}.`,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`[VPS Execute] VPS returned ${response.status}:`, errorText);
        return NextResponse.json({
          success: false,
          error: `VPS returned ${response.status}: ${errorText.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      // Extract the response text from OpenAI-compatible format
      const responseText =
        data.choices?.[0]?.message?.content ||
        data.response ||
        data.output ||
        JSON.stringify(data);

      console.log(`[VPS Execute] Success | agent=${agent || 'default'} | response length=${responseText.length}`);

      return NextResponse.json({
        success: true,
        agent: agent || 'default',
        response: responseText,
        command,
      });
    } catch (error) {
      console.error('[VPS Execute] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'VPS execution failed',
      });
    }
  }, 'vps_execute');
}
