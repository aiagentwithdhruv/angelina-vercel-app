/**
 * Angelina Memory System
 *
 * Memory tiers:
 * 1) Persistent app memory via repository (Postgres+pgvector or file fallback)
 * 2) Session conversation memory in process
 * 3) Long-term summaries synced to GitHub
 */

import {
  getMemoryRepository,
  MemoryEntry,
  MemoryImportance,
  MemoryType,
} from '@/lib/memory-repository';

export interface ConversationSummary {
  id: string;
  date: string;
  topics: string[];
  keyPoints: string[];
  decisions: string[];
  tasks: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

class ShortTermMemory {
  private currentConversation: { role: 'user' | 'assistant'; content: string; timestamp: string }[] = [];
  private repo = getMemoryRepository();

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const newEntry = await this.repo.add(entry);
    console.log(`[Memory] Saved: ${entry.type} - ${entry.topic}`);
    return newEntry;
  }

  addMessage(role: 'user' | 'assistant', content: string) {
    this.currentConversation.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  getConversation() {
    return this.currentConversation;
  }

  async getRecent(count = 10): Promise<MemoryEntry[]> {
    return this.repo.getRecent(count);
  }

  async search(query: string, limit = 20): Promise<MemoryEntry[]> {
    return this.repo.search(query, limit);
  }

  async getByType(type: MemoryType): Promise<MemoryEntry[]> {
    return this.repo.getByType(type);
  }

  async getHighImportance(limit = 10): Promise<MemoryEntry[]> {
    return this.repo.getHighImportance(limit);
  }

  async getAll(): Promise<MemoryEntry[]> {
    return this.repo.getAll();
  }

  async clear() {
    this.currentConversation = [];
    await this.repo.clear();
  }

  async exportForLongTerm(): Promise<MemoryEntry[]> {
    return this.repo.getAll();
  }
}

// Long-term memory (GitHub synced)
class LongTermMemory {
  private repo = 'aiagentwithdhruv/Angelina';
  private basePath = 'memory';

  async saveToGitHub(category: string, filename: string, content: string): Promise<boolean> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('[Memory] No GitHub token configured');
      return false;
    }

    const filePath = `${this.basePath}/${category}/${filename}.md`;

    try {
      const existsResponse = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      let sha: string | undefined;
      if (existsResponse.ok) {
        const existingFile = await existsResponse.json();
        sha = existingFile.sha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `[Angelina Memory] Update ${category}/${filename}`,
            content: Buffer.from(content).toString('base64'),
            sha,
          }),
        }
      );

      if (response.ok) {
        console.log(`[Memory] Saved to GitHub: ${filePath}`);
        return true;
      } else {
        console.error('[Memory] GitHub save failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('[Memory] GitHub error:', error);
      return false;
    }
  }

  async loadFromGitHub(category: string, filename: string): Promise<string | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return null;

    const filePath = `${this.basePath}/${category}/${filename}.md`;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.error('[Memory] GitHub load error:', error);
      return null;
    }
  }

  async listMemories(category: string): Promise<string[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return [];

    const filePath = `${this.basePath}/${category}`;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const files = await response.json();
        return files.map((f: { name: string }) => f.name.replace('.md', ''));
      }
      return [];
    } catch (error) {
      console.error('[Memory] GitHub list error:', error);
      return [];
    }
  }

  formatConversationSummary(summary: ConversationSummary): string {
    return `# Conversation Summary - ${summary.date}

## Topics Discussed
${summary.topics.map(t => `- ${t}`).join('\n')}

## Key Points
${summary.keyPoints.map(p => `- ${p}`).join('\n')}

## Decisions Made
${summary.decisions.length > 0 ? summary.decisions.map(d => `- ${d}`).join('\n') : '- None'}

## Tasks Created
${summary.tasks.length > 0 ? summary.tasks.map(t => `- ${t}`).join('\n') : '- None'}

## Overall Sentiment
${summary.sentiment}

---
*Saved by Angelina AI*
`;
  }
}

// Memory Manager
class MemoryManager {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
  private syncThreshold = 10;

  constructor() {
    this.shortTerm = new ShortTermMemory();
    this.longTerm = new LongTermMemory();
  }

  async rememberFact(topic: string, content: string, importance: MemoryImportance = 'medium') {
    return this.shortTerm.add({
      topic,
      content,
      type: 'fact',
      tags: [topic.toLowerCase()],
      importance,
    });
  }

  async rememberClient(name: string, details: string) {
    return this.shortTerm.add({
      topic: name,
      content: details,
      type: 'client',
      tags: ['client', name.toLowerCase()],
      importance: 'high',
    });
  }

  async rememberPreference(topic: string, content: string) {
    return this.shortTerm.add({
      topic,
      content,
      type: 'preference',
      tags: ['preference', topic.toLowerCase()],
      importance: 'high',
    });
  }

  async rememberDecision(topic: string, decision: string) {
    return this.shortTerm.add({
      topic,
      content: decision,
      type: 'decision',
      tags: ['decision', topic.toLowerCase()],
      importance: 'high',
    });
  }

  async rememberTask(task: string, context: string) {
    return this.shortTerm.add({
      topic: 'task',
      content: `${task} - ${context}`,
      type: 'task',
      tags: ['task'],
      importance: 'high',
    });
  }

  addMessage(role: 'user' | 'assistant', content: string) {
    this.shortTerm.addMessage(role, content);

    const conversation = this.shortTerm.getConversation();
    if (conversation.length >= this.syncThreshold * 2) {
      this.syncToLongTerm();
    }
  }

  // Build memory context string for system prompt injection
  // If query is provided, returns only top-5 relevant memories (selective injection)
  // If no query, falls back to category-based injection (original behavior)
  async getMemoryContext(query?: string): Promise<string> {
    const all = await this.shortTerm.getAll();
    if (all.length === 0) return '';

    // Selective injection: score and rank memories by relevance to query
    if (query) {
      let scored = this.scoreMemories(all, query);
      const semantic = await this.shortTerm.search(query, 5);
      if (semantic.length > 0) {
        const semanticIds = new Set(semantic.map((entry) => entry.id));
        scored = [
          ...semantic.map((entry, index) => ({ entry, score: 100 - index })),
          ...scored.filter(({ entry }) => !semanticIds.has(entry.id)),
        ];
      }
      if (scored.length === 0) {
        // Always include high-importance items even if no keyword match
        const important = all.filter(e => e.importance === 'high').slice(0, 3);
        if (important.length === 0) return '';
        const sections = ['\n--- ANGELINA\'S MEMORY ---'];
        important.forEach(e => sections.push(`- [${e.type}] ${e.topic}: ${e.content}`));
        sections.push('--- END MEMORY ---');
        return sections.join('\n');
      }

      const sections = ['\n--- ANGELINA\'S MEMORY (relevant to this conversation) ---'];
      scored.slice(0, 5).forEach(({ entry }) => {
        sections.push(`- [${entry.type}] ${entry.topic}: ${entry.content}`);
      });
      sections.push('--- END MEMORY ---');
      return sections.join('\n');
    }

    // Fallback: category-based injection (original behavior)
    const sections: string[] = ['\n--- ANGELINA\'S MEMORY (things you remember) ---'];

    const clients = all.filter(e => e.type === 'client');
    if (clients.length > 0) {
      sections.push('\nClients:');
      clients.slice(0, 10).forEach(c => sections.push(`- ${c.topic}: ${c.content}`));
    }

    const facts = all.filter(e => e.type === 'fact');
    if (facts.length > 0) {
      sections.push('\nFacts:');
      facts.slice(0, 10).forEach(f => sections.push(`- ${f.topic}: ${f.content}`));
    }

    const prefs = all.filter(e => e.type === 'preference');
    if (prefs.length > 0) {
      sections.push('\nPreferences:');
      prefs.slice(0, 5).forEach(p => sections.push(`- ${p.topic}: ${p.content}`));
    }

    const tasks = all.filter(e => e.type === 'task');
    if (tasks.length > 0) {
      sections.push('\nTasks:');
      tasks.slice(0, 5).forEach(t => sections.push(`- ${t.content}`));
    }

    const decisions = all.filter(e => e.type === 'decision');
    if (decisions.length > 0) {
      sections.push('\nDecisions:');
      decisions.slice(0, 5).forEach(d => sections.push(`- ${d.topic}: ${d.content}`));
    }

    sections.push('\n--- END MEMORY ---');
    return sections.join('\n');
  }

  // Score memories by relevance to a query using keyword matching + importance weighting
  private scoreMemories(entries: MemoryEntry[], query: string): { entry: MemoryEntry; score: number }[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (queryWords.length === 0) return [];

    const scored = entries.map(entry => {
      let score = 0;
      const text = `${entry.topic} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();

      // Keyword matches
      for (const word of queryWords) {
        if (text.includes(word)) score += 2;
      }

      // Exact topic match bonus
      if (entry.topic.toLowerCase().includes(query.toLowerCase().slice(0, 20))) score += 3;

      // Importance weighting
      if (entry.importance === 'high') score += 2;
      else if (entry.importance === 'medium') score += 1;

      // Recency bonus (newer = higher)
      const age = Date.now() - new Date(entry.timestamp).getTime();
      const daysSince = age / (1000 * 60 * 60 * 24);
      if (daysSince < 1) score += 2;
      else if (daysSince < 7) score += 1;

      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  async getRelevantContext(query: string, maxTokens = 500): Promise<string> {
    const contexts: string[] = [];

    const shortTermResults = await this.shortTerm.search(query, 3);
    if (shortTermResults.length > 0) {
      contexts.push('**Recent Memory:**');
      shortTermResults.slice(0, 3).forEach(entry => {
        contexts.push(`- ${entry.topic}: ${entry.content}`);
      });
    }

    const important = await this.shortTerm.getHighImportance(3);
    if (important.length > 0) {
      contexts.push('\n**Important:**');
      important.slice(0, 3).forEach(entry => {
        contexts.push(`- ${entry.topic}: ${entry.content}`);
      });
    }

    const tasks = await this.shortTerm.getByType('task');
    if (tasks.length > 0) {
      contexts.push('\n**Active Tasks:**');
      tasks.slice(0, 3).forEach(entry => {
        contexts.push(`- ${entry.content}`);
      });
    }

    const contextString = contexts.join('\n');

    if (contextString.length > maxTokens * 4) {
      return contextString.slice(0, maxTokens * 4) + '...';
    }

    return contextString;
  }

  async syncToLongTerm() {
    const conversation = this.shortTerm.getConversation();
    if (conversation.length < 4) return;

    const date = new Date().toISOString().split('T')[0];
    const filename = `conversation_${date}_${Date.now()}`;

    const summary: ConversationSummary = {
      id: filename,
      date: new Date().toISOString(),
      topics: this.extractTopics(conversation),
      keyPoints: this.extractKeyPoints(conversation),
      decisions: [],
      tasks: (await this.shortTerm.getByType('task')).map(t => t.content),
      sentiment: 'positive',
    };

    const content = this.longTerm.formatConversationSummary(summary);
    await this.longTerm.saveToGitHub('conversations', filename, content);

    const facts = await this.shortTerm.getByType('fact');
    const clients = await this.shortTerm.getByType('client');
    const allFacts = [...facts, ...clients];
    if (allFacts.length > 0) {
      const factsContent = allFacts.map(f => `- **${f.topic}** (${f.type}): ${f.content}`).join('\n');
      await this.longTerm.saveToGitHub('facts', `facts_${date}`, `# Facts & Clients - ${date}\n\n${factsContent}`);
    }

    console.log('[Memory] Synced to long-term memory');
  }

  private extractTopics(conversation: { role: string; content: string }[]): string[] {
    const topics = new Set<string>();
    const keywords = ['email', 'task', 'meeting', 'client', 'automation', 'workflow', 'code', 'money', 'sales'];

    conversation.forEach(msg => {
      keywords.forEach(keyword => {
        if (msg.content.toLowerCase().includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  private extractKeyPoints(conversation: { role: string; content: string }[]): string[] {
    return conversation
      .filter(msg => msg.role === 'assistant')
      .slice(-3)
      .map(msg => msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''));
  }
}

// Singleton instance
export const memory = new MemoryManager();

export type { ShortTermMemory, LongTermMemory, MemoryManager };
