/**
 * Conversation Compactor — Summarizes old messages to control context growth
 *
 * When conversation exceeds a token threshold, older messages are compressed
 * into a summary while keeping recent exchanges intact.
 *
 * Before: [sys, u1, a1, u2, a2, u3, a3, u4, a4, u5, a5]
 * After:  [sys, summary(u1..a3), u4, a4, u5, a5]
 */

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Rough token estimate: ~4 chars per token (works well for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0); // +4 per msg overhead
}

const TOKEN_THRESHOLD = 3000;    // Trigger compaction above this
const KEEP_RECENT = 6;           // Keep last 3 user-assistant pairs (6 messages)
const SUMMARY_MODEL = 'or:google/gemini-3-flash-preview'; // Cheapest model for summarization

/**
 * Compact a conversation by summarizing older messages.
 * Returns the compacted message array (system + summary + recent).
 *
 * Uses OpenRouter Gemini Flash for the summarization call (cheapest option).
 * Falls back to returning original messages if summarization fails.
 */
export async function compactConversation(
  messages: Message[],
  apiKey: string,
): Promise<{ messages: Message[]; compacted: boolean; savedTokens: number }> {
  const totalTokens = estimateMessagesTokens(messages);

  // No compaction needed
  if (totalTokens <= TOKEN_THRESHOLD || messages.length <= KEEP_RECENT + 1) {
    return { messages, compacted: false, savedTokens: 0 };
  }

  // Split: system prompt | old messages to summarize | recent to keep
  const systemMsg = messages[0]?.role === 'system' ? messages[0] : null;
  const nonSystem = systemMsg ? messages.slice(1) : messages;

  // Keep last KEEP_RECENT messages intact
  const toKeep = nonSystem.slice(-KEEP_RECENT);
  const toSummarize = nonSystem.slice(0, -KEEP_RECENT);

  // Nothing to summarize
  if (toSummarize.length < 2) {
    return { messages, compacted: false, savedTokens: 0 };
  }

  // Build summarization prompt
  const conversationText = toSummarize
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const summaryPrompt = [
    {
      role: 'system' as const,
      content: 'You are a conversation summarizer. Summarize the following conversation into a concise paragraph. Preserve key facts, decisions, names, numbers, and any action items. Be factual and concise.',
    },
    {
      role: 'user' as const,
      content: `Summarize this conversation:\n\n${conversationText}`,
    },
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'Angelina AI (Compactor)',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: summaryPrompt,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const summaryText = data.choices?.[0]?.message?.content;

    if (!summaryText) {
      console.warn('[Compactor] Empty summary response, skipping compaction');
      return { messages, compacted: false, savedTokens: 0 };
    }

    // Build compacted messages
    const compacted: Message[] = [];
    if (systemMsg) compacted.push(systemMsg);

    compacted.push({
      role: 'assistant',
      content: `[Previous conversation summary: ${summaryText}]`,
    });

    compacted.push(...toKeep);

    const savedTokens = estimateMessagesTokens(toSummarize) - estimateTokens(summaryText);
    console.log(`[Compactor] Compressed ${toSummarize.length} messages → summary. Saved ~${savedTokens} tokens`);

    return { messages: compacted, compacted: true, savedTokens };
  } catch (error) {
    console.error('[Compactor] Summarization failed, using original messages:', error);
    return { messages, compacted: false, savedTokens: 0 };
  }
}

/**
 * Check if conversation needs compaction (without actually doing it).
 * Useful for logging/metrics.
 */
export function needsCompaction(messages: Message[]): boolean {
  return estimateMessagesTokens(messages) > TOKEN_THRESHOLD && messages.length > KEEP_RECENT + 1;
}

export { estimateTokens, estimateMessagesTokens, TOKEN_THRESHOLD };
