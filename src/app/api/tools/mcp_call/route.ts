/**
 * MCP (Model Context Protocol) Tool Caller
 *
 * Lets Angelina discover and call tools from any MCP server.
 *
 * Two modes:
 * 1. "list" — Discover available tools from the MCP server
 * 2. "call" — Call a specific tool with arguments
 *
 * Setup:
 * 1. Run your MCP server (e.g. http://localhost:3001)
 * 2. Add MCP_SERVER_URL in Settings → Automation & Tools
 * 3. Angelina can then list and call tools dynamically
 *
 * MCP Spec: https://modelcontextprotocol.io/
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
      const { action, tool, arguments: toolArgs } = await request.json();

      const serverUrl = await getCred('MCP_SERVER_URL', 'mcp');
      if (!serverUrl) {
        return NextResponse.json({
          success: false,
          error: 'MCP server not configured. Add your MCP server URL in Settings → Automation & Tools.',
        });
      }

      const baseUrl = serverUrl.replace(/\/$/, '');

      // ── List available tools ──
      if (action === 'list') {
        console.log('[MCP] Listing tools from:', baseUrl);
        const response = await fetch(`${baseUrl}/tools`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: `MCP server returned ${response.status}`,
          });
        }

        const tools = await response.json();
        return NextResponse.json({
          success: true,
          tools,
          message: `Found ${Array.isArray(tools) ? tools.length : 0} tools on MCP server.`,
        });
      }

      // ── Call a tool ──
      if (action === 'call' && tool) {
        console.log(`[MCP] Calling tool: ${tool}`, toolArgs);
        const response = await fetch(`${baseUrl}/tools/${tool}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toolArgs || {}),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({
            success: false,
            error: `MCP tool "${tool}" failed: ${response.status} ${errorText.slice(0, 200)}`,
          });
        }

        const result = await response.json().catch(() => ({ status: 'ok' }));
        return NextResponse.json({
          success: true,
          tool,
          result,
          message: `MCP tool "${tool}" executed successfully.`,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "list" to discover tools or "call" with a tool name.',
      });
    } catch (error) {
      console.error('[MCP] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'MCP call failed',
      });
    }
  }, 'mcp_call');
}
