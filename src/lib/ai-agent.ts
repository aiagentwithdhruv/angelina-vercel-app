/**
 * Angelina AI - Agent Core
 * The brain that processes requests and calls tools
 */

// Tool definitions that Angelina can use
export const tools = {
  // Email tools
  check_email: {
    name: 'check_email',
    description: 'Check and summarize emails from inbox',
    parameters: {
      count: { type: 'number', description: 'Number of emails to check', default: 5 },
      filter: { type: 'string', description: 'Filter: unread, important, all', default: 'unread' },
    },
  },
  send_email: {
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  draft_email: {
    name: 'draft_email',
    description: 'Draft an email reply',
    parameters: {
      emailId: { type: 'string', description: 'ID of email to reply to' },
      tone: { type: 'string', description: 'Tone: professional, friendly, brief' },
    },
  },

  // Task tools
  create_task: {
    name: 'create_task',
    description: 'Create a task in ClickUp',
    parameters: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      dueDate: { type: 'string' },
      priority: { type: 'string', description: '1=urgent, 2=high, 3=normal, 4=low' },
    },
  },
  list_tasks: {
    name: 'list_tasks',
    description: 'List tasks from ClickUp',
    parameters: {
      status: { type: 'string', description: 'Filter by status' },
      limit: { type: 'number', default: 10 },
    },
  },

  // Calendar tools
  check_calendar: {
    name: 'check_calendar',
    description: 'Check upcoming calendar events',
    parameters: {
      days: { type: 'number', description: 'Days to look ahead', default: 7 },
    },
  },
  create_event: {
    name: 'create_event',
    description: 'Create a calendar event',
    parameters: {
      title: { type: 'string', required: true },
      date: { type: 'string', required: true },
      time: { type: 'string' },
      duration: { type: 'number', description: 'Duration in minutes', default: 60 },
    },
  },

  // Document tools
  generate_document: {
    name: 'generate_document',
    description: 'Generate a document (PDF, DOCX)',
    parameters: {
      type: { type: 'string', description: 'quotation, invoice, report, letter' },
      data: { type: 'object', description: 'Document data' },
      format: { type: 'string', description: 'pdf, docx', default: 'pdf' },
    },
  },

  // Search tools
  web_search: {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', required: true },
    },
  },
};

// The AI Agent class
export class AngelinaAgent {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `You are Angelina, a friendly and efficient AI assistant. 
You help with emails, tasks, calendar, and various business operations.

Your personality:
- Professional but warm
- Proactive - anticipate what the user might need
- Concise - don't be verbose
- Always confirm before taking irreversible actions

When the user asks you to do something, use the appropriate tool.
Always explain what you're doing in a natural, conversational way.`;
  }

  async processMessage(userMessage: string): Promise<{
    response: string;
    toolCalls?: Array<{ tool: string; args: object; result: any }>;
    shouldSpeak: boolean;
  }> {
    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    try {
      // Call OpenAI/Claude API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory,
          ],
          tools: Object.values(tools),
        }),
      });

      const data = await response.json();

      // If AI wants to use tools
      if (data.toolCalls && data.toolCalls.length > 0) {
        const toolResults = [];

        for (const toolCall of data.toolCalls) {
          const result = await this.executeTool(toolCall.name, toolCall.arguments);
          toolResults.push({
            tool: toolCall.name,
            args: toolCall.arguments,
            result,
          });
        }

        // Get final response after tool execution
        const finalResponse = await this.getFinalResponse(toolResults);
        
        this.conversationHistory.push({ role: 'assistant', content: finalResponse });

        return {
          response: finalResponse,
          toolCalls: toolResults,
          shouldSpeak: true,
        };
      }

      // Regular response without tools
      this.conversationHistory.push({ role: 'assistant', content: data.response });

      return {
        response: data.response,
        shouldSpeak: true,
      };

    } catch (error) {
      console.error('Agent error:', error);
      return {
        response: "I'm sorry, I encountered an error. Please try again.",
        shouldSpeak: true,
      };
    }
  }

  private async executeTool(toolName: string, args: object): Promise<any> {
    console.log(`🔧 Executing tool: ${toolName}`, args);

    // Call the appropriate API endpoint for each tool
    const response = await fetch(`/api/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });

    return response.json();
  }

  private async getFinalResponse(toolResults: Array<{ tool: string; result: any }>): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory,
          { 
            role: 'system', 
            content: `Tool results: ${JSON.stringify(toolResults)}. 
            Summarize these results naturally for the user.` 
          },
        ],
      }),
    });

    const data = await response.json();
    return data.response;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Export singleton
export const angelina = new AngelinaAgent();
