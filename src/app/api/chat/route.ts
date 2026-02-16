/**
 * Angelina AI - Chat API Route
 * Routes to OpenAI, Anthropic, Perplexity, Google, or OpenRouter based on selected model
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEXT_MODELS } from '@/lib/models';
import { getCostToday, getSessionCost, logUsage } from '@/lib/usage-store';
import { calculateCost } from '@/lib/pricing';
import { memory } from '@/lib/memory';
import { getRoutedModel } from '@/lib/model-router';
import { selectCostOptimizedModel } from '@/lib/cost-policy';
import { evaluateToolApproval } from '@/lib/approval-gate';
import { compactConversation, needsCompaction } from '@/lib/conversation-compactor';
import { resilientCall } from '@/lib/resilient-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Convert our simple tool format to OpenAI-compatible JSON Schema.
 * Our format: parameters have { type, description, required: true, default }
 * OpenAI wants: { type: 'object', properties: {...}, required: ['field1', 'field2'] }
 */
function toOpenAITools(tools: any[]) {
  return tools.map((t: any) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(t.parameters || {})) {
      const param = val as any;
      properties[key] = {
        type: param.type || 'string',
        description: param.description,
      };
      if (param.default !== undefined) {
        properties[key].default = param.default;
      }
      if (param.required) {
        required.push(key);
      }
    }

    return {
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    };
  });
}

/**
 * Convert our simple tool format to Anthropic's format.
 */
function toAnthropicTools(tools: any[]) {
  return tools.map((t: any) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(t.parameters || {})) {
      const param = val as any;
      properties[key] = {
        type: param.type || 'string',
        description: param.description,
      };
      if (param.required) {
        required.push(key);
      }
    }

    return {
      name: t.name,
      description: t.description,
      input_schema: {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
      },
    };
  });
}

// Resolve API key: env var first, then cookie fallback (saved via Settings page)
async function getApiKey(envKey: string, cookieId: string): Promise<string | undefined> {
  const envVal = process.env[envKey];
  if (envVal) return envVal;
  try {
    const cookieStore = await cookies();
    return cookieStore.get(`api_key_${cookieId}`)?.value;
  } catch {
    return undefined;
  }
}

function getProvider(model: string): string {
  if (model.startsWith('or:')) return 'openrouter';
  if (model.startsWith('groq:')) return 'groq';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('sonar')) return 'perplexity';
  if (model.startsWith('gemini-')) return 'google';
  if (model.startsWith('kimi-')) return 'moonshot';
  return 'openai';
}

function getOpenRouterModelId(model: string): string {
  const entry = TEXT_MODELS.find(m => m.id === model);
  return entry?.routerId || model.replace('or:', '');
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

function extractTokenUsage(provider: string, rawData: any): TokenUsage {
  switch (provider) {
    case 'openai':
    case 'openrouter':
    case 'perplexity':
    case 'moonshot':
    case 'groq':
      return {
        inputTokens: rawData.usage?.prompt_tokens || 0,
        outputTokens: rawData.usage?.completion_tokens || 0,
        totalTokens: rawData.usage?.total_tokens || 0,
      };
    case 'anthropic':
      return {
        inputTokens: rawData.usage?.input_tokens || 0,
        outputTokens: rawData.usage?.output_tokens || 0,
        totalTokens: (rawData.usage?.input_tokens || 0) + (rawData.usage?.output_tokens || 0),
      };
    case 'google':
      return {
        inputTokens: rawData.usageMetadata?.promptTokenCount || 0,
        outputTokens: rawData.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: rawData.usageMetadata?.totalTokenCount || 0,
      };
    default:
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
}

// ── OpenAI ──
async function callOpenAI(apiKey: string, model: string, messages: any[], tools?: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: tools ? toOpenAITools(tools) : undefined,
      tool_choice: tools ? 'auto' : undefined,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI API error');

  const choice = data.choices?.[0];
  const modelUsed = data.model || model;

  if (choice?.message?.tool_calls) {
    return {
      toolCalls: choice.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      model: modelUsed,
      rawData: data,
    };
  }

  return { response: choice?.message?.content || '', model: modelUsed, rawData: data };
}

// ── Anthropic Claude ──
async function callAnthropic(apiKey: string, model: string, messages: any[], tools?: any[]) {
  const systemMsg = messages.find((m: any) => m.role === 'system')?.content || '';
  const userMessages = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({ role: m.role, content: m.content }));

  const body: any = {
    model,
    max_tokens: 4096,
    messages: userMessages,
  };
  if (systemMsg) body.system = systemMsg;

  if (tools && tools.length > 0) {
    body.tools = toAnthropicTools(tools);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Anthropic API error');

  const modelUsed = data.model || model;

  const toolUseBlocks = data.content?.filter((b: any) => b.type === 'tool_use') || [];
  if (toolUseBlocks.length > 0) {
    return {
      toolCalls: toolUseBlocks.map((b: any) => ({
        name: b.name,
        arguments: b.input,
      })),
      model: modelUsed,
      rawData: data,
    };
  }

  const textContent = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';
  return { response: textContent, model: modelUsed, rawData: data };
}

// ── Perplexity (OpenAI-compatible) ──
async function callPerplexity(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Perplexity API error');

  const choice = data.choices?.[0];
  return { response: choice?.message?.content || '', model: data.model || model, rawData: data };
}

// ── Google Gemini ──
async function callGemini(apiKey: string, model: string, messages: any[]) {
  const systemMsg = messages.find((m: any) => m.role === 'system')?.content || '';
  const contents = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: any = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API error');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { response: text, model: model, rawData: data };
}

// ── Moonshot / Kimi (OpenAI-compatible) ──
// Note: Moonshot only accepts temperature: 0 or 1 (nothing in between)
async function callMoonshot(apiKey: string, model: string, messages: any[], tools?: any[]) {
  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 1,
      tools: tools ? toOpenAITools(tools) : undefined,
      tool_choice: tools ? 'auto' : undefined,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Moonshot API error');

  const choice = data.choices?.[0];
  const modelUsed = data.model || model;

  if (choice?.message?.tool_calls) {
    return {
      toolCalls: choice.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      model: modelUsed,
      rawData: data,
    };
  }

  return { response: choice?.message?.content || '', model: modelUsed, rawData: data };
}

// ── OpenRouter (OpenAI-compatible, supports all models) ──
async function callOpenRouter(apiKey: string, routerModelId: string, messages: any[], tools?: any[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Angelina AI',
    },
    body: JSON.stringify({
      model: routerModelId,
      messages,
      tools: tools ? toOpenAITools(tools) : undefined,
      tool_choice: tools ? 'auto' : undefined,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error?.message || data.error || 'OpenRouter API error');

  const choice = data.choices?.[0];
  const modelUsed = data.model || routerModelId;

  if (choice?.message?.tool_calls) {
    return {
      toolCalls: choice.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      model: modelUsed,
      rawData: data,
    };
  }

  return { response: choice?.message?.content || '', model: modelUsed, rawData: data };
}

// ── Groq (OpenAI-compatible) ──
async function callGroq(apiKey: string, model: string, messages: any[], tools?: any[]) {
  const modelId = model.replace('groq:', '');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      tools: tools ? toOpenAITools(tools) : undefined,
      tool_choice: tools ? 'auto' : undefined,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Groq API error');

  const choice = data.choices?.[0];
  if (choice?.message?.tool_calls) {
    return {
      toolCalls: choice.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      model: data.model || modelId,
      rawData: data,
    };
  }
  return { response: choice?.message?.content || '', model: data.model || modelId, rawData: data };
}

/**
 * Strip leaked XML/function-call syntax from model responses.
 * Some models (Kimi, Gemini via OR) output <function_calls>, <invoke>, <tool_call>, etc.
 * as raw text instead of using the API's tool_calls field.
 */
function cleanResponseText(text: string): string {
  if (!text) return text;
  // Remove <function_calls>...</function_calls> blocks (with any content inside)
  let cleaned = text.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');
  // Remove <tool_call>...</tool_call> blocks
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '');
  // Remove <invoke ...>...</invoke> blocks
  cleaned = cleaned.replace(/<invoke[\s\S]*?<\/invoke>/gi, '');
  // Remove standalone opening tags if closing tag was missing
  cleaned = cleaned.replace(/<function_calls>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<tool_call>[\s\S]*/gi, '');
  return cleaned.trim();
}

// Provider → env key + cookie ID mapping
const PROVIDER_KEYS: Record<string, { envKey: string; cookieId: string }> = {
  openai: { envKey: 'OPENAI_API_KEY', cookieId: 'openai' },
  anthropic: { envKey: 'ANTHROPIC_API_KEY', cookieId: 'anthropic' },
  perplexity: { envKey: 'PERPLEXITY_API_KEY', cookieId: 'perplexity' },
  google: { envKey: 'GEMINI_API_KEY', cookieId: 'gemini' },
  openrouter: { envKey: 'OPENROUTER_API_KEY', cookieId: 'openrouter' },
  moonshot: { envKey: 'MOONSHOT_API_KEY', cookieId: 'moonshot' },
  groq: { envKey: 'GROQ_API_KEY', cookieId: 'groq' },
};

// ── Smart Model Routing ──
// Detects when tools are likely needed and auto-upgrades to a reliable tool-calling model.
// Uses GPT-4.1-mini (cheap + fast + excellent tool calling) instead of models that
// are unreliable at function calling (Gemini via OpenRouter, Perplexity, etc.)
const TOOL_TRIGGER_PATTERNS = [
  // Task management
  /\b(add|create|new|make|set up|setup)\b.{0,20}\b(task|todo|to-do|to do|item|ticket)\b/i,
  /\b(mark|move|update|change|set|put)\b.{0,30}\b(done|complete|progress|status|pending|archived|in.progress)\b/i,
  /\b(pending|done|complete|progress|in.progress)\b.{0,30}\b(task|todo|to-do|to do|all|back)\b/i,
  /\b(show|list|what are|check|my|get)\b.{0,20}\b(task|todo|to-do|to do|pending|backlog)\b/i,
  /\b(finish|complete|archive|delete|remove)\b.{0,15}\b(task|todo|to-do)\b/i,
  /\b(task|tasks|todo|to-do)\b.{0,20}\b(not working|broken|stuck|bug|fix|wrong)\b/i,
  // Email
  /\b(check|read|send|draft|write|reply)\b.{0,15}\b(email|mail|inbox|gmail)\b/i,
  /\b(email|mail)\b.{0,15}\b(check|send|draft|unread)\b/i,
  // Calendar
  /\b(check|show|what|schedule|book|add)\b.{0,15}\b(calendar|meeting|schedule|event|appointment)\b/i,
  // Web search & research
  /\b(search|look up|find|research|browse|google)\b.{0,20}\b(web|online|internet|about|for)\b/i,
  // Memory
  /\b(remember|save|store|recall|what do you know)\b/i,
  // Call
  /\b(call me|phone me|ring me|call dhruv|remind me by call)\b/i,
  // YouTube
  /\b(youtube|channel|video|subscriber|upload|content).{0,15}\b(stats|analytics|performance|views|trending)\b/i,
  /\b(analyze|check|how.s).{0,15}\b(youtube|channel|video)\b/i,
];

const TOOL_CAPABLE_MODEL = 'gpt-4.1-mini'; // Cheap, fast, excellent at tool calling
const TOOL_CAPABLE_PROVIDER = 'openai';

// Models known to have reliable tool calling (no need to upgrade)
const RELIABLE_TOOL_MODELS = new Set([
  'openai',    // All OpenAI models handle tools well
  'anthropic', // Claude handles tools well
]);

function needsToolUpgrade(messages: any[], tools: any[], currentProvider: string): boolean {
  // No tools defined = no upgrade needed
  if (!tools || tools.length === 0) return false;
  // Already using a reliable provider = no upgrade needed
  if (RELIABLE_TOOL_MODELS.has(currentProvider)) return false;

  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
  if (!lastUserMsg?.content) return false;
  const text = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '';

  // 1. Explicit multi-word patterns (high confidence)
  if (TOOL_TRIGGER_PATTERNS.some(pattern => pattern.test(text))) return true;

  // 2. Broad keyword check — any mention of tool-actionable concepts
  const TOOL_KEYWORDS = /\b(task|tasks|todo|to-?do|email|mail|inbox|gmail|calendar|meeting|schedule|event|search|remember|recall|memory|call me|phone|youtube|channel|pending|in.progress|completed|done|archived|progress|priority|deadline)\b/i;
  if (TOOL_KEYWORDS.test(text)) return true;

  // 3. Conversation continuation — if recent messages had tool calls,
  //    short follow-ups like "yes", "do it", "ok" should stay on the tool model
  const AFFIRMATIVE = /^(yes|yeah|yep|yea|ok|okay|sure|go ahead|do it|please|confirm|alright|right|correct|exactly|that one|this one|go|proceed|y)\b/i;
  if (AFFIRMATIVE.test(text.trim())) {
    const recent = messages.slice(-8);
    const hadToolContext = recent.some((m: any) =>
      typeof m.content === 'string' &&
      (m.content.includes('[Tool Results]') || m.content.includes('[Called tools:') ||
       /\b(task|email|calendar|manage_task|check_email)\b/i.test(m.content))
    );
    if (hadToolContext) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  let requestModel = '';
  let requestProvider = '';
  let routingReason = '';
  let estimatedCost = 0;

  try {
    const body = await request.json();
    const { messages, tools, model, source, userId, approvedTools } = body;
    const DEFAULT_MODEL = 'gpt-4.1';
    let activeModel = model || DEFAULT_MODEL;
    let activeProvider = getProvider(activeModel);
    requestModel = activeModel;
    requestProvider = activeProvider;

    // Did the user explicitly pick a model? If so, respect it.
    const userExplicitModel = Boolean(model && model !== DEFAULT_MODEL);

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userText = lastUserMsg?.content || '';

    // ── 1. Model Router: auto-route only when user didn't explicitly choose ──
    let routing = { routed: false, model: activeModel, complexity: '' };
    if (!userExplicitModel) {
      routing = getRoutedModel(activeModel, userText);
      if (routing.routed) {
        console.log(`[Model Router] ${routing.complexity} → ${routing.model} (was ${activeModel})`);
        activeModel = routing.model;
        activeProvider = getProvider(activeModel);
        requestModel = activeModel;
        requestProvider = activeProvider;
      }
    }

    // ── 1.5 Cost Policy Router (only when user didn't explicitly choose) ──
    let costTodayUsd = 0;
    let sessionCostUsd = 0;
    try {
      costTodayUsd = await getCostToday();
      sessionCostUsd = await getSessionCost(userId || 'anonymous');
    } catch (costErr) {
      console.warn('[Chat] Cost lookup failed (DB may be unavailable), continuing with defaults:', (costErr as Error).message);
    }
    const costDecision = selectCostOptimizedModel({
      requestedModel: activeModel,
      userMessage: userText,
      hasTools: Array.isArray(tools) && tools.length > 0,
      costTodayUsd,
      sessionCostUsd,
    });
    if (!userExplicitModel && costDecision.selectedModel !== activeModel) {
      console.log(
        `[Cost Router] ${activeModel} → ${costDecision.selectedModel} (${costDecision.reason})`,
      );
      activeModel = costDecision.selectedModel;
      activeProvider = getProvider(activeModel);
      requestModel = activeModel;
      requestProvider = activeProvider;
    }
    routingReason = costDecision.reason;
    estimatedCost = costDecision.estimatedCost;

    // ── 2. Smart Tool Routing: upgrade to tool-capable model when tools are needed ──
    const upgraded = needsToolUpgrade(messages, tools, activeProvider);
    if (upgraded) {
      const upgradeKey = await getApiKey(PROVIDER_KEYS[TOOL_CAPABLE_PROVIDER].envKey, PROVIDER_KEYS[TOOL_CAPABLE_PROVIDER].cookieId);
      if (upgradeKey) {
        console.log(`[Smart Route] Tool intent detected. Upgrading ${activeModel} → ${TOOL_CAPABLE_MODEL}`);
        activeModel = TOOL_CAPABLE_MODEL;
        activeProvider = TOOL_CAPABLE_PROVIDER;
        requestModel = activeModel;
        requestProvider = activeProvider;
      }
    }

    // Resolve API key (env var → cookie fallback)
    const keyConfig = PROVIDER_KEYS[activeProvider];
    const apiKey = keyConfig ? await getApiKey(keyConfig.envKey, keyConfig.cookieId) : undefined;

    // ── 3. Selective Memory Injection (top-5 relevant instead of all 500) ──
    try {
      const memoryContext = await memory.getMemoryContext(userText || undefined);
      if (memoryContext) {
        const systemIdx = messages.findIndex((m: any) => m.role === 'system');
        if (systemIdx >= 0) {
          messages[systemIdx].content += memoryContext;
        } else {
          messages.unshift({ role: 'system', content: memoryContext });
        }
      }
    } catch (memErr) {
      console.warn('[Chat] Memory injection failed (DB may be unavailable), skipping:', (memErr as Error).message);
    }

    // ── 4. Conversation Compaction (summarize old messages if too long) ──
    let compacted = false;
    if (needsCompaction(messages)) {
      const orKey = await getApiKey('OPENROUTER_API_KEY', 'openrouter');
      if (orKey) {
        const compactResult = await compactConversation(messages, orKey);
        if (compactResult.compacted) {
          // Replace messages array with compacted version
          messages.length = 0;
          messages.push(...compactResult.messages);
          compacted = true;
          console.log(`[Chat] Compacted conversation, saved ~${compactResult.savedTokens} tokens`);
        }
      }
    }

    console.log(`[Chat] model=${activeModel}, provider=${activeProvider}, hasKey=${!!apiKey}${upgraded ? ' [TOOL-UPGRADED]' : ''}${routing.routed ? ` [ROUTED:${routing.complexity}]` : ''}${compacted ? ' [COMPACTED]' : ''}${source ? ` [src:${source}]` : ''}`);

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for ${activeProvider}. Add it in Settings or .env.local` },
        { status: 500 }
      );
    }

    const safeModel = activeModel;

    // ── 5. Resilient Provider Call (retry + fallback on failure) ──
    // Only pass tools to providers known to handle them reliably via API.
    // Unreliable providers (moonshot, openrouter, google, perplexity) output
    // raw XML text instead of proper tool_calls, breaking the UI.
    const buildProviderCall = async (provider: string, model: string, key: string) => {
      const safeTools = RELIABLE_TOOL_MODELS.has(provider) ? tools : undefined;
      switch (provider) {
        case 'anthropic':
          return callAnthropic(key, model, messages, safeTools);
        case 'perplexity':
          return callPerplexity(key, model, messages);
        case 'google':
          return callGemini(key, model, messages);
        case 'moonshot':
          return callMoonshot(key, model, messages, safeTools);
        case 'openrouter':
          return callOpenRouter(key, getOpenRouterModelId(model), messages, safeTools);
        case 'groq':
          return callGroq(key, model, messages, safeTools);
        default:
          return callOpenAI(key, model, messages, safeTools);
      }
    };

    const { result, provider: usedProvider, model: usedModel, fallback } = await resilientCall(
      {
        provider: activeProvider,
        model: safeModel,
        apiKey,
        callFn: (key, mdl) => buildProviderCall(activeProvider, mdl, key),
      },
      buildProviderCall,
    );

    if (fallback) {
      console.log(`[Chat] Fallback used: ${usedProvider}/${usedModel}`);
    }

    // ── 6. Response-Based Tool Retry ──
    // If an unreliable model responded with text that looks like it WANTED to call tools
    // (e.g. "Let me update that task", XML function calls, etc.), retry with GPT-4.1-mini
    let finalResult = result;
    let finalProvider = usedProvider;
    let finalModel = usedModel;

    if (!RELIABLE_TOOL_MODELS.has(usedProvider) && result.response && !result.toolCalls && tools?.length > 0) {
      const responseText = result.response as string;
      const TOOL_INTENT_PATTERN = /let me (update|check|create|send|search|save|call|move|mark|list|get|find|schedule|draft)|<function_calls>|<tool_call>|<invoke|I'll (update|check|create|send|search|save|call|move|mark|find)/i;
      if (TOOL_INTENT_PATTERN.test(responseText)) {
        console.log(`[Chat] Response-retry: model wanted tools but couldn't use them, retrying with ${TOOL_CAPABLE_MODEL}`);
        const retryKey = await getApiKey(PROVIDER_KEYS[TOOL_CAPABLE_PROVIDER].envKey, PROVIDER_KEYS[TOOL_CAPABLE_PROVIDER].cookieId);
        if (retryKey) {
          try {
            const retryResult = await callOpenAI(retryKey, TOOL_CAPABLE_MODEL, messages, tools);
            finalResult = retryResult;
            finalProvider = TOOL_CAPABLE_PROVIDER;
            finalModel = TOOL_CAPABLE_MODEL;
          } catch (retryErr) {
            console.error('[Chat] Response-retry failed, using original response:', retryErr);
          }
        }
      }
    }

    // Extract token usage and log
    const tokenUsage = extractTokenUsage(finalProvider, finalResult.rawData || {});
    const modelForPricing = finalResult.model || finalModel;
    const cost = calculateCost(modelForPricing, tokenUsage.inputTokens, tokenUsage.outputTokens);

    const toolUsed = finalResult.toolCalls
      ? finalResult.toolCalls.map((tc: any) => tc.name).join(', ')
      : undefined;

    const approval = evaluateToolApproval(
      finalResult.toolCalls ? finalResult.toolCalls.map((tc: any) => tc.name) : [],
      Array.isArray(approvedTools) ? approvedTools : [],
    );

    let responsePayload: any = {
      ...finalResult,
      approvalRequired: !approval.approved,
      blockedTools: approval.blockedTools,
      approvalMessage: approval.message,
    };
    if (!approval.approved) {
      responsePayload = {
        response:
          approval.message ||
          'I need your confirmation before I can run sensitive actions.',
        toolCalls: [],
        approvalRequired: true,
        blockedTools: approval.blockedTools,
      };
    }

    try {
      await logUsage({
        timestamp: new Date().toISOString(),
        model: modelForPricing,
        provider: finalProvider,
        inputTokens: tokenUsage.inputTokens,
        outputTokens: tokenUsage.outputTokens,
        totalTokens: tokenUsage.totalTokens,
        cost,
        success: true,
        toolUsed,
        endpoint:
          source === 'telegram'
            ? `/api/chat (telegram) session:${userId || 'anonymous'}`
            : `/api/chat session:${userId || 'anonymous'}`,
        routingReason,
        estimatedCost,
      });
    } catch (logErr) {
      console.warn('[Chat] Usage logging failed (DB may be unavailable):', (logErr as Error).message);
    }

    // Strip rawData before sending to client, and clean any leaked XML from text responses
    const { rawData, ...clientResult } = responsePayload;
    if (clientResult.response && !clientResult.toolCalls) {
      clientResult.response = cleanResponseText(clientResult.response);
    }

    // Include routing metadata for transparency
    return NextResponse.json({
      ...clientResult,
      _meta: {
        routed: routing.routed,
        complexity: routing.complexity,
        fallback,
        compacted,
        originalModel: model,
        actualModel: usedModel,
        provider: usedProvider,
        routingReason,
        estimatedCost,
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    // Log failed request (best-effort, never mask original error)
    logUsage({
      timestamp: new Date().toISOString(),
      model: requestModel || 'unknown',
      provider: requestProvider || 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
      success: false,
      endpoint: `/api/chat session:${'unknown'}`,
      routingReason,
      estimatedCost,
    }).catch(() => {});

    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
