/**
 * n8n Workflow Trigger Tool
 *
 * Lets Angelina trigger any n8n workflow via webhook.
 * Supports both production webhooks and test webhooks.
 *
 * Setup:
 * 1. In n8n, create a Webhook node at the start of your workflow.
 * 2. Set the webhook path (e.g. "angelina-lead-gen").
 * 3. Add N8N_URL in Settings (e.g. https://your-n8n.com or http://localhost:5678).
 * 4. Optionally add N8N_API_KEY for authenticated access.
 *
 * Angelina can then say: "trigger workflow lead-gen with data {name: 'John'}"
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withToolRetry } from '@/lib/tool-retry';

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

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { workflow, data, mode } = await request.json();

      const n8nUrl = await getCred('N8N_URL', 'n8n');
      if (!n8nUrl) {
        return NextResponse.json({
          success: false,
          error: 'n8n not configured. Add your n8n URL in Settings → Automation & Tools.',
        });
      }

      if (!workflow) {
        return NextResponse.json({
          success: false,
          error: 'No workflow specified. Provide a webhook path or workflow ID.',
        });
      }

      // Build webhook URL
      const baseUrl = n8nUrl.replace(/\/$/, '');
      const isTest = mode === 'test';
      const webhookPath = isTest
        ? `${baseUrl}/webhook-test/${workflow}`
        : `${baseUrl}/webhook/${workflow}`;

      // Optional API key for authenticated n8n instances
      const apiKey = await getCred('N8N_API_KEY', 'n8n_api_key');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-N8N-API-KEY'] = apiKey;
      }

      console.log(`[n8n] Triggering workflow: ${webhookPath}`);

      const response = await fetch(webhookPath, {
        method: 'POST',
        headers,
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[n8n] Workflow trigger failed:', response.status, errorText);
        return NextResponse.json({
          success: false,
          error: `n8n returned ${response.status}: ${errorText.slice(0, 200)}`,
        });
      }

      const result = await response.json().catch(() => ({ status: 'triggered' }));
      console.log('[n8n] Workflow triggered successfully:', workflow);

      return NextResponse.json({
        success: true,
        message: `Workflow "${workflow}" triggered successfully via n8n.`,
        result,
        webhookPath,
      });
    } catch (error) {
      console.error('[n8n] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger n8n workflow',
      });
    }
  }, 'n8n_workflow');
}
