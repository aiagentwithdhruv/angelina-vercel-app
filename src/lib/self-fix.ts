/**
 * Self-Fix — When a tool fails, diagnoses the issue and suggests a fix.
 *
 * Instead of Angelina saying "technical glitch", she:
 * 1. Identifies WHY it failed
 * 2. Suggests a fix (reconnect Google, add API key, etc.)
 * 3. Optionally retries with corrected parameters
 *
 * Zero extra API cost — pure error message parsing.
 */

export interface FixSuggestion {
  canAutoFix: boolean;
  fixAction: string;
  userMessage: string;
  retryWithArgs?: Record<string, any>;
}

export function diagnoseToolFailure(
  toolName: string,
  error: string,
  originalArgs: Record<string, any>,
): FixSuggestion {
  const errLower = error.toLowerCase();

  // ── Google tools (email, calendar) ──
  if (toolName === 'check_email' || toolName === 'send_email' || toolName === 'check_calendar') {
    if (errLower.includes('not connected') || errLower.includes('no valid token') || errLower.includes('google')) {
      return {
        canAutoFix: false,
        fixAction: 'reconnect_google',
        userMessage: 'Google is disconnected. Go to Settings → Connect Google to fix this. I\'ll retry once you reconnect.',
      };
    }
    if (errLower.includes('token') || errLower.includes('expired') || errLower.includes('401')) {
      return {
        canAutoFix: false,
        fixAction: 'refresh_google',
        userMessage: 'Google token expired. Go to Settings → Reconnect Google. This happens every few hours.',
      };
    }
  }

  // ── Call tool ──
  if (toolName === 'call_dhruv') {
    if (errLower.includes('twilio') || errLower.includes('not configured')) {
      return {
        canAutoFix: false,
        fixAction: 'add_twilio',
        userMessage: 'Calling isn\'t set up yet. Go to Settings → Automation & Tools and add your Twilio credentials (SID, Token, Phone Number).',
      };
    }
  }

  // ── n8n ──
  if (toolName === 'n8n_workflow') {
    if (errLower.includes('not configured')) {
      return {
        canAutoFix: false,
        fixAction: 'add_n8n',
        userMessage: 'n8n isn\'t connected. Go to Settings → Automation & Tools and add your n8n URL.',
      };
    }
    if (errLower.includes('404') || errLower.includes('not found')) {
      return {
        canAutoFix: false,
        fixAction: 'check_webhook',
        userMessage: `The webhook "${originalArgs.workflow}" wasn't found in n8n. Make sure the workflow is active and the webhook path matches.`,
      };
    }
  }

  // ── MCP ──
  if (toolName === 'mcp_call') {
    if (errLower.includes('not configured')) {
      return {
        canAutoFix: false,
        fixAction: 'add_mcp',
        userMessage: 'MCP server isn\'t connected. Go to Settings → Automation & Tools and add your MCP server URL.',
      };
    }
  }

  // ── Web search ──
  if (toolName === 'web_search') {
    if (errLower.includes('perplexity') || errLower.includes('api key')) {
      return {
        canAutoFix: false,
        fixAction: 'add_perplexity',
        userMessage: 'Web search needs a Perplexity API key. Add it in Settings → Search & Research.',
      };
    }
  }

  // ── Memory tools (auto-fixable) ──
  if (toolName === 'save_memory' || toolName === 'recall_memory') {
    if (errLower.includes('database') || errLower.includes('postgres') || errLower.includes('connect')) {
      return {
        canAutoFix: true,
        fixAction: 'fallback_file_memory',
        userMessage: 'Database is temporarily unavailable. Using local memory as fallback.',
      };
    }
  }

  // ── Task tools (auto-retry with fix) ──
  if (toolName === 'manage_task') {
    if (errLower.includes('not found') && originalArgs.action === 'update') {
      return {
        canAutoFix: true,
        fixAction: 'list_then_update',
        userMessage: 'I couldn\'t find that task. Let me list your tasks first to find the right one.',
        retryWithArgs: { action: 'list' },
      };
    }
  }

  // ── Generic network/timeout ──
  if (errLower.includes('timeout') || errLower.includes('network') || errLower.includes('fetch failed') || errLower.includes('econnrefused')) {
    return {
      canAutoFix: false,
      fixAction: 'network_issue',
      userMessage: 'Network issue — the service might be down temporarily. Try again in a moment.',
    };
  }

  // ── Unknown error ──
  return {
    canAutoFix: false,
    fixAction: 'unknown',
    userMessage: `Tool "${toolName}" failed: ${error}. Let me know if you want me to try a different approach.`,
  };
}
